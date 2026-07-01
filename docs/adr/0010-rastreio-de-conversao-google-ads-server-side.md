# 10. Rastreio de conversão do Google Ads é server-side, no webhook do MercadoPago

Data: 2026-06-30
Status: Aceito

## Contexto

O bfin vai investir em Google Ads mandando tráfego pago para uma **Landing de campanha (LP)** dedicada, com a meta de gerar assinantes `pro` pagos. Para saber se o investimento traz assinantes — e não só cliques — o Google Ads precisa receber de volta o evento de **Conversão** ([`CONTEXT.md`](../../CONTEXT.md)).

A particularidade do bfin é que **o pagamento é confirmado de forma assíncrona**. O fluxo é: clique no anúncio → LP → cadastro (o checkout exige login) → `/assinar` → MercadoPago → retorno para `/obrigado`. No **retorno**, a assinatura ainda pode estar `pending` — quem ativa o plano `pro` é o webhook (`/api/webhook/mercadopago`) quando o `PreApproval` chega como `status=authorized`. Ou seja, o momento do retorno do usuário **não coincide** com o momento em que existe um assinante pago de verdade.

O caminho convencional (pixel `gtag` client-side numa página de obrigado) dispararia a conversão no retorno, contando pagamentos pendentes/recusados e perdendo quem fecha a aba antes do redirect — mediria "chegou na obrigado", não "pagou".

## Decisão

A **Conversão é reportada server-side, a partir do webhook do MercadoPago**, no exato ponto em que o plano vira `pro` (`status=authorized`). Não há pixel de conversão na `/obrigado` — a página é só UX.

Mecânica de atribuição:
1. A LP captura o **gclid** (Google Click ID) da query do anúncio e o guarda até o cadastro.
2. No cadastro, o `gclid` é persistido no `User` (atributo opcional).
3. Quando o webhook ativa o `pro` pela **primeira vez**, lê o `gclid` do `User` e envia a Conversão para a Google Ads API (Conversion Import), com valor da assinatura (mensal/anual, BRL) e horário.

**Disparo único:** a Conversão sai **uma só vez**, na primeira ativação. Renovações recorrentes também chegam ao webhook como `authorized`; um marcador de "já reportado" (ex. `conversionReportedAt`) impede contar o mesmo assinante a cada ciclo.

## Consequências

**Positivas:**
- Mede assinante **real** (dinheiro confirmado), não intenção — exatamente o que justifica o gasto com mídia.
- Imune a pagamento pendente/recusado e a usuário que fecha a aba: a fonte da verdade é o webhook, não o navegador.
- Atribuição precisa por `gclid` liga cada assinatura ao anúncio que a originou.

**Negativas / trade-offs aceitos:**
- Encanamento maior: coluna `gclid` no `User`, captura na LP, e integração com a Google Ads API (developer token aprovado, OAuth refresh token, customer ID, conversion action). O setup da API pode atrasar o início da campanha.
- A Conversão chega ao Google Ads **com atraso** (depende do webhook), não em tempo de clique — aceitável para otimização de campanha.
- Exige disciplina de idempotência no webhook para o disparo único; um bug aqui infla a métrica que a decisão existe para proteger.

## Alternativas descartadas

- **Pixel `gtag` client-side na `/obrigado`:** simples e padrão, mas dispara no retorno (não na confirmação), inflando com pagamentos pendentes/recusados e perdendo quem abandona o redirect. Mede a página, não o pagamento.
- **CSV manual (Offline Conversion Import):** o webhook gravaria as conversões numa tabela e o CSV seria subido no Google Ads periodicamente. Mede o mesmo pagamento real sem OAuth/developer token e ligaria a campanha mais rápido — descartado em favor da API automatizada para evitar trabalho manual recorrente, aceitando o custo de setup inicial maior.
- **Híbrido (pixel agora, server-side depois):** ligaria o anúncio antes, mas conviveria com métrica inflada no início e exigiria refazer o trabalho — descartado por já termos definido o destino final.

## Atualização 2026-07-01 — duas conversões, não uma

A decisão original mede **só** a Conversão paga. Na prática isso tem dois furos para *operar* a campanha (não só medi-la): (a) no começo os assinantes pagos são poucos e chegam com atraso do webhook, então o Smart Bidding do Google **não tem sinal suficiente** para otimizar; (b) com um único evento no fim do funil, quando a campanha não converte não dá para saber **onde** quebra (LP, cadastro ou preço).

Ajustes decididos, mantendo o núcleo server-side:

1. **Reportamos dois eventos ao Google Ads**, não um:
   - **[[Sinal de cadastro]]** — conversão **secundária, sem valor**, disparada server-side na criação do `User` (cadastro vindo de anúncio). Dá **volume** para o algoritmo de lances aprender cedo e revela o degrau `clique → cadastro`. Mede intenção — deliberadamente, e só como sinal de otimização.
   - **Conversão** — conversão **primária, com valor** (o pagamento confirmado), inalterada. Continua sendo a métrica de ROI.

   Isso **flexibiliza** o "assinante real, não intenção" da decisão original: a intenção volta ao rastreio, mas rotulada como secundária e nunca confundida com a Conversão (ver `CONTEXT.md`).

2. **Segundo ponto de captura do identificador de clique.** Além do cadastro (usuário novo), capturamos também no **início do checkout** (`POST /api/checkout`) para atribuir o **upgrade de usuário grátis já existente** que chega pelo anúncio — caso invisível se só capturássemos no cadastro.

3. **Identificador de clique cobre `gclid`/`gbraid`/`wbraid`** (tráfego iOS/app, onde o Google não emite `gclid`), com prioridade para `gclid`.

4. **Valor da Conversão = primeiro pagamento** (14,90 / 119,90), não LTV. Honesto e sem inventar número, mas **subvaloriza o mensal** e enviesa a comparação mensal-vs-anual. Limitação aceita conscientemente; revisitar quando houver dado de retenção.
