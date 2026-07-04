import { afterEach, describe, it, expect } from "vitest";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { user, account } from "@/db/schema";
import { buildAuthAdapter } from "@/lib/auth-adapter";

const adapter = buildAuthAdapter();

let createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(user).where(inArray(user.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("createUser / getUser / getUserByEmail", () => {
  it("cria e recupera o usuário por id e por email", async () => {
    const email = `adapter-${crypto.randomUUID()}@example.com`;
    const created = await adapter.createUser!({
      id: crypto.randomUUID(),
      name: "Adapter User",
      email,
      emailVerified: null,
      image: null,
    });
    createdUserIds.push(created.id);

    expect(created).toMatchObject({ name: "Adapter User", email, emailVerified: null });
    expect(await adapter.getUser!(created.id)).toMatchObject({ id: created.id, email });
    expect(await adapter.getUserByEmail!(email)).toMatchObject({ id: created.id, email });
  });

  it("getUser/getUserByEmail retornam null quando não existe", async () => {
    expect(await adapter.getUser!(crypto.randomUUID())).toBeNull();
    expect(await adapter.getUserByEmail!(`nao-existe-${crypto.randomUUID()}@example.com`)).toBeNull();
  });
});

describe("updateUser", () => {
  it("atualiza só os campos informados", async () => {
    const email = `adapter-${crypto.randomUUID()}@example.com`;
    const created = await adapter.createUser!({
      id: crypto.randomUUID(),
      name: "Nome Original",
      email,
      emailVerified: null,
      image: null,
    });
    createdUserIds.push(created.id);

    const updated = await adapter.updateUser!({ id: created.id, name: "Nome Novo" });
    expect(updated).toMatchObject({ id: created.id, name: "Nome Novo", email });
  });
});

describe("linkAccount / getUserByAccount", () => {
  it("vincula uma conta OAuth e resolve o usuário por provider+providerAccountId", async () => {
    const email = `adapter-${crypto.randomUUID()}@example.com`;
    const created = await adapter.createUser!({
      id: crypto.randomUUID(),
      name: "Google User",
      email,
      emailVerified: null,
      image: null,
    });
    createdUserIds.push(created.id);

    const providerAccountId = crypto.randomUUID();
    await adapter.linkAccount!({
      userId: created.id,
      type: "oauth",
      provider: "google",
      providerAccountId,
      access_token: "token-abc",
      expires_at: 1234567890,
      token_type: "bearer",
      scope: "email profile",
      id_token: "id-token-abc",
    });

    const resolved = await adapter.getUserByAccount!({ provider: "google", providerAccountId });
    expect(resolved).toMatchObject({ id: created.id, email });

    const [row] = await db
      .select()
      .from(account)
      .where(inArray(account.userId, [created.id]));
    expect(row).toMatchObject({
      provider: "google",
      providerAccountId,
      accessToken: "token-abc",
      tokenType: "bearer",
    });
  });

  it("getUserByAccount retorna null quando não há vínculo", async () => {
    expect(
      await adapter.getUserByAccount!({ provider: "google", providerAccountId: crypto.randomUUID() })
    ).toBeNull();
  });
});
