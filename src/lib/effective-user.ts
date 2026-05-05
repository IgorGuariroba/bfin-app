import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function resolveTargetOwnerId(sessionUserId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const active = cookieStore.get("active-account")?.value;
  const preferred = cookieStore.get("preferred-account")?.value;
  const target = active ?? preferred;

  if (!target || target === sessionUserId) return null;

  const member = await prisma.accountMember.findFirst({
    where: { ownerId: target, memberId: sessionUserId, status: "active" },
  });

  return member ? target : null;
}

export async function getEffectiveUserId(sessionUserId: string): Promise<string> {
  const target = await resolveTargetOwnerId(sessionUserId);
  return target ?? sessionUserId;
}

export async function getDelegationInfo(sessionUserId: string): Promise<{
  effectiveUserId: string;
  isDelegated: boolean;
  ownerName?: string;
  ownerEmail?: string;
}> {
  const cookieStore = await cookies();
  const active = cookieStore.get("active-account")?.value;
  const preferred = cookieStore.get("preferred-account")?.value;
  const target = active ?? preferred;

  if (!target || target === sessionUserId) {
    return { effectiveUserId: sessionUserId, isDelegated: false };
  }

  const member = await prisma.accountMember.findFirst({
    where: { ownerId: target, memberId: sessionUserId, status: "active" },
    include: { owner: { select: { name: true, email: true } } },
  });

  if (!member) return { effectiveUserId: sessionUserId, isDelegated: false };

  return {
    effectiveUserId: target,
    isDelegated: true,
    ownerName: member.owner.name,
    ownerEmail: member.owner.email,
  };
}
