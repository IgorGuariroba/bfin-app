// A aritmética de datas é domínio e mudou-se para o core (ADR-0013); re-export
// mantido para os consumidores existentes até suas fatias migrarem.
export { addDays, addWeeks, addMonths, saoPauloTodayRange } from "@/core/dates";
