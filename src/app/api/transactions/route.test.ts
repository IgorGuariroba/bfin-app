import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { BackendError } from "@/lib/backend-client";

const { mockAuth, mockGetDelegationInfo } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetDelegationInfo: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/identity-client", () => ({
  identityClient: { getDelegationInfo: mockGetDelegationInfo, getUserPlan: vi.fn() },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: vi.fn() }),
}));

import { GET, POST } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

describe("/api/transactions — erro do backend na resolução de delegação", () => {
  it("GET devolve JSON com o status do BackendError em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await GET(new NextRequest("http://localhost/api/transactions"));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });

  it("POST devolve JSON com o status do BackendError em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await POST(
      new NextRequest("http://localhost/api/transactions", {
        method: "POST",
        body: JSON.stringify({ type: "gasto", description: "x", amount: 1, date: "2026-07-01" }),
      })
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });
});
