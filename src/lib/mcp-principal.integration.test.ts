import { afterEach, describe, it, expect } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { apiKey, user as userTable } from "@/db/schema";
import { apikeysClient } from "@/lib/apikeys-client";
import { resolvePrincipal } from "@/lib/mcp-principal";

let createdUserIds: string[] = [];

async function seedPrincipal(plan: "pro" | "free", overrides: { revoked?: boolean } = {}) {
  const [user] = await db
    .insert(userTable)
    .values({
      id: crypto.randomUUID(),
      name: "Test User",
      email: `test-${crypto.randomUUID()}@example.com`,
      // A emissão exige pro (gate no core) — emite como pro e faz o downgrade
      // depois, se o teste pedir free, pra exercitar o resolvePrincipal real.
      plan: "pro",
    })
    .returning();
  createdUserIds.push(user.id);

  const issued = await apikeysClient.issue(user.id);
  if (overrides.revoked) await apikeysClient.revoke(user.id, issued.id);
  if (plan === "free") {
    await db.update(userTable).set({ plan: "free" }).where(eq(userTable.id, user.id));
  }

  const [key] = await db.select().from(apiKey).where(eq(apiKey.id, issued.id));
  return { user, plain: issued.plain, apiKey: key };
}

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("mcp-principal", () => {
  it("resolve token válido de User pro e retorna userId/apiKeyId, atualizando lastUsedAt", async () => {
    const { user, plain, apiKey: key } = await seedPrincipal("pro");

    const principal = await resolvePrincipal(plain);

    expect(principal).toEqual({ userId: user.id, apiKeyId: key.id });

    const [refreshed] = await db.select().from(apiKey).where(eq(apiKey.id, key.id));
    expect(refreshed?.lastUsedAt).not.toBeNull();
  });

  it("retorna null para token inexistente", async () => {
    const principal = await resolvePrincipal("sk-bfin-token-que-nao-existe-no-banco");
    expect(principal).toBeNull();
  });

  it("retorna null para ApiKey revogada", async () => {
    const { plain } = await seedPrincipal("pro", { revoked: true });
    const principal = await resolvePrincipal(plain);
    expect(principal).toBeNull();
  });

  it("retorna null para User free, mesmo com ApiKey válida", async () => {
    const { plain } = await seedPrincipal("free");
    const principal = await resolvePrincipal(plain);
    expect(principal).toBeNull();
  });
});
