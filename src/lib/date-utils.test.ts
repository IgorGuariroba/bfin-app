import { describe, it, expect } from "vitest";
import { saoPauloTodayRange } from "./date-utils";

describe("saoPauloTodayRange", () => {
  it("cobre o dia-calendário de São Paulo como meia-noites UTC", () => {
    // 2026-06-20T02:00:00Z = 2026-06-19 23:00 em São Paulo (UTC-3) → dia 19
    const { gte, lt } = saoPauloTodayRange(new Date("2026-06-20T02:00:00Z"));
    expect(gte.toISOString()).toBe("2026-06-19T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2026-06-20T00:00:00.000Z");
  });

  it("vira o dia após a meia-noite de São Paulo (cron 00:05 BRT = 03:05Z)", () => {
    // 03:06Z = 00:06 em São Paulo → já é o dia 20 (não o 19)
    const { gte, lt } = saoPauloTodayRange(new Date("2026-06-20T03:06:00Z"));
    expect(gte.toISOString()).toBe("2026-06-20T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2026-06-21T00:00:00.000Z");
  });
});
