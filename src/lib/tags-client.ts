import "server-only";
import { callBackend } from "./backend-client";

// Tipo espelha o que o bfin-backend serializa (core/tags/types.ts de lá) —
// mesmo padrão de tipo de domínio escrito à mão que a ADR-0013 já aceitava.
export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  isSystem: boolean;
}

export const tagsClient = {
  list: (userId: string) => callBackend<Tag[]>(`/tags?userId=${encodeURIComponent(userId)}`),

  create: (input: { userId: string; name: string; color?: string }) =>
    callBackend<Tag>("/tags", { method: "POST", body: JSON.stringify(input) }),

  update: (userId: string, id: string, patch: { name?: string; color?: string }) =>
    callBackend<Tag>(`/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify({ userId, ...patch }),
    }),

  remove: (userId: string, id: string) =>
    callBackend<{ success: true }>(`/tags/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  ensureSystem: (userId: string) =>
    callBackend<void>("/tags/ensure-system", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};
