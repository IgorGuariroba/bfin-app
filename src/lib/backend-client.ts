import "server-only";
import { context, trace, propagation, metrics, SpanStatusCode } from "@opentelemetry/api";
import { logger } from "./logger";

const tracer = trace.getTracer("bfin.frontend");
const meter = metrics.getMeter("bfin.frontend");
const total = meter.createCounter("bfin.frontend.backend.total");
const duration = meter.createHistogram("bfin.frontend.backend.duracao", { unit: "s" });

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

  return tracer.startActiveSpan("backend.call", async (span) => {
    const started = performance.now();
    let result = "success";
    try {
      const headers = new Headers({
        "content-type": "application/json",
        "x-internal-secret": secret,
        ...init?.headers,
      });
      propagation.inject(context.active(), headers, {
        set: (carrier, key, value) => carrier.set(key, value),
      });
      const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
      if (response.status === 204) return undefined as T;
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body ? String(body.error) : "Erro no backend";
        throw new BackendError(response.status, message);
      }
      return body as T;
    } catch (error) {
      result = "error";
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.setAttribute("error.type", error instanceof Error ? error.name : "UnknownError");
      throw error;
    } finally {
      span.setAttribute("operation.result", result);
      const labels = { result };
      total.add(1, labels);
      duration.record((performance.now() - started) / 1000, labels);
      logger.info({ event: "frontend.backend.result", result });
      span.end();
    }
  });
}
