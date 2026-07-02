export type {
  Movement,
  MonthSummary,
  SaldoDia,
  SaldosResult,
  Sugestao,
  SugestaoTipo,
  TotaisResult,
} from "./types";
export type { InsightsRepo, MovementRange } from "./ports";
export {
  makeInsightsService,
  InsightsValidationError,
  type InsightsService,
} from "./service";
