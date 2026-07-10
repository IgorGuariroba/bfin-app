import "server-only";
import { callBackend } from "./backend-client";

// Tipos espelham o que o bfin-backend serializa (core/transactions/types.ts de
// lá) — datas cruzam a rede como string ISO (JSON não tem tipo Date).
interface TransactionTag {
  id: string;
  name: string;
  color: string;
}

export interface TransactionWithTags {
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
  source: string;
  externalId: string | null;
  pluggyItemId: string | null;
  tags: TransactionTag[];
}

export interface CreateTransactionResult {
  transaction: TransactionWithTags;
  duplicated: boolean;
}

export interface ListTransactionsFilter {
  month?: string;
  type?: string;
  tagId?: string;
  from?: string;
  to?: string;
}

export interface CreateTransactionInput {
  userId: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  source?: "manual" | "agent";
  repeat?: string;
  repeatEnd?: string;
  repeatCount?: number;
  tagIds?: string[];
  force?: boolean;
}

export interface UpdateTransactionInput {
  type?: string;
  description?: string;
  amount?: number;
  date?: string;
  tagIds?: string[];
}

function query(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const transactionsClient = {
  list: (userId: string, filter: ListTransactionsFilter = {}) =>
    callBackend<TransactionWithTags[]>(`/transactions${query({ userId, ...filter })}`),

  create: (input: CreateTransactionInput) =>
    callBackend<CreateTransactionResult>("/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (userId: string, id: string, patch: UpdateTransactionInput) =>
    callBackend<TransactionWithTags>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ userId, ...patch }),
    }),

  remove: (userId: string, id: string) =>
    callBackend<void>(`/transactions/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),
};
