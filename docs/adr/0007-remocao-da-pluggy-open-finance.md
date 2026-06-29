# 7. Remoção da integração Pluggy (Open Finance): matar o canal ativo, preservar o histórico

Data: 2026-06-28
Status: Aceito

## Contexto

A importação bancária via Open Finance era servida pelo **Pluggy** (`src/lib/pluggy/*`, `src/app/api/pluggy/*`, `connect-bank-button.tsx`), produzindo `Transaction` com `source="pluggy"` (ver **Transaction Source** no CONTEXT.md). A integração nunca chegou a operar de verdade em produção: as credenciais de prod eram **sandbox/demo**, então nenhum banco real conectou.

O custo de produção do Pluggy (~R$2,5 mil/mês) é inviável no estágio atual do bfin. Pesquisa de mercado (jun/2026) confirmou que **não existe alternativa gratuita nem de tier generoso para agregação de contas no Open Finance Brasil**: Belvo (~R$6k/mês) é mais caro, Tecnospeed (R$1,5k de entrada + R$540/mês) tem mensalidade contínua, Klavi foca crédito B2B. O "grátis" do mercado é só sandbox de dev ou o acesso do consumidor final — nenhum serve a um TPP. A categoria inteira é cara por custo regulatório e de infraestrutura real.

Decidiu-se **remover o Pluggy sem substituto imediato**. O conceito "importação bancária" fica dormente até existir um modelo economicamente viável (ou volume que justifique o custo).

## Decisão

1. **O que mata o custo é cancelar a assinatura, não apagar o schema.** O custo é a API do Pluggy. Removemos o código que a chama, as credenciais do Dokploy e **cancelamos a assinatura** — esse é o passo que de fato zera os R$2k. O banco de dados é irrelevante para o custo.

2. **Remover o Pluggy *ativo*** (superfície viva da integração):
   - `src/lib/pluggy/*` (client, sync, map-transaction)
   - `src/app/api/pluggy/*` (connect-token, items, items/[id], webhook)
   - `src/components/pluggy/connect-bank-button.tsx` e seu import em `configuracoes/page.tsx`
   - credenciais Pluggy no Dokploy + cancelamento da assinatura

3. **Preservar o Pluggy *histórico*** (registro inerte). A pedido do dono — "manter qualquer informação já registrada":
   - o modelo `PluggyItem` permanece no `schema.prisma` como **lápide** (typed, sem código que o use)
   - em `Transaction`: `source="pluggy"`, `externalId`, `pluggyItemId` ficam **intactos**
   - as relações `pluggyItems`/`connectedPluggyItems` em `User` permanecem

4. **Não converter `pluggy` → `manual`.** Reescrever a origem seria falsear a trilha que distingue canais (CONTEXT.md › Transaction Source) — o usuário deixaria de saber que aquilo veio de importação. O valor `pluggy` vira **canal descontinuado/histórico**, não um sinônimo de manual.

5. **As regras que protegem importados continuam válidas.** Os filtros `source: "manual"` em `apply_previsao` e na baixa diária (ADR-0005 §5) seguem protegendo as `Transaction` `pluggy` históricas de exclusão destrutiva.

## Consequências

**Positivas:**
- Zera o custo recorrente (~R$2,5k/mês) que era o motivo da decisão.
- Nenhum dado registrado é perdido; o histórico de origem continua honesto.
- Remove superfície de manutenção viva (webhook público, sync, widget de conexão) sem dívida de migração de dados.

**Negativas:**
- **Schema com lápide:** `PluggyItem` fica no `schema.prisma` sem uso, o que pode surpreender um leitor futuro ("por que isso ainda existe se o Pluggy saiu?"). Mitigado por esta ADR e pela entrada de glossário remarcada.
- **Produto perde a importação bancária** como feature anunciável até haver substituto. Aceito — o custo não se justifica no estágio atual.

## Alternativas descartadas

- **Trocar de fornecedor** (Belvo / Tecnospeed / Klavi): nenhum bate o Pluggy o suficiente para justificar a migração — Belvo é mais caro, Tecnospeed tem entrada menor mas mensalidade contínua, e o objetivo declarado era fugir do custo, não realocá-lo.
- **Apagar tabela e colunas e converter linhas para `manual`**: glossário mais limpo (`source` viraria `manual | agent`), mas falsearia a origem dos registros históricos e descartaria informação que o dono quis preservar.
- **Manter o Pluggy ativo só desabilitando a UI**: continuaria pagando a assinatura (o custo é a API, não o botão), o que contradiz o motivo da decisão.
