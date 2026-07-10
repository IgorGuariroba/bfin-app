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

import { PUT, DELETE } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

const params = { params: Promise.resolve({ id: "prev-1" }) };

describe("/api/previsao/[id] — erro do backend na resolução de delegação", () => {
  it("PUT devolve JSON com o status do BackendError em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await PUT(
      new NextRequest("http://localhost/api/previsao/prev-1", {
        method: "PUT",
        body: JSON.stringify({ name: "Mercado", amount: 100 }),
      }),
      params
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });

  it("DELETE devolve JSON com o status do BackendError em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await DELETE(
      new NextRequest("http://localhost/api/previsao/prev-1", { method: "DELETE" }),
      params
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });
});
