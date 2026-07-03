import { afterEach, describe, it, expect, vi } from "vitest";
import { logger } from "@/lib/logger";

const { mockAuth, mockIsAdmin } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/admin", () => ({ isAdmin: mockIsAdmin }));

import { requireAdminOr403 } from "@/lib/admin-route";

afterEach(() => {
  vi.restoreAllMocks();
  mockAuth.mockReset();
  mockIsAdmin.mockReset();
});

describe("requireAdminOr403", () => {
  it("loga warn e retorna 403 quando o usuário não é admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@example.com" } });
    mockIsAdmin.mockReturnValue(false);
    const warnSpy = vi.spyOn(logger, "warn");

    const res = await requireAdminOr403();

    expect(res?.status).toBe(403);
    expect(warnSpy).toHaveBeenCalledWith(
      { email: "user@example.com" },
      "admin: access denied"
    );
  });

  it("não loga warn e retorna null quando o usuário é admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@example.com" } });
    mockIsAdmin.mockReturnValue(true);
    const warnSpy = vi.spyOn(logger, "warn");

    const res = await requireAdminOr403();

    expect(res).toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
