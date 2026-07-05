import "server-only";
import { callBackend } from "./backend-client";

export interface AccountMember {
  id: string;
  ownerId: string;
  memberId: string | null;
  inviteEmail: string;
  inviteToken: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface SentInvite extends AccountMember {
  member: { name: string; email: string; image: string | null } | null;
}

export interface ReceivedInvite extends AccountMember {
  owner: { id: string; name: string; email: string; image: string | null };
}

export const invitesClient = {
  list: (userId: string) =>
    callBackend<{ sent: SentInvite[]; received: ReceivedInvite[] }>(
      `/invites?userId=${encodeURIComponent(userId)}`
    ),

  create: (input: { ownerId: string; ownerEmail: string | null | undefined; email: string }) =>
    callBackend<AccountMember>("/invites", { method: "POST", body: JSON.stringify(input) }),

  accept: (input: { userId: string; userEmail: string | null | undefined; token: string }) =>
    callBackend<{ invite: AccountMember; owner: { name: string; email: string } }>(
      "/invites/accept",
      { method: "POST", body: JSON.stringify(input) }
    ),

  revoke: (ownerId: string, id: string) =>
    callBackend<{ success: true }>(`/invites/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ ownerId }),
    }),
};
