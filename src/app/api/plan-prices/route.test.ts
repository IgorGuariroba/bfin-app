import { describe, it, expect, vi, afterEach } from "vitest";
import { BackendError } from "@/lib/backend-client";

const { mockGetPlanPrices } = vi.hoisted(() => ({
  mockGetPlanPrices: vi.fn(),
}));

vi.mock("@/lib/billing-client", () => ({
  billingClient: { getPlanPrices: mockGetPlanPrices },
}));

import { GET } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/plan-prices — erro do backend", () => {
  it("devolve o status/mensagem do BackendError como JSON em vez de deixar a exceção escapar", async () => {
    mockGetPlanPrices.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await GET();

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });
});
