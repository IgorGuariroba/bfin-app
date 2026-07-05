import "server-only";
import { callBackend } from "./backend-client";

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export interface IssuedApiKey {
  id: string;
  prefix: string;
  name: string;
  createdAt: string;
  plain: string;
}

export interface AgentPrincipal {
  userId: string;
  apiKeyId: string;
}

type AgentAction = "create" | "update" | "delete";

export interface AgentWrite {
  apiKeyId: string;
  userId: string;
  action: AgentAction;
  entityId: string;
}

export const apikeysClient = {
  list: (userId: string) =>
    callBackend<ApiKeySummary[]>(`/apikeys?userId=${encodeURIComponent(userId)}`),

  issue: (userId: string) =>
    callBackend<IssuedApiKey>("/apikeys", { method: "POST", body: JSON.stringify({ userId }) }),

  revoke: (userId: string, id: string) =>
    callBackend<{ success: true }>(`/apikeys/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),

  resolvePrincipal: (token: string) =>
    callBackend<AgentPrincipal | null>("/apikeys/resolve-principal", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  recordAgentWrite: (write: AgentWrite) =>
    callBackend<void>("/apikeys/record-write", {
      method: "POST",
      body: JSON.stringify(write),
    }),
};
