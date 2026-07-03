// Composition root (ADR-0013): instancia os services do core com os adapters
// concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado —
// rotas, canais e páginas consomem os services prontos deste módulo.
import { makeApiKeysService } from "@/core/apikeys";
import { makeBillingService } from "@/core/billing";
import { makeIdentityService, makeMembersService } from "@/core/identity";
import { makeInsightsService } from "@/core/insights";
import { makePrevisaoService } from "@/core/previsao";
import { makeTagsService } from "@/core/tags";
import { makeTransactionsService } from "@/core/transactions";
import { generateApiKey, hashApiKey } from "@/lib/api-key";
import {
  isGoogleAdsConfigured,
  resolveClickId,
  uploadConversion,
} from "@/lib/google-ads";
import { logger } from "@/lib/logger";
import { notifyNewSubscriptionOnDiscord } from "./discord-notify";
import { mercadoPagoGateway } from "./mercadopago-gateway";
import { prismaBillingRepo } from "./prisma/billing-repo";
import { drizzleApiKeyRepo } from "./drizzle/apikey-repo";
import { drizzleIdentityRepo } from "./drizzle/identity-repo";
import { drizzleInsightsRepo } from "./drizzle/insights-repo";
import { drizzleMembersRepo } from "./drizzle/members-repo";
import { drizzlePrevisaoRepo } from "./drizzle/previsao-repo";
import { drizzleTagRepo } from "./drizzle/tag-repo";
import { drizzleTransactionRepo } from "./drizzle/transaction-repo";

export const identityService = makeIdentityService(drizzleIdentityRepo);
export const membersService = makeMembersService(drizzleMembersRepo, {
  getUserPlan: identityService.getUserPlan,
});
export const apiKeysService = makeApiKeysService(drizzleApiKeyRepo, {
  getUserPlan: identityService.getUserPlan,
  generateKey: generateApiKey,
  hashKey: hashApiKey,
  logger,
});
export const billingService = makeBillingService(prismaBillingRepo, mercadoPagoGateway, {
  logger,
  conversions: {
    isConfigured: isGoogleAdsConfigured,
    resolveClickId,
    upload: uploadConversion,
  },
  notifyNewSubscription: notifyNewSubscriptionOnDiscord,
});
export const insightsService = makeInsightsService(drizzleInsightsRepo);
export const previsaoService = makePrevisaoService(drizzlePrevisaoRepo);
export const tagsService = makeTagsService(drizzleTagRepo);
export const transactionsService = makeTransactionsService(drizzleTransactionRepo, { logger });
