import "server-only";
import { MercadoPagoConfig } from "mercadopago";

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const PLAN_PRICES = {
  monthly: { amount: 14.9, label: "Mensal", billingDays: 30 },
  annual: { amount: 119.9, label: "Anual", billingDays: 365 },
} as const;

export type BillingCycle = keyof typeof PLAN_PRICES;
