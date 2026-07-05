// Composition root (ADR-0013): instancia os services do core com os adapters
// concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado —
// rotas, canais e páginas consomem os services prontos deste módulo.
import { makeBillingService } from "@/core/billing";
import { makeInsightsService } from "@/core/insights";
import {
  isGoogleAdsConfigured,
  resolveClickId,
  uploadConversion,
} from "@/lib/google-ads";
import { logger } from "@/lib/logger";
import { notifyNewSubscriptionOnDiscord } from "./discord-notify";
import { mercadoPagoGateway } from "./mercadopago-gateway";
import { drizzleBillingRepo } from "./drizzle/billing-repo";
import { drizzleInsightsRepo } from "./drizzle/insights-repo";

export const billingService = makeBillingService(drizzleBillingRepo, mercadoPagoGateway, {
  logger,
  conversions: {
    isConfigured: isGoogleAdsConfigured,
    resolveClickId,
    upload: uploadConversion,
  },
  notifyNewSubscription: notifyNewSubscriptionOnDiscord,
});
export const insightsService = makeInsightsService(drizzleInsightsRepo);
