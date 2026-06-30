# 8. Observabilidade ativa: Páginas determinísticas no Grafana, Detecções via routine que triaga e propõe PRs

Data: 2026-06-30
Status: Aceito

## Contexto

A observabilidade do bfin era **passiva e barulhenta**: todo sinal do Grafana virava a mesma mensagem no Discord (#bfin-health). O caso concreto que disparou esta decisão foi um alerta `DatasourceNoData` no `bfin-frontend-error-rate` que repetia `[FIRING]/[RESOLVED]` sem nenhum problema real — em janelas de baixo tráfego a query Loki voltava vazia e o estado "sem dados" disparava (corrigido mudando NoData→OK). A lição: **uma notificação no Discord é passiva por natureza** (você lê, dá scroll, o problema continua) e **alertas baseados em taxa não fazem sentido no volume do bfin** (finanças pessoais, poucas requisições por janela — 1 request lento vira "p95=2s, PAGE!").

Três objetivos do dono: (1) só ser interrompido quando há problema **real e urgente**; (2) que o resto vire **trabalho rastreável**, não notificação esquecível; (3) que a observabilidade **melhore o app** ativamente, não só relate.

Telemetria disponível (OTel): traces→Tempo, logs estruturados→Loki (eventos de negócio: `baixa_diaria` com `count`, `"agent write"` com `apiKeyId/userId/action/entityId`, `health check: DB unreachable`), RUM→Faro (erros JS, Web Vitals).

## Decisão

**Modelo de dois níveis**, com termos canonizados no glossário ([[Alerta (Página)]], [[Detecção (Issue)]]):

1. **Alerta (Página)** — sintoma que exige ação humana imediata. Fica no **Grafana**, tempo real, Discord. **Apenas 3 sinais determinísticos**, todos robustos a baixo tráfego (evento/ausência/contagem, nunca taxa): `probe_success==0` (app down, via Synthetic), `DB unreachable` (evento de log), e **burst de delete do agente** (`action="delete"` > 5 em 1 min por `ApiKey`). Este último é a única Detecção de negócio elevada a Página, porque o delete do agente é **físico e irreversível** (ADR-0004) — um "issue daqui a 1h" chegaria tarde demais.

2. **Detecção (Issue)** — degradação/anomalia/melhoria, não urgente. Materializada como **GitHub Issue triada**, gerada por uma **routine agendada na nuvem (horária)** que lê o Grafana via **token de service account read-only** e **investiga** antes de arquivar (causa-raiz, rota afetada, correlação com deploy). Não usa o Grafana como motor porque uma issue de threshold-dump é só ruído relocado; o valor está na triagem.

3. **Ciclo de vida da Issue:** dedup por **chave de detecção estável** (uma issue por problema, atualizada em vez de duplicada) + **barra de persistência** (N janelas consecutivas antes de arquivar). Fechamento em **dois modos**: detecções de **estado** (cron parado, DB, 429) a routine **auto-fecha** quando a condição limpa; detecções de **melhoria/bug** (endpoint lento, erro recorrente) a routine **nunca fecha** — o sumiço do sintoma não prova o fix; só o PR fecha.

4. **Profundidade nível 3 com portão de confiança:** a routine abre **draft PR** (nunca "ready for review", CI obrigatório, linkado à issue, sem merge) **somente quando consegue escrever um teste que vai de vermelho→verde** provando o conserto. Sem esse teste, cai para **issue-only** com o fix proposto no corpo. O portão se auto-seleciona: se a causa é difusa/arquitetural/em vendor, a routine não consegue o teste e não abre PR.

## Consequências

**Positivas:**
- O ruído morre na origem: ~90% do que hoje notifica não é acionável na hora → vira Detecção, não Página.
- Detecções têm valor real (issue triada + fix proposto/PR auto-verificável), não threshold-dump.
- A routine na nuvem é independente do laptop do dono — o vigia não dorme.
- Catálogo baseado em evento/ausência/contagem é imune ao problema de baixo tráfego que causou o spam original.

**Negativas / trade-offs aceitos:**
- A routine na nuvem tem **acesso de escrita ao repo** (limitado a abrir draft PRs, sem merge). Risco contido por construção: draft + CI + portão do teste + merge humano.
- Detecção tem latência de até 1h (aceito: urgência é Página).
- Custo de execução (uma passada/hora) e risco de a routine errar uma detecção (mitigado: ela arquiva/propõe, nunca aplica em prod sozinha).

## Alternativas descartadas

- **Canal único (só "alertar menos e melhor"):** não atende ao objetivo de "criar issues que se tratam" — mantém a observabilidade passiva.
- **Grafana empurra issue via webhook (event-driven):** determinístico e barato, mas exige infra de cola e produz issue burra (threshold-dump) — ruído relocado pro GitHub, sem poupar a investigação.
- **Páginas reativas de latência/error-rate (SLO/threshold):** estatisticamente sem sentido no volume do bfin — é a mesma doença do NoData com outra roupa. Latência/erro viram Detecção, julgadas sobre janela longa com checagem de volume mínimo.
- **Profundidade nível 1 (só arquiva) ou nível 2 (propõe fix sem PR):** menor superfície de risco, mas o dono optou pelo nível 3; o portão do teste red→green é o que torna o draft PR seguro (artefato auto-verificável em vez de "confia em mim").
- **Draft PR sem teste / whitelist de tipos:** mais rápido, mas reintroduz o "confia na automação" que o ADR-0004 ensinou a evitar.
