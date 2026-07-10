# Plano de correção — issue #248 (varredura code-health 2026-07-10)

Correção TDD dos 5 achados da issue #248. Cada ciclo segue vermelho → verde:
primeiro um teste que **reproduz o problema** (a rota deixa `BackendError`
escapar como exceção em vez de devolver JSON `{error}` com o status do
backend), depois a correção mínima que o faz passar.

## Contexto

- `backendErrorResponseOrRethrow` (`src/lib/backend-client.ts`) é o handler
  padrão do catch nos route handlers do gateway (introduzido na #245/#247).
- `getEffectiveUserId` (`src/lib/effective-user.ts`) e `getUserPlan`
  (`src/lib/plan.ts`) chamam o backend via `identityClient`/`callBackend` e
  podem lançar `BackendError` — mas em ~10 endpoints são chamados **fora** do
  `try`, produzindo o 500 genérico do Next.
- Padrão correto de referência: `src/app/api/tags/route.ts` (handler inteiro
  no `try`, exceto o check de sessão).

## Seams sob teste

Os testes exercitam o **handler exportado da rota** (`GET`/`POST`/`PUT`/`DELETE`)
e observam apenas a `Response` devolvida. Mocks só na fronteira externa:

- `@/lib/auth` (sessão) e `next/headers` (cookies) — mesmo padrão dos testes
  de integração existentes;
- os módulos `*-client` (`identityClient`, `billingClient`,
  `transactionsClient`, `previsaoClient`, `insightsClient`) — são o adaptador
  HTTP pro bfin-backend; o mock rejeita com `BackendError` real (importado de
  `@/lib/backend-client`).

Testes são **unit** (`*.test.ts`, sem sufixo `.integration`): não tocam
Postgres nem backend, rodam no pre-commit (ADR-0015).

## Ciclos

| # | Achado | Alvo | Teste (vermelho) | Correção (verde) |
|---|--------|------|------------------|------------------|
| 1 | 1 | `api/plan-prices/route.ts` | `getPlanPrices` rejeita com `BackendError(503)` → espera `Response` 503 com `{error}`; hoje a exceção escapa | envolver em `try/catch` + `backendErrorResponseOrRethrow` |
| 2 | 2 | `api/invites/switch/route.ts` | `getDelegationInfo` rejeita com `BackendError(503)` → espera 503 JSON | envolver corpo do `POST` no `try` |
| 3 | 3 | `lib/month-insight-route.ts` (cobre `/api/saldos` e `/api/totais`) | `getDelegationInfo` (via `getEffectiveUserId`) rejeita → espera 503 JSON | mover `getEffectiveUserId`/`getUserPlan` pro `try` |
| 4 | 3 | `api/transactions/route.ts` (GET+POST) | idem | expandir `try` até logo após o check de auth |
| 5 | 3 | `api/transactions/[id]/route.ts` (PUT+DELETE) | idem | idem |
| 6 | 3 | `api/previsao/route.ts` (GET+POST) | idem | idem |
| 7 | 3 | `api/previsao/[id]/route.ts` | idem | idem |
| 8 | 3 | `api/previsao/aplicar/route.ts` | idem | idem |
| 9 | 4 | `lib/insights-client.ts` | sem teste de runtime (código morto) | remover `SugestaoTipo`, `Sugestao`, `getSugestoes`; validação: `tsc` + Knip + suíte verde |
| 10 | 5 | `lib/transactions-client.ts` | idem | remover `transactionsClient.suggest` e tipos exclusivos dele |

Nota do ciclo 3–8: as validações de query/plano que ficam entre os helpers e a
chamada final (400/403 via `return Response.json`) entram no `try` sem mudança
de comportamento — são `return`s normais, não exceções.

## Verificação final

1. `npx vitest run --project unit` verde (inclui os testes novos).
2. `npx tsc --noEmit` + Knip/jscpd via pre-commit.
3. PR único referenciando a #248; CI roda a suíte de integração.

## Status

- [x] Ciclo 1 — plan-prices
- [x] Ciclo 2 — invites/switch
- [x] Ciclo 3 — month-insight-route
- [x] Ciclo 4 — transactions
- [x] Ciclo 5 — transactions/[id]
- [x] Ciclo 6 — previsao
- [x] Ciclo 7 — previsao/[id]
- [x] Ciclo 8 — previsao/aplicar
- [x] Ciclo 9 — insights-client (código morto)
- [x] Ciclo 10 — transactions-client (código morto)

Concluído em 2026-07-10: suíte unit 22/22 verde, `tsc --noEmit` limpo,
Knip sem achados. Pendente: PR + suíte de integração no CI.
