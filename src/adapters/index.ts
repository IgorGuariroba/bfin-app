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
import { prismaApiKeyRepo } from "./prisma/apikey-repo";
import { prismaBillingRepo } from "./prisma/billing-repo";
import { prismaIdentityRepo } from "./prisma/identity-repo";
import { prismaInsightsRepo } from "./prisma/insights-repo";
import { prismaMembersRepo } from "./prisma/members-repo";
import { prismaPrevisaoRepo } from "./prisma/previsao-repo";
import { prismaTransactionRepo } from "./prisma/transaction-repo";
import { drizzleTagRepo } from "./drizzle/tag-repo";

export const identityService = makeIdentityService(prismaIdentityRepo);
export const membersService = makeMembersService(prismaMembersRepo, {
  getUserPlan: identityService.getUserPlan,
});
export const apiKeysService = makeApiKeysService(prismaApiKeyRepo, {
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
export const insightsService = makeInsightsService(prismaInsightsRepo);
export const previsaoService = makePrevisaoService(prismaPrevisaoRepo);
export const tagsService = makeTagsService(drizzleTagRepo);
export const transactionsService = makeTransactionsService(prismaTransactionRepo, { logger });
