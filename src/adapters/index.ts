// Composition root (ADR-0013): instancia os services do core com os adapters
// concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado —
// rotas, canais e páginas consomem os services prontos deste módulo.
import { makeIdentityService, makeMembersService } from "@/core/identity";
import { makeInsightsService } from "@/core/insights";
import { makePrevisaoService } from "@/core/previsao";
import { makeTagsService } from "@/core/tags";
import { makeTransactionsService } from "@/core/transactions";
import { logger } from "@/lib/logger";
import { prismaIdentityRepo } from "./prisma/identity-repo";
import { prismaInsightsRepo } from "./prisma/insights-repo";
import { prismaMembersRepo } from "./prisma/members-repo";
import { prismaPrevisaoRepo } from "./prisma/previsao-repo";
import { prismaTagRepo } from "./prisma/tag-repo";
import { prismaTransactionRepo } from "./prisma/transaction-repo";

export const identityService = makeIdentityService(prismaIdentityRepo);
export const membersService = makeMembersService(prismaMembersRepo, {
  getUserPlan: identityService.getUserPlan,
});
export const insightsService = makeInsightsService(prismaInsightsRepo);
export const previsaoService = makePrevisaoService(prismaPrevisaoRepo);
export const tagsService = makeTagsService(prismaTagRepo);
export const transactionsService = makeTransactionsService(prismaTransactionRepo, { logger });
