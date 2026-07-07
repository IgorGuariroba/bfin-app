// Smoke da ADR-0018 (#228) — seam único, parametrizado por URL, consumido pelo
// CI de PR (contra o app servido em localhost) e pelo workflow pós-merge
// (contra produção). Verifica só comportamento externo (status, corpo, cookie);
// exit code != 0 indica o passo que falhou.
//
// Env: BASE_URL (ou 1º argumento), SMOKE_EMAIL, SMOKE_PASSWORD;
// SMOKE_WEBHOOK_URL opcional (default BASE_URL + path público do webhook —
// em CI aponta direto pro backend, já que não há Traefik roteando por path).
import "dotenv/config";

const baseUrl = (process.argv[2] ?? process.env.BASE_URL ?? "").replace(/\/$/, "");
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const webhookUrl = process.env.SMOKE_WEBHOOK_URL ?? `${baseUrl}/api/webhook/mercadopago`;

if (!baseUrl || !email || !password) {
  console.error("[smoke] BASE_URL (ou 1º arg), SMOKE_EMAIL e SMOKE_PASSWORD são obrigatórios");
  process.exit(2);
}

const jar = new Map();
function storeCookies(res) {
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1));
  }
}
function req(url, init = {}) {
  return fetch(url, {
    redirect: "manual",
    ...init,
    headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...init.headers },
  }).then((res) => (storeCookies(res), res));
}

let step = 0;
function ok(name) {
  console.log(`[smoke] ${++step}/4 ok — ${name}`);
}
function fail(name, detail) {
  console.error(`[smoke] FALHOU no passo ${step + 1}/4 (${name}): ${detail}`);
  process.exit(1);
}

// 1. Health — o caso grosseiro (app fora do ar / DB inalcançável) primeiro e barato.
{
  const res = await req(`${baseUrl}/api/health`).catch((e) => fail("health", e.message));
  const body = await res.json().catch(() => null);
  if (res.status !== 200 || body?.ok !== true) {
    fail("health", `status ${res.status}, body ${JSON.stringify(body)}`);
  }
  ok("health");
}

// 2. Login credentials com o usuário sintético — prova NextAuth + adapter + Postgres.
{
  const csrfRes = await req(`${baseUrl}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json().catch(() => ({}));
  if (csrfRes.status !== 200 || !csrfToken) fail("login", `csrf: status ${csrfRes.status}`);

  const loginRes = await req(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password, csrfToken }),
  });
  const hasSession = [...jar.keys()].some((k) => k.endsWith("authjs.session-token"));
  if (!hasSession) {
    fail("login", `sem cookie de sessão (status ${loginRes.status}, location: ${loginRes.headers.get("location")})`);
  }

  const sessionRes = await req(`${baseUrl}/api/auth/session`);
  const session = await sessionRes.json().catch(() => null);
  if (session?.user?.email !== email) {
    fail("login", `sessão não reflete o usuário sintético: ${JSON.stringify(session)}`);
  }
  ok("login com usuário sintético");
}

// 3. Leitura financeira autenticada — atravessa gateway → bfin-backend → Postgres.
{
  const month = new Date().toISOString().slice(0, 7);
  const res = await req(`${baseUrl}/api/totais?month=${month}`);
  const body = await res.json().catch(() => null);
  if (res.status !== 200 || body === null || typeof body !== "object") {
    fail("totais", `status ${res.status}, body ${JSON.stringify(body)}`);
  }
  ok("leitura financeira autenticada (totais)");
}

// 4. Guard do webhook MercadoPago: payload de subscription SEM assinatura → exatamente 401.
// O corpo precisa ser um evento real (type + data.id), senão a rota responde
// 200 "ignored" antes de validar. 200 = probe não alcançou o guard; 500 =
// secret ausente (classe da falha #186); 404/307 = rota sumiu ou proxy barrou.
{
  const res = await fetch(webhookUrl, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "subscription_preapproval", data: { id: "smoke-probe" } }),
  }).catch((e) => fail("webhook-guard", e.message));
  if (res.status !== 401) fail("webhook-guard", `esperava 401, veio ${res.status}`);
  ok("webhook MercadoPago rejeita POST não assinado (401)");
}

console.log("[smoke] 4/4 verdes");
