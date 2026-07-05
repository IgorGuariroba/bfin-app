// Composition root (ADR-0013): instancia os services do core com os adapters
// concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado —
// rotas, canais e páginas consomem os services prontos deste módulo.
import { makeInsightsService } from "@/core/insights";
import { drizzleInsightsRepo } from "./drizzle/insights-repo";

export const insightsService = makeInsightsService(drizzleInsightsRepo);
