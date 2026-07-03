import { afterAll, afterEach, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { membersService } from "@/adapters";
import { InviteNotFoundError } from "@/core/identity";

let createdUserIds: string[] = [];

async function seedUser(plan = "pro") {
  const user = await prisma.user.create({
    data: {
      name: "Members User",
      email: `members-${crypto.randomUUID()}@example.com`,
      plan,
    },
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

describe("members-service fluxo completo", () => {
  it("convida, aceita, lista dos dois lados e revoga", async () => {
    const dono = await seedUser("pro");
    const convidado = await seedUser("free");

    const invite = await membersService.createInvite({
      ownerId: dono.id,
      ownerEmail: dono.email,
      email: convidado.email.toUpperCase(),
    });
    expect(invite).toMatchObject({ status: "pending", inviteEmail: convidado.email });

    const { invite: ativado, owner } = await membersService.acceptInvite({
      userId: convidado.id,
      userEmail: convidado.email,
      token: invite.inviteToken,
    });
    expect(ativado).toMatchObject({ memberId: convidado.id, status: "active" });
    expect(owner.email).toBe(dono.email);

    const doDono = await membersService.listInvites(dono.id);
    expect(doDono.sent).toHaveLength(1);
    expect(doDono.sent[0].member?.email).toBe(convidado.email);

    const doConvidado = await membersService.listInvites(convidado.id);
    expect(doConvidado.received).toHaveLength(1);
    expect(doConvidado.received[0].owner.id).toBe(dono.id);

    await membersService.revokeInvite(dono.id, invite.id);
    expect(await prisma.accountMember.findUnique({ where: { id: invite.id } })).toBeNull();
  });

  it("convidado não revoga convite do dono (not found)", async () => {
    const dono = await seedUser("pro");
    const intruso = await seedUser("free");
    const invite = await membersService.createInvite({
      ownerId: dono.id,
      ownerEmail: dono.email,
      email: "alguem@example.com",
    });

    await expect(membersService.revokeInvite(intruso.id, invite.id)).rejects.toBeInstanceOf(
      InviteNotFoundError
    );
  });
});
