import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { setAutoBaixaDiario, ProRequiredError } from "./user-settings";

let createdUserIds: string[] = [];

async function makeUser(plan: string) {
  const user = await prisma.user.create({
    data: { name: "Settings User", email: `set-${crypto.randomUUID()}@example.com`, plan },
  });
  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("setAutoBaixaDiario", () => {
  it("rejeita usuário free tentando ligar (ProRequiredError)", async () => {
    const user = await makeUser("free");
    await expect(setAutoBaixaDiario(user.id, true)).rejects.toBeInstanceOf(ProRequiredError);
  });

  it("persiste quando um usuário pro liga", async () => {
    const user = await makeUser("pro");
    await setAutoBaixaDiario(user.id, true);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.autoBaixaDiario).toBe(true);
  });

  it("permite desligar mesmo sendo free (saída do estado após downgrade)", async () => {
    const user = await makeUser("free");
    await expect(setAutoBaixaDiario(user.id, false)).resolves.toBeUndefined();
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.autoBaixaDiario).toBe(false);
  });
});
