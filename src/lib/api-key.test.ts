import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey, verifyApiKey } from "@/lib/api-key";

describe("api-key", () => {
  it("gera plain sk-bfin-<entropia> com prefix que é prefixo do plain e hashedKey distinto", () => {
    const { plain, prefix, hashedKey } = generateApiKey();

    expect(plain).toMatch(/^sk-bfin-[A-Za-z0-9_-]+$/);
    expect(prefix).toMatch(/^sk-bfin-/);
    expect(plain.startsWith(prefix)).toBe(true);
    expect(typeof hashedKey).toBe("string");
    expect(hashedKey).not.toBe(plain);
  });

  it("hashApiKey é determinístico (mesmo plain produz o mesmo hash)", () => {
    expect(hashApiKey("sk-bfin-fixo-123")).toBe(hashApiKey("sk-bfin-fixo-123"));
  });

  it("verifyApiKey aceita o plain correto e rejeita errado", () => {
    const { plain, hashedKey } = generateApiKey();
    expect(verifyApiKey(plain, hashedKey)).toBe(true);
    expect(verifyApiKey("sk-bfin-wrong", hashedKey)).toBe(false);
  });

  it("dois generateApiKey produzem plains distintos (entropia)", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.plain).not.toBe(b.plain);
    expect(a.hashedKey).not.toBe(b.hashedKey);
  });
});
