# 16. Semgrep integrado à AppSec Platform como gate de SAST no CI

Data: 2026-07-04
Status: Aceito (job ainda não é required check no branch protection — ver Consequências)

## Contexto

O CI (`ci.yml`) cobria lint, typecheck, código morto (Knip, ADR-0013) e duplicação (jscpd), mas nenhuma ferramenta de SAST/segurança. Adicionamos um job `semgrep` rodando `semgrep ci` (imagem oficial `semgrep/semgrep`), autenticado via `SEMGREP_APP_TOKEN`, integrado à plataforma Semgrep AppSec (semgrep.dev) — em vez de CLI standalone (`semgrep scan --config=auto`) sem conta.

## Decisão

Escolhemos a integração com a plataforma porque o repo ainda não foi triado: não sabemos quantos findings existem hoje nem quais são falso-positivo. A plataforma dá, por regra, um toggle "Monitor" (só reporta) vs "Block" (falha o CI) no Rules Board — permite nascer em modo report-only e promover regra a regra depois de triar, em vez de travar todo PR num achado pré-existente não relacionado à mudança. Esse crescimento gradual do gate segue o mesmo padrão do jscpd (threshold "não piorar" em vez de limpeza retroativa) e do ADR-0015 (pre-commit rápido, CI completo).

A CLI standalone com `--config=auto` foi descartada porque bloquear tudo-ou-nada desde o primeiro run é tudo ou nada: sem um mecanismo de triagem por regra, qualquer finding pré-existente travaria merges não relacionados.

## Consequências

- **Dependência de conta externa**: diferente de Knip/jscpd (ferramentas locais, sem SaaS), o gate de segurança agora depende de uma conta em semgrep.dev. Mitigado por rodar como job separado (`semgrep`, não dentro de `validate`) — se a integração externa cair ou o token expirar, não trava o job de build/test/lint.
- **Sem custo recorrente**: ao contrário do Pluggy (ADR-0007), a plataforma Semgrep é gratuita para repositórios públicos — `bfin-app` é público, então essa integração não repete o problema de custo que motivou a remoção do Pluggy.
- O job `semgrep` **ainda não é required check** no branch protection do `master`. Fica assim até os findings existentes serem triados no dashboard e as regras relevantes promovidas a "Block".
