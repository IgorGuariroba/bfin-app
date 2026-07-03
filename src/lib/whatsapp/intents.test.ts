import { afterAll, describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { priceText, detectIntent, isDeleteKeyword } from "./intents";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("priceText", () => {
  it("responde com os preços correntes do PlanConfig (fonte única de preço)", async () => {
    const config = await prisma.planConfig.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", monthlyAmount: 14.9, annualAmount: 119.9 },
    });
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
