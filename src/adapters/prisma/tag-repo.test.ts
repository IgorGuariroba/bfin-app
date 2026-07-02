import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { tagsService } from "@/adapters";
import { DEFAULT_SYSTEM_TAGS, CATEGORY_TAGS } from "@/core/tags";

let createdUserIds: string[] = [];

async function seedUser() {
  const user = await prisma.user.create({
    data: { name: "Tag User", email: `tags-${crypto.randomUUID()}@example.com`, plan: "pro" },
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

describe("ensureSystemTags", () => {
  it("semeia type-mirrors + categorias canônicas como system tags", async () => {
    const user = await seedUser();

    await tagsService.ensureSystemTags(user.id);

    const tags = await prisma.tag.findMany({ where: { userId: user.id, isSystem: true } });
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

    await tagsService.ensureSystemTags(user.id);
    const after1 = await prisma.tag.count({ where: { userId: user.id, isSystem: true } });
    await tagsService.ensureSystemTags(user.id);
    const after2 = await prisma.tag.count({ where: { userId: user.id, isSystem: true } });

    expect(after2).toBe(after1);
    expect(after1).toBe(DEFAULT_SYSTEM_TAGS.length + CATEGORY_TAGS.length);
  });
});
