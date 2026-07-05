import "server-only";
import { callBackend } from "./backend-client";

// Tipo espelha o que o bfin-backend serializa (core/previsao/types.ts de lá) —
// mesmo padrão de tipo de domínio escrito à mão que a ADR-0013 já aceitava.
export interface Previsao {
  id: string;
  userId: string;
  name: string;
  amount: number;
}

export const previsaoClient = {
  list: (userId: string) =>
    callBackend<Previsao[]>(`/previsao?userId=${encodeURIComponent(userId)}`),

  create: (input: { userId: string; name: string; amount: number }) =>
    callBackend<Previsao>("/previsao", { method: "POST", body: JSON.stringify(input) }),

  update: (userId: string, id: string, patch: { name?: string; amount?: number }) =>
    callBackend<Previsao>(`/previsao/${id}`, {
      method: "PUT",
      body: JSON.stringify({ userId, ...patch }),
    }),

  remove: (userId: string, id: string) =>
    callBackend<{ success: true }>(`/previsao/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  aplicar: (userId: string, amount: number) =>
    callBackend<{ count: number }>("/previsao/aplicar", {
      method: "POST",
      body: JSON.stringify({ userId, amount }),
    }),

  baixaDiaria: () =>
    callBackend<{ count: number }>("/previsao/baixa-diaria", { method: "POST", body: "{}" }),
};
