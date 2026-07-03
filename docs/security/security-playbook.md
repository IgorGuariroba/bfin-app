# Security Playbook — routine de detecção de segurança

Instruções executáveis da **routine de Detecção de Segurança**, irmã da routine de observabilidade do ADR-0008 (`docs/observability/detection-playbook.md`), mas focada em vulnerabilidades e sinais de ataque em vez de anomalias operacionais. Mesmo modelo de dois níveis: Página (urgência, fora deste playbook) e **Detecção → GitHub Issue** (e draft PR quando aplicável).

> Glossário e arquitetura: `docs/adr/0008-observabilidade-ativa-paginas-e-deteccoes.md`. Este playbook reaproveita o mesmo ciclo de vida de Issue, com namespace próprio (`security-<chave>`) para não colidir com as detecções operacionais.

## Guardrails (inegociáveis)

1. **Repo é read-only para o código-fonte.** A routine só lê o clone raso; nunca commita direto, nunca faz push em branch protegida. Escrita é sempre via `gh` (issue/draft PR).
2. **Grafana é read-only.** Mesmo token/recipe do playbook de observabilidade. Nunca escreve no Grafana.
3. **Nunca mexe em produção.** Nada de deploy, migração, rotação de segredo ou escrita no banco — mesmo achando uma vulnerabilidade grave, a ação é abrir Issue/PR, nunca aplicar.
4. **Draft PR só com prova red→green.** Só abre PR se conseguir um teste que falha sem o fix e passa com ele (ex.: `npm audit` limpo, guard de admin presente). Senão, **issue-only** com o fix proposto no corpo. PR sempre `--draft`, CI obrigatório, sem merge.
5. **Se uma ferramenta/query ERRAR (rede, binário ausente, `status` != success), não faz nada** para aquele detector — não arquiva nem abre com base em dado ausente por falha de infra.
6. **Detecção de segurança nunca vaza segredo no corpo da Issue.** Se o achado for um segredo vazado, a Issue referencia arquivo:linha e o tipo de segredo — nunca cola o valor encontrado.
7. Respeita as regras do repo: lockfile em node 22, padrões `defensive-client`.

## Setup do clone

```bash
rm -rf /tmp/bfin-security && git clone --depth 1 "https://x-access-token:${GH_TOKEN}@github.com/IgorGuariroba/bfin-app.git" /tmp/bfin-security && cd /tmp/bfin-security
```

Se o clone falhar, reporte (token sem acesso?) e pare.

## Como consultar o Grafana (Loki) — só para detectores de runtime

```bash
TOKEN="$GRAFANA_READONLY_TOKEN"
BASE="https://igorguari.grafana.net/api/datasources/proxy/uid/grafanacloud-logs/loki/api/v1"
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/query?query=<LogQL url-encoded>&time=$(($(date +%s)*1000000000))"
```

**Nota crítica de schema (Loki/OTLP):** campos do pino (`reason`, `email`, `ip`, `apiKeyId`, `kind`) são **structured metadata**, NÃO stream labels. Filtra com `| reason="invalid_token"`, nunca `{reason="invalid_token"}`. Stream labels reais: `app_id, app_key, deployment_environment, kind, service_name, service_namespace` (cuidado: `kind` aparece nos dois papéis — como stream label do OTel E como campo de negócio do rate limit; desambiguar pelo contexto da query).

## Convenção de Issue (dedup + ciclo de vida)

- **Chave de detecção** estável, com namespace `security-`: `[detection:security-<chave>] <resumo>`. Ex.: `[detection:security-dep-vuln-high] 3 vulnerabilidades HIGH em dependências de produção`.
- **Antes de abrir**, busca issue aberta com a chave: `gh issue list --state open --search "[detection:security-<chave>] in:title"`. Existe → comenta/atualiza. Não existe → abre.
- **Labels:** sempre `detection` + `security` + (`detection:state` ou `detection:improvement`).
- **Barra de persistência:** detectores de runtime (janela curta) exigem 2 varreduras consecutivas antes de abrir. Detectores de código (auditoria) agem na primeira varredura — não há ruído de baixo-tráfego a filtrar.
- **Fechamento em dois modos:**
  - `detection:state` (ex.: vuln corrigida, guard reaplicado, config do dependabot criada) → quando a condição limpa, comenta "resolvido em \<ts>" e fecha.
  - `detection:improvement` (padrão suspeito sem fix determinístico, ex.: burst de tentativas) → nunca fecha sozinho; comenta "não observado nas últimas N janelas". Só o PR fecha.

### Corpo da issue (template)

```
**Detecção automática de segurança** (routine irmã do ADR-0008) — chave `detection:security-<chave>`

**O que foi observado:** <fato + números + janela/commit>
**Fonte:** <comando/query usado>
**Severidade:** <baixa/média/alta/crítica — e por quê>
**Por que importa:** <impacto/exposição>
**Provável causa / onde olhar:** <arquivo:linha>
**Fix proposto:** <patch sugerido ou "abrir draft PR #N">

_Gerado automaticamente. Se for ruído ou falso positivo, feche e ajuste o playbook._
```

---

## Detectores

### ✅ `dep-vuln-high` — ATIVO

Dependências com vulnerabilidade conhecida (HIGH/CRITICAL) e fix disponível. Hoje o CI não roda `npm audit` e não há Dependabot configurado (ver detector `dependabot-config-missing`) — este detector é a rede de segurança enquanto isso não muda.

- **Tipo:** `detection:state` (auto-fecha quando o audit limpar aquele pacote).
- **Comando:**
  ```bash
  npm audit --audit-level=high --json
  ```
- **Decisão:** comando roda sem erro de execução (mesmo que ache vulnerabilidade, exit code != 0 é esperado — só trate como falha de infra um erro de rede/registro) → parseie `vulnerabilities`. Para cada pacote com `severity` `high`/`critical` **e** `fixAvailable` truthy: abrir/atualizar issue com chave `dep-vuln-high-<nome-do-pacote>` (uma issue por pacote, não uma por corrida — dedup real). Pacote sumiu do output → fechar a issue correspondente.
- **Corpo sugere:** rodar `npm audit fix` (ou o major indicado) e checar breaking changes; apontar o pacote/versão afetada e a CVE.

### ✅ `admin-guard-missing` — ATIVO

Toda rota em `src/app/api/admin/**/route.ts` deve chamar `requireAdminOr403` ou `requireBlogAdmin` (não há middleware central — o risco é esquecer o guard numa rota nova).

- **Tipo:** `detection:improvement` (bug real de autorização — só fecha por PR).
- **Como checar:**
  ```bash
  for f in $(find src/app/api/admin -name route.ts); do
    grep -qE "requireAdminOr403|requireBlogAdmin" "$f" || echo "SEM GUARD: $f"
  done
  ```
- **Decisão:** qualquer arquivo listado como "SEM GUARD" → abrir/atualizar issue com chave `admin-guard-missing-<caminho-do-arquivo-slugificado>`, uma por arquivo. Tentar draft PR com o guard adicionado (`await requireAdminOr403()` no topo do handler, retornando a Response se não-nulo — replicar o padrão dos handlers vizinhos) **e** um teste que falha sem o guard (chamada não-admin retornando 200) e passa com ele (retornando 403). Se o handler for muito diferente dos padrões existentes para replicar com segurança, cair para issue-only.
- **Corpo sugere:** apontar o arquivo e o padrão usado nos irmãos (`src/lib/admin-route.ts`/`src/lib/blog-admin.ts`).

### ✅ `secret-scan` — ATIVO

Segredo commitado no working tree (chave de API, token, credencial hardcoded) fora do `.env.example` (que documenta placeholders, não valores reais).

- **Tipo:** `detection:improvement` (nunca fecha sozinho — mesmo removendo o segredo do código, a chave pode já estar comprometida; só o PR de remoção + rotação manual do dono fecha).
- **Comando:**
  ```bash
  npx --yes gitleaks detect --source . --no-git --redact -v
  ```
  Se `npx gitleaks` falhar por ausência de rede/pacote (não por achado), trate como guardrail #5 (ferramenta indisponível) e **pule o detector** nesta varredura — não caia para um scan manual improvisado.
- **Decisão:** qualquer achado com `--redact` (gitleaks já mascara o valor) → abrir/atualizar issue com chave `secret-scan-<regra>-<arquivo-slugificado>`. **NUNCA** cole o segredo real no corpo da issue (guardrail #6) — use apenas o que o gitleaks já reporta redacted.
- **Corpo sugere:** remover o valor do código, mover para variável de ambiente (ver `.env.example` para o padrão de nome), e **avisar explicitamente que o segredo pode precisar ser rotacionado** (não é a routine que rotaciona).

### ✅ `dependabot-config-missing` — ATIVO

`.github/dependabot.yml` não existe hoje, mas `.github/workflows/dependabot-auto-merge.yml` já pressupõe que ele exista (auto-merge de PRs do Dependabot que nunca serão abertos sem a config).

- **Tipo:** `detection:state` (auto-fecha quando o arquivo aparecer).
- **Como checar:** `test -f .github/dependabot.yml`.
- **Decisão:** arquivo ausente → abrir/atualizar issue `[detection:security-dependabot-config-missing]`. Arquivo presente → fechar se houver issue aberta.
- **Corpo sugere:** um `dependabot.yml` mínimo para `npm` no diretório raiz, `schedule: weekly`, compatível com o workflow de auto-merge já existente. Se conseguir validar o YAML localmente (schema básico), pode tentar draft PR; senão issue-only.

---

## Backlog (a validar contra o Loki real antes de ativar)

Estes detectores dependem dos logs estruturados adicionados para viabilizar esta routine (`auth: login failed`, `auth: login rate limited`, `apikey: auth denied`, `apikey: rate limited`, `admin: access denied`). Cada um só entra como ATIVO depois de ter sua LogQL validada contra o Loki real em produção (mesma disciplina do playbook de observabilidade) — os logs precisam estar rodando em prod por tempo suficiente para confirmar volume/baseline antes de definir o limiar.

- `login-bruteforce` — muitas ocorrências de `"auth: login failed"` do mesmo `ip` (ou mesmo `email` de múltiplos `ip`) numa janela curta → sinal de tentativa de força bruta além do que o rate limit já barra sozinho (5/15min por IP+email) — este detector pega o padrão distribuído (mesmo email, IPs diferentes) que o rate limit atual não cobre. `detection:improvement`.
- `apikey-401-burst` — muitas ocorrências de `"apikey: auth denied"` com `reason="invalid_token"` em janela curta → varredura/credential stuffing de Bearer tokens no endpoint MCP. `detection:improvement`. Distinto do `apikey-rate-limited` do playbook de observabilidade (que é sobre uma chave *válida* estourando a própria cota — sinal de UX/uso pesado, não de ataque).
- `admin-403-burst` — muitas ocorrências de `"admin: access denied"` do mesmo usuário em janela curta → possível tentativa de escalar privilégio ou sessão comprometida testando rotas admin. `detection:improvement`.
