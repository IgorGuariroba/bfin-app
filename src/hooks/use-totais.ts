"use client";

import { useState, useEffect, useCallback } from "react";

export type TotaisData = {
  entradas: number;
  saidas: number;
  diarios: number;
  cartao: number;
  economia: number;
  custoVida: number;
  performance: number;
  diarioMedio: number;
  diarioPrev: number;
  previsaoTotal: number;
  daysInMonth: number;
  daysElapsed: number;
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
    fetch_(month);
  }, [month, fetch_]);

  return { data, loading, error, refetch: () => fetch_(month) };
}
