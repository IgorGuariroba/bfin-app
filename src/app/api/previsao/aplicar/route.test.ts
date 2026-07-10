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

import { POST } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/previsao/aplicar — erro do backend na resolução de delegação", () => {
  it("devolve JSON com o status do BackendError em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await POST(
      new NextRequest("http://localhost/api/previsao/aplicar", {
        method: "POST",
        body: JSON.stringify({ amount: 100 }),
      })
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });
});
