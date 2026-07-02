// Composition root (ADR-0013): instancia os services do core com os adapters
// concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado —
// rotas, canais e páginas consomem os services prontos deste módulo.
import { makeTagsService } from "@/core/tags";
import { makeTransactionsService } from "@/core/transactions";
import { logger } from "@/lib/logger";
import { prismaTagRepo } from "./prisma/tag-repo";
import { prismaTransactionRepo } from "./prisma/transaction-repo";

export const tagsService = makeTagsService(prismaTagRepo);
export const transactionsService = makeTransactionsService(prismaTransactionRepo, { logger });
