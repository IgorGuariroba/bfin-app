import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { POST } from "./route";

const SECRET = "test-mp-webhook-secret";
const DATA_ID = "preapproval-123";
const REQUEST_ID = "req-abc";

function sign(dataId: string, ts: string, secret = SECRET) {
  // Manifesto oficial do MP: id em lowercase e `;` no final.
  const message = `id:${dataId.toLowerCase()};request-id:${REQUEST_ID};ts:${ts};`;
  return createHmac("sha256", secret).update(message).digest("hex");
}

function webhookRequest(opts: { ts?: string; v1?: string; type?: string } = {}) {
  const ts = opts.ts ?? String(Math.floor(Date.now() / 1000));
  const v1 = opts.v1 ?? sign(DATA_ID, ts);
  return new Request("http://localhost/api/webhook/mercadopago", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": `ts=${ts},v1=${v1}`,
      "x-request-id": REQUEST_ID,
    },
    body: JSON.stringify({
      type: opts.type ?? "subscription_preapproval",
      data: { id: DATA_ID },
    }),
  });
}

beforeEach(() => {
  vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// O efeito de domínio (ativar/desvincular o plano) roda no bfin-backend real
// via billingClient.processSubscriptionEvent e é coberto lá
// (routes/billing.integration.test.ts e billing-repo.integration.test.ts,
// ADR-0017) — aqui só a verificação de assinatura, que continua sendo
// responsabilidade deste gateway.
describe("POST /api/webhook/mercadopago — verificação de assinatura", () => {
  it("responde 500 (fail-closed) quando o secret não está configurado", async () => {
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
  });

  it("rejeita assinatura inválida com 401", async () => {
    const res = await POST(webhookRequest({ v1: "deadbeef".repeat(8) }));

    expect(res.status).toBe(401);
  });

  it("rejeita replay: ts além da tolerância com 401", async () => {
    const staleTs = String(Math.floor(Date.now() / 1000) - 10 * 60);

    const res = await POST(webhookRequest({ ts: staleTs }));

    expect(res.status).toBe(401);
  });

  it("ignora eventos de outro tipo sem exigir assinatura", async () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const req = new Request("http://localhost/api/webhook/mercadopago", {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": `ts=${ts},v1=xx` },
      body: JSON.stringify({ type: "payment", data: { id: "pay-1" } }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
