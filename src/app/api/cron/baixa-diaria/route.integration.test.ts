import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { POST } from "./route";

const SECRET = "test-cron-secret";

function cronRequest(secret: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) headers["x-cron-secret"] = secret;
  return new Request("http://localhost/api/cron/baixa-diaria", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/cron/baixa-diaria", () => {
  it("retorna 401 sem o header x-cron-secret", async () => {
    const res = await POST(cronRequest(null));
    expect(res.status).toBe(401);
  });

  it("retorna 401 com secret errado", async () => {
    const res = await POST(cronRequest("secret-errado"));
    expect(res.status).toBe(401);
  });

  it("retorna 500 (fail-closed) quando CRON_SECRET não está configurado", async () => {
    vi.stubEnv("CRON_SECRET", "");
    const res = await POST(cronRequest(SECRET));
    expect(res.status).toBe(500);
  });

  it("repassa o count retornado pelo bfin-backend com secret correto", async () => {
    const res = await POST(cronRequest(SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(typeof body.count).toBe("number");
  });
});
