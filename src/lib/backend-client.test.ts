import { afterEach, describe, expect, it, vi } from "vitest";
import { propagation } from "@opentelemetry/api";
import { BackendError, callBackend } from "./backend-client";
import { logger } from "./logger";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function setup() {
  vi.stubEnv("BACKEND_URL", "http://backend.internal");
  vi.stubEnv("INTERNAL_API_SECRET", "PRIVATE_SECRET");
  const log = vi.spyOn(logger, "info").mockImplementation(() => {});
  return log;
}
describe("gateway observado", () => {
  it("propaga o contexto, preserva resultado e exclui argumentos dos logs", async () => {
    const log = setup();
    vi.spyOn(propagation, "inject").mockImplementation((_ctx, carrier, setter) => {
      setter?.set(carrier, "traceparent", "00-11111111111111111111111111111111-2222222222222222-01");
    });
    const fetcher = vi.fn().mockResolvedValue(Response.json({ total: 0 }));
    vi.stubGlobal("fetch", fetcher);
    expect(await callBackend("/insights/totais?userId=PRIVATE_USER")).toEqual({ total: 0 });
    const headers = fetcher.mock.calls[0][1].headers as Headers;
    expect(headers.get("traceparent")).toBe("00-11111111111111111111111111111111-2222222222222222-01");
    expect(headers.get("x-internal-secret")).toBe("PRIVATE_SECRET");
    expect(JSON.stringify(log.mock.calls)).not.toContain("PRIVATE_");
    expect(log).toHaveBeenCalledWith({ event: "frontend.backend.result", result: "success" });
  });
  it("preserva o status de erro do backend e registra somente resultado", async () => {
    const log = setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "PRIVATE_MESSAGE" }, { status: 503 })));
    await expect(callBackend("/x")).rejects.toEqual(new BackendError(503, "PRIVATE_MESSAGE"));
    expect(log).toHaveBeenCalledWith({ event: "frontend.backend.result", result: "error" });
    expect(JSON.stringify(log.mock.calls)).not.toContain("PRIVATE_");
  });
  it("mantém a resposta sem conteúdo", async () => {
    setup();vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await callBackend("/x")).toBeUndefined();
  });
});
