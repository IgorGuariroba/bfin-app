import "server-only";
import { callBackend, BackendError } from "./backend-client";

export type Plan = "free" | "pro";

export class ProRequiredError extends Error {}

export interface DelegationInfo {
  effectiveUserId: string;
  isDelegated: boolean;
  ownerName?: string;
  ownerEmail?: string;
}

export const identityClient = {
  getDelegationInfo: (sessionUserId: string, requestedOwnerId: string | null | undefined) =>
    callBackend<DelegationInfo>("/identity/resolve-effective-user", {
      method: "POST",
      body: JSON.stringify({ sessionUserId, requestedOwnerId }),
    }),

  getUserPlan: async (userId: string): Promise<Plan> => {
    const { plan } = await callBackend<{ plan: Plan }>(
      `/identity/plan?userId=${encodeURIComponent(userId)}`
    );
    return plan;
  },

  setAutoBaixaDiario: async (userId: string, enabled: boolean): Promise<void> => {
    try {
      await callBackend<void>("/identity/auto-baixa-diario", {
        method: "POST",
        body: JSON.stringify({ userId, enabled }),
      });
    } catch (error) {
      if (error instanceof BackendError && error.status === 403) {
        throw new ProRequiredError(error.message);
      }
      throw error;
    }
  },
};
