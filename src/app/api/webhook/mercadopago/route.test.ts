import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

const { mockPreApprovalGet } = vi.hoisted(() => ({ mockPreApprovalGet: vi.fn() }));

// Mock parcial: só PreApproval (evita chamada real à API). O
// WebhookSignatureValidator fica o real — é ele que está sob teste.
vi.mock("mercadopago", async (importOriginal) => ({
  ...(await importOriginal<typeof import("mercadopago")>()),
  PreApproval: class {
    get = mockPreApprovalGet;
  },
}));

import { POST } from "./route";

const SECRET = "test-mp-webhook-secret";
const DATA_ID = "preapproval-123";
const REQUEST_ID = "req-abc";

let createdUserIds: string[] = [];

async function makeUser() {
  const user = await prisma.user.create({
    data: {
      name: "MP User",
      email: `mp-${crypto.randomUUID()}@example.com`,
      plan: "free",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

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
  // Evita side effects reais caso o .env.local tenha os webhooks configurados.
  vi.stubEnv("DISCORD_WEBHOOK_URL", "");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  if (createdUserIds.length) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    createdUserIds = [];
  }
});

describe("POST /api/webhook/mercadopago — verificação de assinatura", () => {
  it("responde 500 (fail-closed) quando o secret não está configurado", async () => {
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    expect(mockPreApprovalGet).not.toHaveBeenCalled();
  });

  it("rejeita assinatura inválida com 401", async () => {
    const res = await POST(webhookRequest({ v1: "deadbeef".repeat(8) }));

    expect(res.status).toBe(401);
    expect(mockPreApprovalGet).not.toHaveBeenCalled();
  });

  it("rejeita replay: ts além da tolerância com 401", async () => {
    const staleTs = String(Math.floor(Date.now() / 1000) - 10 * 60);

    const res = await POST(webhookRequest({ ts: staleTs }));

    expect(res.status).toBe(401);
    expect(mockPreApprovalGet).not.toHaveBeenCalled();
  });

  it("processa webhook legítimo: assinatura válida e recente ativa o plano", async () => {
    const user = await makeUser();
    mockPreApprovalGet.mockResolvedValue({
      id: "sub-1",
      status: "authorized",
      external_reference: `${user.id}:monthly`,
    });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.plan).toBe("pro");
    expect(updated.mpSubscriptionId).toBe("sub-1");
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
    expect(mockPreApprovalGet).not.toHaveBeenCalled();
  });
});
