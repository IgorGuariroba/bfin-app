# 5. Baixa automática do gasto diário: cron externo do Dokploy + rota protegida + deleteMany único

Data: 2026-06-20
Status: Aceito

## Contexto

O `diario` (`type=diario`) é a **projeção** de gasto variável futuro gerada pelo `apply_previsao` para cada dia numa janela de 12 meses (ver [[Previsão]] no CONTEXT.md). Ele serve bem para o usuário **visualizar** o mês e os meses à frente, mas no cálculo abate o saldo igual a um gasto real (`insights-service.ts`: `entrada − saida − diario − cartao`). Quando o dia chega, a projeção perde sentido: o gasto real quase nunca bate com o previsto, então o usuário hoje precisa **apagar/editar na mão** o diário de cada dia para manter o livro fiel — ou conviver com um gasto que não aconteceu, ou com contagem dobrada (diário R$300 + saída real R$400 = R$700 abatidos no mesmo dia).

Queremos automatizar a remoção do diário **do dia corrente** para o usuário `pro` que optar por isso, preservando os diários futuros como projeção.

## Decisão

1. **Operação = exclusão.** A automação **deleta** (não "paga", não consolida) as `Transaction` `type=diario` do dia corrente. O usuário chamava isso de "pagar", mas não há liquidação — é baixa por exclusão.
2. **Opt-in, `pro`, default desligado.** Coluna `User.autoBaixaDiario Boolean @default(false)`. Toggle em `/configuracoes` (página de settings, ao lado do tema) atrás do gate `pro` — preferida a `/menu`, que é só lista de navegação. O opt-in é a própria rede de proteção contra o efeito colateral (ver Consequências). Ligar exige `pro` (validado no servidor via `getUserPlan`); desligar é sempre permitido (saída do estado após downgrade).
3. **Scheduler externo via cron nativo do Dokploy**, batendo uma vez por dia (**00:05 America/São_Paulo**, 03:05 UTC) numa rota protegida `POST /api/cron/baixa-diaria`.
4. **Rota protegida por secret.** Env `CRON_SECRET` comparado em tempo constante no header; diferente → 401. A rota entra em `publicRoutes` do `src/proxy.ts` (senão o proxy a redireciona para `/login`, como aconteceu com `/api/mcp` no #101) e se autentica sozinha pelo secret.
5. **Trabalho = um único `deleteMany`**, sem iterar usuário, filtrando pela relação:
   ```
   deleteMany({ where: {
     type: "diario",
     source: "manual",                          // nunca toca importados (pluggy) nem agent
     date: { gte: inícioDeHoje, lt: amanhã },   // dia corrente em America/São_Paulo
     user: {
       autoBaixaDiario: true,
       plan: "pro",
       OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],  // espelha getUserPlan
     },
   }})
   ```
   O `source: "manual"` espelha o contrato destrutivo de `apply_previsao` (CONTEXT.md › Previsão; ADR-0004 §4) — o diário gerado é sempre `manual`, mas o filtro protege de apagar qualquer `diario` que venha do Open Finance ou do agente. O `planExpiresAt` replica `getUserPlan` (um `pro` vencido conta como `free`), mantendo o gate consistente com o toggle.
6. **Escopo restrito ao dia corrente.** Não recupera dias passados nem dias em que o job falhou. Ligar a feature **não** faz faxina retroativa — limpa só de hoje em diante; os diários já passados do mês ficam a cargo do usuário (uma vez).
7. **Fuso canônico `America/São_Paulo`.** O container roda em UTC e o app é mono-fuso na prática; "hoje" é a data-calendário em BRT (`saoPauloTodayRange`). Cada diário é gravado ao meio-dia em **hora local do servidor** (`apply_previsao`, igual a `parseTransactionDay`); como o deploy é UTC, isso vira 12:00Z e a janela do dia tem ~12h de folga das bordas, imune a off-by-one. A margem é, portanto, propriedade do deploy em UTC — não imposta pelo código (rodar `apply_previsao` fora de UTC desloca o meio-dia). Mantemos a construção em hora local para não criar uma ilha UTC inconsistente com o resto do app; a dependência está comentada no ponto de gravação. Não modelamos timezone por usuário.

## Consequências

**Positivas:**
- Remove o trabalho manual recorrente de apagar/editar o diário gerado para o mês inteiro.
- Roda **independente de o usuário abrir o app** — essencial porque o usuário `pro` também opera por MCP e WhatsApp, que leem `transactions` sem passar pela tela web.
- Custo de execução desprezível: uma query idempotente por dia (rodar 2× no mesmo dia é inofensivo).

**Negativas:**
- **Gap-zero:** num dia em que o usuário esquece de lançar, o dia fica com R$0 de gasto variável (a projeção que o "seguraria" foi apagada). É **intencional** — o zero cutuca o usuário a lançar o real — mas pode subnotificar o mês e enviesar insights de gasto diário. Mitigado por ser opt-in.
- **Job perdido = diário órfão.** Com escopo "só hoje", se o cron falhar num dia, aquele diário fica até o usuário apagar na mão. Aceito em troca da simplicidade; o `date <= hoje` auto-curável foi descartado pelo dono.
- **Borda do reapply:** reaplicar a previsão no meio do dia recria o diário de hoje, que sobrevive até o cron seguinte. Aceito (raro, auto-resolve); não acoplamos `apply_previsao` à feature.
- **Endpoint público** guardado só por secret (sem sessão), pelo mesmo motivo do `/api/mcp`.

## Alternativas descartadas

- **Lazy, no carregamento do app** (rodar a baixa quando o usuário `pro` abre a tela): zero infra externa e "hoje" correto por usuário de graça, mas **não roda se o usuário não abrir** — e o app é multi-canal (MCP/WhatsApp leem os dados fora da tela), então o diário fantasma sobreviveria para esses canais. Também coloca efeito colateral de escrita num caminho de leitura.
- **Consolidar/realizar o diário** (transformar a projeção em `saida` no valor previsto, para o usuário só editar): manteria o mês fiel mesmo sem ação do usuário e evitaria o gap-zero, mas contradiz a filosofia do dono — o diário é gasto *possível*, não real; quando o dia chega ele deve sair de cena, não virar um número que finge ser real.
- **`date <= hoje` (auto-curável)**: recuperaria job perdido e ligar-no-meio-do-mês de graça, mas o dono preferiu o escopo estrito "apenas hoje".
- **GitHub Actions agendado** em vez do cron do Dokploy: vive no repo, mas depende da pontualidade do GH e bate na URL pública de prod; preterido por um agendador que vive junto do deploy.
