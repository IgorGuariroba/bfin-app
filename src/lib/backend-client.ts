import "server-only";

// Gateway HTTP pro bfin-backend (ADR-0017): rotas financeiras da UI chamam o
// backend internamente já com o userId resolvido, autenticadas por um
// segredo compartilhado (mesmo padrão que CRON_SECRET já usa neste repo).
export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// Handler comum pro catch dos route handlers: BackendError já carrega o
// status/mensagem que o backend quis devolver; qualquer outro erro sobe.
export function backendErrorResponseOrRethrow(error: unknown): Response {
  if (error instanceof BackendError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}

export async function callBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.BACKEND_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!baseUrl || !secret) {
    throw new Error("BACKEND_URL/INTERNAL_API_SECRET não configurados");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-secret": secret,
      ...init?.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body ? String(body.error) : "Erro no backend";
    throw new BackendError(response.status, message);
  }

  return body as T;
}
