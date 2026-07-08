import "server-only";
import { callBackend } from "./backend-client";

export type BillingCycle = "monthly" | "annual";

export interface PlanConfigRecord {
  id: string;
  monthlyAmount: number;
  annualAmount: number;
  updatedAt: Date;
}

export interface SubscriptionInfo {
  plan: string;
  planExpiresAt: Date | null;
  mpSubscriptionId: string | null;
}

export interface ClickAttribution {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
}

export const billingClient = {
  getPlanPrices: () => callBackend<{ monthly: number; annual: number }>("/billing/plan-prices"),

  getPlanConfig: () => callBackend<PlanConfigRecord>("/billing/plan-config"),

  updatePlanConfig: (input: { monthlyAmount: number; annualAmount: number }) =>
    callBackend<PlanConfigRecord>("/billing/plan-config", {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  getSubscription: (userId: string) =>
    callBackend<SubscriptionInfo>(`/billing/subscription?userId=${encodeURIComponent(userId)}`),

  cancelSubscription: (userId: string) =>
    callBackend<{ ok: true }>("/billing/subscription", {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  checkout: (input: {
    userId: string;
    email: string | null | undefined;
    cycle: BillingCycle;
    origin: string;
    click?: ClickAttribution;
  }) =>
    callBackend<{ initPoint: string | undefined }>("/billing/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
