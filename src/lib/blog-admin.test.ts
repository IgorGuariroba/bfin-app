import { afterEach, describe, it, expect, vi } from "vitest";
import { logger } from "@/lib/logger";

const { mockAuth, mockIsAdmin } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/admin", () => ({ isAdmin: mockIsAdmin }));

import { requireBlogAdmin } from "@/lib/blog-admin";

afterEach(() => {
  vi.restoreAllMocks();
  mockAuth.mockReset();
  mockIsAdmin.mockReset();
});

describe("requireBlogAdmin", () => {
  it("loga warn e retorna null quando o usuário não é admin", async () => {
    mockAuth.mockResolvedValue({ user: { email: "user@example.com", id: "u1" } });
    mockIsAdmin.mockReturnValue(false);
    const warnSpy = vi.spyOn(logger, "warn");

    const result = await requireBlogAdmin();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      { email: "user@example.com" },
      "admin: access denied"
    );
  });

  it("loga warn e retorna null quando session.user.id está ausente", async () => {
    mockAuth.mockResolvedValue({ user: { email: "admin@example.com" } });
    mockIsAdmin.mockReturnValue(true);
    const warnSpy = vi.spyOn(logger, "warn");

    const result = await requireBlogAdmin();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      { email: "admin@example.com" },
      "admin: access denied"
    );
  });

  it("não loga warn e retorna a session quando o usuário é admin válido", async () => {
    const session = { user: { email: "admin@example.com", id: "u1" } };
    mockAuth.mockResolvedValue(session);
    mockIsAdmin.mockReturnValue(true);
    const warnSpy = vi.spyOn(logger, "warn");

    const result = await requireBlogAdmin();

    expect(result).toEqual(session);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
