import { afterEach, describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeCredentials, clientIp } from "@/lib/credentials-authorize";
import { LOGIN_RATE_LIMIT } from "@/lib/rate-limit";

const PASSWORD = "senha-correta-123";

let createdUserIds: string[] = [];

async function makeUser() {
  const user = await prisma.user.create({
    data: {
      name: "Login User",
      email: `login-${crypto.randomUUID()}@example.com`,
      password: await bcrypt.hash(PASSWORD, 4),
    },
  });
  createdUserIds.push(user.id);
  return user;
}

/** IP único por teste: isola o balde de rate limit entre os casos. */
function uniqueIp() {
  return `ip-${crypto.randomUUID()}`;
}

afterEach(async () => {
  vi.useRealTimers();
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

describe("authorizeCredentials", () => {
  it("autentica login legítimo dentro da cota", async () => {
    const user = await makeUser();
    const result = await authorizeCredentials(
      { email: user.email, password: PASSWORD },
      uniqueIp()
    );
    expect(result).toEqual({ id: user.id, name: user.name, email: user.email });
  });

  it("rejeita senha errada sem estourar a cota", async () => {
    const user = await makeUser();
    const result = await authorizeCredentials(
      { email: user.email, password: "senha-errada" },
      uniqueIp()
    );
    expect(result).toBeNull();
  });

  it("bloqueia além da cota mesmo com a senha correta (erro genérico)", async () => {
    const user = await makeUser();
    const ip = uniqueIp();

    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++) {
      await authorizeCredentials({ email: user.email, password: "senha-errada" }, ip);
    }

    const result = await authorizeCredentials(
      { email: user.email, password: PASSWORD },
      ip
    );
    expect(result).toBeNull();
  });

  it("cota estourada não revela se o email existe (mesmo null para ambos)", async () => {
    const user = await makeUser();
    const ip = uniqueIp();
    const inexistente = `nao-existe-${crypto.randomUUID()}@example.com`;

    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++) {
      await authorizeCredentials({ email: user.email, password: "x" }, ip);
      await authorizeCredentials({ email: inexistente, password: "x" }, ip);
    }

    const existente = await authorizeCredentials(
      { email: user.email, password: PASSWORD },
      ip
    );
    const desconhecido = await authorizeCredentials(
      { email: inexistente, password: "x" },
      ip
    );
    expect(existente).toBeNull();
    expect(desconhecido).toBeNull();
  });

  it("reabre a janela após windowMs e volta a aceitar login", async () => {
    const user = await makeUser();
    const ip = uniqueIp();

    for (let i = 0; i < LOGIN_RATE_LIMIT.limit; i++) {
      await authorizeCredentials({ email: user.email, password: "senha-errada" }, ip);
    }
    expect(
      await authorizeCredentials({ email: user.email, password: PASSWORD }, ip)
    ).toBeNull();

    // Só o Date é mockado: bcrypt/prisma continuam com scheduling real.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + LOGIN_RATE_LIMIT.windowMs);

    const result = await authorizeCredentials(
      { email: user.email, password: PASSWORD },
      ip
    );
    expect(result).toEqual({ id: user.id, name: user.name, email: user.email });
  });

  it("ignora credenciais incompletas sem consumir cota", async () => {
    expect(await authorizeCredentials({ email: "a@b.c" }, uniqueIp())).toBeNull();
    expect(await authorizeCredentials(undefined, uniqueIp())).toBeNull();
  });
});

describe("clientIp", () => {
  it("usa o primeiro hop do X-Forwarded-For", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("cai em 'unknown' sem o header", () => {
    expect(clientIp(new Request("http://localhost"))).toBe("unknown");
  });
});
