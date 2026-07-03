import { afterEach, describe, it, expect } from "vitest";
import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { tag, user as userTable } from "@/db/schema";
import { tagsService } from "@/adapters";
import { DEFAULT_SYSTEM_TAGS, CATEGORY_TAGS } from "@/core/tags";

let createdUserIds: string[] = [];

async function seedUser() {
  const [row] = await db
    .insert(userTable)
    .values({ id: crypto.randomUUID(), name: "Tag User", email: `tags-${crypto.randomUUID()}@example.com`, plan: "pro" })
    .returning();
  createdUserIds.push(row.id);
  return row;
}

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(userTable).where(inArray(userTable.id, createdUserIds));
    createdUserIds = [];
  }
});

describe("ensureSystemTags", () => {
  it("semeia type-mirrors + categorias canônicas como system tags", async () => {
    const user = await seedUser();

    await tagsService.ensureSystemTags(user.id);

    const tags = await db
      .select()
      .from(tag)
      .where(and(eq(tag.userId, user.id), eq(tag.isSystem, true)));
    const names = tags.map((t) => t.name).sort();
    const expected = [
      ...DEFAULT_SYSTEM_TAGS.map((t) => t.name),
      ...CATEGORY_TAGS.map((t) => t.name),
    ].sort();
    expect(names).toEqual(expected);
    // categorias específicas da #93 presentes
    expect(names).toContain("Transporte");
    expect(names).toContain("Alimentação");
    expect(names).toContain("Moradia");
  });

  it("é idempotente: rodar duas vezes não duplica nem recria", async () => {
    const user = await seedUser();

    async function countSystemTags() {
      const [row] = await db
        .select({ n: count() })
        .from(tag)
        .where(and(eq(tag.userId, user.id), eq(tag.isSystem, true)));
      return row.n;
    }

    await tagsService.ensureSystemTags(user.id);
    const after1 = await countSystemTags();
    await tagsService.ensureSystemTags(user.id);
    const after2 = await countSystemTags();

    expect(after2).toBe(after1);
    expect(after1).toBe(DEFAULT_SYSTEM_TAGS.length + CATEGORY_TAGS.length);
  });
});
