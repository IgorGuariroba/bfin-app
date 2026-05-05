"use client";

import { useState, useEffect, useCallback } from "react";

export type TransactionTag = { id: string; name: string; color: string };

export type Transaction = {
  id: string;
  userId: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  repeat: string;
  repeatEnd: string;
  repeatCount: number;
  createdAt: string;
  updatedAt: string;
  tags: TransactionTag[];
};

export type TransactionInput = {
  type: string;
  description: string;
  amount: number;
  date: string;
  repeat?: string;
  repeatEnd?: string;
  repeatCount?: number;
  tagIds?: string[];
};

type Filters = {
  month?: string;
  type?: string;
  from?: string;
  to?: string;
  tagId?: string;
};

export function useTransactions(filters: Filters = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildUrl = useCallback((f: Filters) => {
    const params = new URLSearchParams();
    if (f.month) params.set("month", f.month);
    if (f.type) params.set("type", f.type);
    if (f.from) params.set("from", f.from);
    if (f.to) params.set("to", f.to);
    if (f.tagId) params.set("tagId", f.tagId);
    const qs = params.toString();
    return `/api/transactions${qs ? `?${qs}` : ""}`;
  }, []);

  const fetch_ = useCallback(
    async (f: Filters) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildUrl(f));
        if (!res.ok) throw new Error(await res.text());
        setTransactions(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar transações");
      } finally {
        setLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    fetch_(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.month, filters.type, filters.from, filters.to]);

  const create = useCallback(
    async (input: TransactionInput): Promise<Transaction> => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao criar transação");
      }
      const created: Transaction = await res.json();
      await fetch_(filters);
      return created;
    },
    [fetch_, filters]
  );

  const update = useCallback(
    async (id: string, input: Partial<TransactionInput>): Promise<Transaction> => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao atualizar transação");
      }
      const updated: Transaction = await res.json();
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Erro ao excluir transação");
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { transactions, loading, error, refetch: () => fetch_(filters), create, update, remove };
}
