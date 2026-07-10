import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { BackendError } from "@/lib/backend-client";

const { mockAuth, mockGetDelegationInfo } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetDelegationInfo: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/identity-client", () => ({
  identityClient: { getDelegationInfo: mockGetDelegationInfo },
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

import { POST } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/invites/switch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/invites/switch — erro do backend", () => {
  it("devolve o status/mensagem do BackendError como JSON em vez de deixar a exceção escapar", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetDelegationInfo.mockRejectedValue(new BackendError(503, "Backend em manutenção"));

    const res = await POST(postRequest({ ownerId: "owner-1" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Backend em manutenção" });
  });
});
