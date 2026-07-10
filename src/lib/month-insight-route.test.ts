import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { BackendError } from "@/lib/backend-client";

const { mockAuth, mockGetDelegationInfo, mockGetUserPlan } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetDelegationInfo: vi.fn(),
  mockGetUserPlan: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/identity-client", () => ({
  identityClient: { getDelegationInfo: mockGetDelegationInfo, getUserPlan: mockGetUserPlan },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: vi.fn() }),
}));

import { createMonthInsightRoute } from "./month-insight-route";

afterEach(() => {
  vi.resetAllMocks();
});

function getRequest() {
  return new NextRequest("http://localhost/api/saldos?month=2026-07");
}

describe("createMonthInsightRoute — erro do backend na resolução de delegação/plano", () => {
  it("devolve JSON com o status do BackendError quando a resolução de delegação falha", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const GET = createMonthInsightRoute(async () => ({}));
    const res = await GET(getRequest());

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });

  it("devolve JSON com o status do BackendError quando a consulta de plano falha", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockResolvedValue({ effectiveUserId: "user-1", isDelegated: false });
    mockGetUserPlan.mockRejectedValue(new BackendError(502, "Erro no backend"));

    const GET = createMonthInsightRoute(async () => ({}));
    const res = await GET(getRequest());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Erro no backend" });
  });
});
