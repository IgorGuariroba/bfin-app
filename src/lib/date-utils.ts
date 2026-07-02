/**
 * Janela [gte, lt) que cobre o dia-calendário corrente em America/São_Paulo,
 * expressa como meia-noites UTC. Os `diario` são gravados ao meio-dia
 * (12:00 no container UTC — ADR-0005), então a janela do dia tem ~9–12h de
 * folga das bordas, imune a off-by-one perto da virada. Default: agora.
 */
export function saoPauloTodayRange(now: Date = new Date()): { gte: Date; lt: Date } {
  // en-CA formata como YYYY-MM-DD; com timeZone, dá a data-calendário em SP.
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("-")
    .map(Number);
  const gte = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  const lt = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0));
  return { gte, lt };
}

// A aritmética de datas é domínio e mudou-se para o core (ADR-0013); re-export
// mantido para os consumidores existentes até suas fatias migrarem.
export { addDays, addWeeks, addMonths } from "@/core/dates";
