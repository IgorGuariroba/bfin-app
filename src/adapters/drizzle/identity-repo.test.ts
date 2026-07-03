import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { identityService } from "@/adapters";

let createdUserIds: string[] = [];

async function seedUser(opts: { plan?: string; planExpiresAt?: Date } = {}) {
  const user = await prisma.user.create({
    data: {
      name: "Identity User",
      email: `identity-${crypto.randomUUID()}@example.com`,
      plan: opts.plan ?? "free",
      planExpiresAt: opts.planExpiresAt,
    },
  });
  createdUserIds.push(user.id);
  return user;
}

afterEach(async () => {
  if (createdUserIds.length) {
    // AccountMember cai em cascade junto com o User (onDelete: cascade).
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getUserPlan", () => {
  it("faz downgrade preguiçoso e persiste quando o pro está vencido", async () => {
    const user = await seedUser({ plan: "pro", planExpiresAt: new Date(Date.now() - 1000) });

    expect(await identityService.getUserPlan(user.id)).toBe("free");
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.plan).toBe("free");
  });

  it("mantém pro quando planExpiresAt é no futuro", async () => {
    const user = await seedUser({ plan: "pro", planExpiresAt: new Date(Date.now() + 86_400_000) });
    expect(await identityService.getUserPlan(user.id)).toBe("pro");
  });

  it("usuário inexistente é free (fail-closed)", async () => {
    expect(await identityService.getUserPlan(crypto.randomUUID())).toBe("free");
  });
});

describe("resolveEffectiveUser / getDelegationInfo", () => {
  it("resolve o dono quando há AccountMember ativo", async () => {
    const dono = await seedUser({ plan: "pro" });
    const membro = await seedUser();
    await prisma.accountMember.create({
      data: {
        ownerId: dono.id,
        memberId: membro.id,
        inviteEmail: membro.email,
        inviteToken: crypto.randomUUID(),
        status: "active",
      },
    });

    expect(await identityService.resolveEffectiveUser(membro.id, dono.id)).toBe(dono.id);
    expect(await identityService.getDelegationInfo(membro.id, dono.id)).toMatchObject({
      effectiveUserId: dono.id,
      isDelegated: true,
      ownerName: dono.name,
      ownerEmail: dono.email,
    });
  });

  it("ignora delegação sem vínculo ativo", async () => {
    const dono = await seedUser({ plan: "pro" });
    const estranho = await seedUser();

    expect(await identityService.resolveEffectiveUser(estranho.id, dono.id)).toBe(estranho.id);
  });
});
