import "server-only";
import { callBackend, BackendError } from "./backend-client";

export type BillingCycle = "monthly" | "annual";

export class BillingValidationError extends Error {}

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

function toBackendError<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((error) => {
    if (error instanceof BackendError && error.status === 400) {
      throw new BillingValidationError(error.message);
    }
    throw error;
  });
}

export const billingClient = {
  getPlanPrices: () => callBackend<{ monthly: number; annual: number }>("/billing/plan-prices"),

  getPlanConfig: () => callBackend<PlanConfigRecord>("/billing/plan-config"),

  updatePlanConfig: (input: { monthlyAmount: number; annualAmount: number }) =>
    toBackendError(
      callBackend<PlanConfigRecord>("/billing/plan-config", {
        method: "PUT",
        body: JSON.stringify(input),
      })
    ),

  getSubscription: (userId: string) =>
    callBackend<SubscriptionInfo>(`/billing/subscription?userId=${encodeURIComponent(userId)}`),

  cancelSubscription: (userId: string) =>
    toBackendError(
      callBackend<{ ok: true }>("/billing/subscription", {
        method: "DELETE",
        body: JSON.stringify({ userId }),
      })
    ),

  checkout: (input: {
    userId: string;
    email: string | null | undefined;
    cycle: BillingCycle;
    origin: string;
    click?: ClickAttribution;
  }) =>
    toBackendError(
      callBackend<{ initPoint: string | undefined }>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify(input),
      })
    ),

  processSubscriptionEvent: (subscriptionId: string) =>
    callBackend<{ ok: true }>("/billing/process-subscription-event", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    }),
};
