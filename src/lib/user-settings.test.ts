import { afterEach, describe, it, expect } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { user as userTable } from "@/db/schema";
import { setAutoBaixaDiario, ProRequiredError } from "./user-settings";

let createdUserIds: string[] = [];

async function makeUser(plan: string) {
  const [user] = await db
    .insert(userTable)
    .values({ id: crypto.randomUUID(), name: "Settings User", email: `set-${crypto.randomUUID()}@example.com`, plan })
    .returning();
  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("setAutoBaixaDiario", () => {
  it("rejeita usuário free tentando ligar (ProRequiredError)", async () => {
    const user = await makeUser("free");
    await expect(setAutoBaixaDiario(user.id, true)).rejects.toBeInstanceOf(ProRequiredError);
  });

  it("persiste quando um usuário pro liga", async () => {
    const user = await makeUser("pro");
    await setAutoBaixaDiario(user.id, true);
    const [after] = await db.select().from(userTable).where(eq(userTable.id, user.id));
    expect(after?.autoBaixaDiario).toBe(true);
  });

  it("permite desligar mesmo sendo free (saída do estado após downgrade)", async () => {
    const user = await makeUser("free");
    await expect(setAutoBaixaDiario(user.id, false)).resolves.toBeUndefined();
    const [after] = await db.select().from(userTable).where(eq(userTable.id, user.id));
    expect(after?.autoBaixaDiario).toBe(false);
  });
});
