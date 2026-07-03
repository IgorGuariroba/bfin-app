import { describe, it, expect } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { planConfig } from "@/db/schema";
import { toDbTimestamp } from "@/adapters/drizzle/timestamp";
import { priceText, detectIntent, isDeleteKeyword } from "./intents";

describe("priceText", () => {
  it("responde com os preços correntes do PlanConfig (fonte única de preço)", async () => {
    const [config] = await db
      .insert(planConfig)
      .values({ id: "default", monthlyAmount: 14.9, annualAmount: 119.9, updatedAt: toDbTimestamp(new Date()) })
      .onConflictDoUpdate({ target: planConfig.id, set: { id: sql`excluded.id` } })
      .returning();
    const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    const text = await priceText();

    expect(text).toContain(brl.format(config.monthlyAmount));
    expect(text).toContain(brl.format(config.annualAmount));
  });
});

describe("detectIntent", () => {
  it("reconhece keywords de preço e handoff humano; texto solto é null", () => {
    expect(detectIntent("Quanto custa o plano?")).toBe("price");
    expect(detectIntent("quero falar com um atendente")).toBe("human");
    expect(detectIntent("bom dia")).toBeNull();
  });
});

describe("isDeleteKeyword", () => {
  it("só a palavra APAGAR (case-insensitive, com espaços) confirma a exclusão LGPD", () => {
    expect(isDeleteKeyword("  APAGAR ")).toBe(true);
    expect(isDeleteKeyword("apagar tudo")).toBe(false);
  });
});
