# Detection Playbook — routine de observabilidade ativa

Instruções executáveis da **routine de Detecção** do ADR-0008. Uma sessão agendada (horária) lê este arquivo e executa a varredura. Páginas (urgência) ficam no Grafana; este playbook cuida das **Detecções → GitHub Issues** (e draft PRs quando aplicável).

> Glossário: [[Alerta (Página)]] / [[Detecção (Issue)]] em `CONTEXT.md`. Arquitetura: `docs/adr/0008-observabilidade-ativa-paginas-e-deteccoes.md`.

## Guardrails (inegociáveis)

1. **Grafana é read-only.** Token em `~/.config/bfin/grafana-readonly.token` (Bearer). Nunca escreve no Grafana.
2. **Nunca mexe em produção.** A routine só abre issue/draft PR. Nada de deploy, migração, ou escrita no banco.
3. **Draft PR só com prova red→green.** Só abre PR se conseguir um teste que falha sem o fix e passa com ele. Senão, **issue-only** com o fix proposto no corpo. PR sempre `--draft`, CI obrigatório, sem merge.
4. **Se a query do Grafana ERRAR, não faz nada** para aquele detector (não arquiva com base em dado ausente por falha de infra). Só age quando a query teve `status: success`.
5. Respeita as regras do repo: lockfile em node 22, padrões `defensive-client`.

## Como consultar o Grafana (Loki)

```bash
TOKEN=$(cat ~/.config/bfin/grafana-readonly.token)
BASE="https://igorguari.grafana.net/api/datasources/proxy/uid/grafanacloud-logs/loki/api/v1"
# query instantânea:
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/query?query=<LogQL url-encoded>&time=$(($(date +%s)*1000000000))"
```

**Nota crítica de schema (Loki/OTLP):** os campos do pino (`action`, `apiKeyId`, `userId`, `entityId`) são **structured metadata**, NÃO stream labels. Filtra com `| action="delete"`, **nunca** `{action="delete"}` (esse seletor não casa nada). Stream labels reais: `app_id, app_key, deployment_environment, kind, service_name, service_namespace`.

## Convenção de Issue (dedup + ciclo de vida)

- **Chave de detecção** estável por problema, no título: `[detection:<chave>] <resumo>`. Ex.: `[detection:cron-baixa-diaria-stale] baixa diária não roda há >25h`.
- **Antes de abrir**, busca issue aberta com a chave:
  `gh issue list --state open --search "[detection:<chave>] in:title"`.
  Se existe → **comenta/atualiza**, não abre outra. Se não existe → abre.
- **Labels:** sempre `detection` + (`detection:state` ou `detection:improvement`).
- **Barra de persistência:** só arquiva se a condição for real (ver guardrail #4). Para detectores de janela curta, exigir 2 varreduras consecutivas antes de abrir.
- **Fechamento em dois modos:**
  - `detection:state` → quando a condição limpa, **comenta "resolvido em \<ts>" e fecha** (`gh issue close`).
  - `detection:improvement` → **nunca fecha sozinho**; quando o sintoma some, comenta "não observado nas últimas N janelas". Só o PR fecha.

### Corpo da issue (template)

```
**Detecção automática** (routine ADR-0008) — chave `detection:<chave>`

**O que foi observado:** <fato + números + janela>
**Query:** `<LogQL>`
**Por que importa:** <impacto no usuário/negócio>
**Provável causa / onde olhar:** <arquivo:linha, ADR, deploy correlacionado>
**Fix proposto:** <patch sugerido ou "abrir draft PR #N">

_Gerado automaticamente. Se for ruído, feche e ajuste o playbook._
```

---

## Detectores

### ✅ `cron-baixa-diaria-stale` — ATIVO

A baixa diária (ADR-0005) roda todo dia ~00:05 e **loga incondicionalmente** (`src/app/api/cron/baixa-diaria/route.ts:48`, mesmo com `count=0`). Logo, **ausência do log por >25h = cron morto** (Dokploy parou, `CRON_SECRET` quebrado, ou deploy ruim). NÃO usar `count==0` como sinal — `count:0` é legítimo (toggle off / sem previsão aplicada).

- **Tipo:** `detection:state` (auto-fecha quando voltar a rodar).
- **Query:**
  ```logql
  sum(count_over_time({service_name="bfin-app"} | action="baixa_diaria" [25h]))
  ```
- **Decisão:** `status:success` E resultado vazio/`0` → cron stale → abrir/atualizar issue `[detection:cron-baixa-diaria-stale]`. Resultado `≥1` → se houver issue aberta com essa chave, **fechar** com "voltou a rodar em \<ts da última execução>".
- **Corpo sugere:** verificar o cron no Dokploy, o header `x-cron-secret`/`CRON_SECRET`, e o último deploy. Apontar `ADR-0005` e a rota do cron.

---

## Backlog (a validar contra o Loki real antes de ativar)

Cada um só entra como ATIVO depois de ter sua LogQL validada (sem erro de parse, baseline conferido), igual ao de cima.

- `js-error-recurring` — mesma assinatura de erro JS (`kind="exception"`) repetindo acima de um piso → `detection:improvement`, issue com a stack.
- `endpoint-latency-regression` — p95 de uma rota (Tempo) degradando vs. baseline/deploy, **com checagem de volume mínimo** (regra de ouro do baixo tráfego: ignorar se houver poucas requisições) → `detection:improvement`.
- `agent-dedup-frequent` — `create_transaction` retornando "possível duplicata" com frequência (agent×manual) → sinal de UX → `detection:improvement`.
- `apikey-rate-limited` — `ApiKey` batendo HTTP 429 repetidamente → `detection:state`.
- `web-vitals-regression` — LCP/INP p75 (Faro) piorando → `detection:improvement`.
