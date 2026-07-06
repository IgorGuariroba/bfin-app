import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

const config = { limit: 3, windowMs: 60_000 };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("permite chamadas dentro do limite da janela", () => {
    const key = `k-${crypto.randomUUID()}`;
    for (let i = 0; i < config.limit; i++) {
      const result = checkRateLimit(key, config);
      expect(result.allowed).toBe(true);
    }
  });

  it("bloqueia a chamada que excede o limite e informa retryAfter em segundos", () => {
    const key = `k-${crypto.randomUUID()}`;
    for (let i = 0; i < config.limit; i++) checkRateLimit(key, config);

    const result = checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(config.windowMs / 1000);
  });

  it("reabre a janela após windowMs e volta a permitir", () => {
    const key = `k-${crypto.randomUUID()}`;
    for (let i = 0; i < config.limit; i++) checkRateLimit(key, config);
    expect(checkRateLimit(key, config).allowed).toBe(false);

    vi.advanceTimersByTime(config.windowMs);

    expect(checkRateLimit(key, config).allowed).toBe(true);
  });

  it("isola baldes por chave (uma chave estourada não afeta a outra)", () => {
    const a = `k-${crypto.randomUUID()}`;
    const b = `k-${crypto.randomUUID()}`;
    for (let i = 0; i < config.limit; i++) checkRateLimit(a, config);
    expect(checkRateLimit(a, config).allowed).toBe(false);

    expect(checkRateLimit(b, config).allowed).toBe(true);
  });
});
