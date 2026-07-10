import "server-only";
import { callBackend } from "./backend-client";

interface SaldoDia {
  day: number;
  date: string;
  byType: Record<string, number>;
  accSaldo: number;
}

export interface SaldosResult {
  entries: SaldoDia[];
  prevByType: Record<string, number>;
}

type SugestaoTipo = "saldo_negativo" | "diario_acima" | "economia_baixa" | "custo_subiu";

export interface Sugestao {
  tipo: SugestaoTipo;
  severidade: "alerta" | "info";
  texto: string;
}

export interface TotaisResult {
  entradas: number;
  saidas: number;
  diarios: number;
  cartao: number;
  economia: number;
  custoVida: number;
  performance: number;
  saldoAnterior: number;
  saldoAtual: number;
  diarioMedio: number;
  diarioPrev: number;
  previsaoTotal: number;
  daysInMonth: number;
  daysElapsed: number;
  prevMonth: {
    saldoAtual: number;
    custoVida: number;
    diarioMedio: number;
    economiaPct: number;
  } | null;
}

function query(userId: string, month: string): string {
  return `userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}`;
}

export const insightsClient = {
  getTotais: (userId: string, month: string) =>
    callBackend<TotaisResult>(`/insights/totais?${query(userId, month)}`),

  getSaldos: (userId: string, month: string) =>
    callBackend<SaldosResult>(`/insights/saldos?${query(userId, month)}`),

  getSugestoes: (userId: string, month: string) =>
    callBackend<Sugestao[]>(`/insights/sugestoes?${query(userId, month)}`),
};
