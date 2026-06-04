"use client";

import { useState, useEffect, useCallback } from "react";

export type PrevMonthData = {
  saldoAtual: number;
  custoVida: number;
  diarioMedio: number;
  economiaPct: number;
};

export type TotaisData = {
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
  prevMonth: PrevMonthData | null;
};

export function useTotais(month: string) {
  const [data, setData] = useState<TotaisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/totais?month=${m}`);
      if (!res.ok) throw new Error(await res.text());
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar totais");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // fetch_ só altera estado após o await do fetch (fonte externa), não de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch_(month);
  }, [month, fetch_]);

  return { data, loading, error, refetch: () => fetch_(month) };
}
