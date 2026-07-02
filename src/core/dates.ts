// Aritmética de datas pura, compartilhada pelo core (ADR-0013). Movida de
// src/lib/date-utils.ts, que re-exporta daqui para os consumidores existentes.
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
