# bfin

Aplicativo de finanças pessoais (Next.js + Prisma + Postgres). Este documento é o glossário do domínio — sem detalhes de implementação.

## Language

### Núcleo financeiro

**Transaction**:
Lançamento de entrada ou saída de dinheiro feito pelo usuário, com data, valor, tipo e tags.
_Avoid_: lançamento, movimentação, gasto (gasto é um subtipo de Transaction).

**Transaction Source (origem)**:
De onde veio uma `Transaction`: `manual` (digitada na UI), `pluggy` (importada do banco via Open Finance, com `externalId` para idempotência) ou `agent` (criada ou editada por um agente MCP em nome do dono). É a trilha que distingue canais — o usuário sabe o que veio de cada um.
`pluggy` é um **canal descontinuado/histórico**: a integração foi removida do projeto por custo (ver ADR-0007), então **não há mais importação ativa** — o valor sobrevive apenas nas `Transaction` que já tinham sido importadas, como lápide de origem. Não é convertido para `manual` (seria falsear a origem), e as regras que preservam importados (`apply_previsao`, baixa diária) continuam protegendo esses registros históricos.

**Transaction Type (tipo)**:
Classifica uma `Transaction`, e não é só "entrada/saída" — cada tipo tem efeito contábil distinto: `entrada` soma ao saldo; `saida` (gasto) e `cartao` (fatura/parcelado) abatem o saldo; `economia` é guardado (sai do fluxo corrente e **não** abate saldo nem custo de vida); `diario` é o placeholder da **projeção** de gasto variável futuro (ver [[Previsão]]), não um gasto real registrado.

**Previsão**:
Meta orientativa de valor mensal para uma categoria, não impõe trava. A **previsão diária** é materializada como projeção: `apply_previsao` cria uma `Transaction` `type=diario` ("Previsão Diária") para cada dia numa janela de 12 meses — e é **destrutivo**, deletando antes os `diario` manuais (`source=manual`) nessa janela antes de recriar.
_Avoid_: orçamento, budget, limite.

**Baixa automática do gasto diário**:
Automação opt-in de `User` `pro` (default **desligada**) que, ao menos uma vez por dia, **exclui** as `Transaction` `type=diario` (a projeção da [[Previsão]]) cujo dia é "hoje" em `America/Sao_Paulo`. Filosofia: o diário é gasto *possível*, não real; quando o dia chega ele perde sentido e sai de cena para o usuário lançar o gasto real, sem o trabalho manual de apagar a projeção gerada para o mês inteiro. Não toca diários **futuros** (continuam como projeção dos próximos dias/meses). Escopo deliberadamente restrito ao **dia corrente** — não recupera dias passados nem dias em que o job falhou.
_Avoid_: pagar (o dono chamou de "pagar", mas a operação é exclusão — não há liquidação), limpeza, faxina.

**Tag**:
Rótulo categorizador aplicado a Transactions; pode ser do sistema (`isSystem`) ou do usuário.
_Avoid_: categoria, label.

**PlanConfig**:
Valores correntes (mensal e anual) cobrados pelo plano `pro`. Fonte única de verdade de preço.
_Avoid_: preço fixo, constante.

### Identidade

**User**:
Pessoa autenticada via NextAuth com plano (`free` | `pro`) e dados financeiros próprios.
_Avoid_: cliente, conta, account, premium (o plano pago do bfin é `pro` — tipo `Plan = "free" | "pro"`; UI, gates e o webhook do MercadoPago usam `pro`. "premium" é um erro lexical histórico deste glossário, não um valor do domínio).

**AccountMember**:
Relação de compartilhamento entre um `User` dono e um convidado que pode ler/editar seus dados.
_Avoid_: membro, colaborador.

**Admin**:
`User` cujo `email` está em `ADMIN_EMAILS` (env var). Tem acesso a telas administrativas (`/admin/*`).
_Avoid_: superuser, root.

**ApiKey**:
Credencial programática (Bearer token nomeado e rotativo) que um `User` `pro` emite para delegar suas operações a um agente MCP remoto. Resolve o principal da requisição — age como o `User` que a emitiu (o dono), não como um `AccountMember` convidado. Plain só aparece na geração; armazenada hasheada. Projetada para evoluir a OAuth quando houver motivo.
_Avoid_: senha, access token (reservado p/ OAuth futuro), chave.

**Agente (assistente)**:
Programa externo (client MCP — Claude, ChatGPT, Cursor) que opera o núcleo financeiro de um `User` `pro` em seu nome, autenticado por um `ApiKey`. Não é uma feature embutida no app: é um principal delegado. Faz leitura e escrita no domínio (escopo e regras em ADR-0004), com `Transaction Source = agent`. Distinto do `Bot` do WhatsApp, que é máquina de estados baseada em list message (sem LLM).
_Avoid_: assistente (preferir "agente" para o MCP; `Bot` é o do WhatsApp), IA.

### Blog (marketing/SEO)

**Post**:
Artigo de marketing publicado em `/blog/[slug]`. Conteúdo em Markdown salvo no banco. Slug imutável após `published`. Autor = `User` Admin.
_Avoid_: artigo, matéria, conteúdo.

**Topic**:
Rótulo livre aplicado a `Post` (string). Renomeado de "tag" para não colidir com [[Tag]] de [[Transaction]]. Exposto em `/blog/topico/[slug]`.
_Avoid_: tag (reservado p/ Transaction), label.

**Category**:
Classificação única e obrigatória de `Post`, enum fixo no código: `Educação Financeira` | `Produto` | `Mercado` | `Dicas`. Mudança = deploy. Não confundir com "categoria" do _Avoid_ de [[Tag]] — escopo distinto (blog).
_Avoid_: seção, tema.

**PostStatus**:
Ciclo de vida do `Post`: `draft` (só admin) → `published` (público em `/blog`) → `archived` (some da listagem, URL retorna 410).

**PostComment**:
Comentário em `Post` feito por `User` logado. Status: `pending` | `approved` | `rejected`. Moderado em `/admin/blog/comentarios`. Visitante anônimo lê `approved`; comentar exige signup (CTA implícito).
_Avoid_: review, resposta.

### Atendimento WhatsApp

**Contact**:
Visitante da landing identificado por número de telefone E.164. Não é um `User` — é anônimo até cadastrar.
_Avoid_: cliente, lead, usuário, contato.

**Conversation**:
Fio único e perene entre o sistema e um `Contact`. Reabre quando `Contact` volta após `closed`. Tem `status`: `bot` | `waiting_human` | `human` | `closed` | `rate_limited`.
_Avoid_: chat, ticket, atendimento, sessão.

**Bot**:
Máquina de estados baseada em **list message** do WhatsApp (sem LLM) que responde dúvidas pré-definidas.
_Avoid_: chatbot, IA, assistente.

**Handoff**:
Transição de `Conversation.status` de `bot` para `waiting_human`, disparada por intent explícita (suporte/humano) ou fallback de mensagem não reconhecida.
_Avoid_: escalonamento, transferência.

**Intent**:
Item do menu reconhecido pelo Bot (`price`, `how`, `signup`, `cancel`, `lgpd`, `support`, `human`).
_Avoid_: opção, comando.

### Observabilidade

**Alerta (Página)**:
Sinal de observabilidade que exige **ação humana imediata** — sintoma user-facing (app caiu, taxa de erro real, delete em massa do agente). Entregue em tempo real no Discord (#bfin-health). Critério: se não for agir nos próximos ~30min, não é Página.
_Avoid_: notificação, aviso, alerta genérico.

**Detecção (Issue)**:
Achado de observabilidade que **merece tratamento mas não é urgente** — degradação, anomalia ou oportunidade de melhoria. Materializado como **GitHub Issue** (trabalho rastreável, pego pelo dev/agente, fechado por PR), nunca como notificação que se lê e esquece.
_Avoid_: alerta (reservado p/ [[Alerta (Página)]]), warning, aviso.

### Aquisição (marketing pago)

**Landing de campanha (LP)**:
Página dedicada ao tráfego pago (Google Ads), focada em converter visitante em assinante [[User]] `pro`. Distinta da **home** `/` (orgânica, topo de funil) e da `/precos` (comparativa Free × Pro). Vende um único plano com uma única promessa e CTA.
_Avoid_: landing (ambíguo — a home também é uma landing), home, página de vendas.

**Conversão**:
Evento de negócio "um clique de anúncio virou assinante `pro` pago", reportado ao Google Ads como conversão **primária** (com valor em BRL) para medir retorno do investimento. Disparada **uma única vez, na primeira ativação** confirmada pelo webhook do MercadoPago (`status=authorized`) — **não** no clique do CTA, **não** no retorno do checkout, e **não** em renovações recorrentes (que também chegam como `authorized`). Mede assinante real, não intenção. Distinta do [[Sinal de cadastro]] (secundário).
_Avoid_: lead, clique, signup/cadastro (o cadastro é reportado ao Google Ads como [[Sinal de cadastro]], **não** como Conversão — a Conversão é o pagamento confirmado).

**Sinal de cadastro**:
O cadastro grátis reportado ao Google Ads como conversão **secundária** (sem valor), apenas para dar volume ao algoritmo de lances otimizar cedo, enquanto assinantes pagos ainda são poucos. Não é uma [[Conversão]]: mede intenção, não dinheiro. Disparado uma vez, quando o [[User]] novo se cadastra vindo de um anúncio.
_Avoid_: conversão (reservado ao pagamento), micro-conversão, lead.

**Identificador de clique (gclid/gbraid/wbraid)**:
Identificador que o Google atribui ao clique no anúncio — `gclid` no caso geral; `gbraid`/`wbraid` quando o `gclid` não está disponível (tráfego iOS/app). Capturado na entrada e persistido no [[User]] em dois momentos: no **cadastro** (usuário novo) e quando um **free existente inicia o checkout** do `pro`. É a trilha que liga a [[Conversão]] e o [[Sinal de cadastro]] ao anúncio que os originou. Sem ele salvo, a ativação acontece mas não é atribuível ao marketing pago.
_Avoid_: utm, tracking id, origem (origem já é termo de [[Transaction Source (origem)]]).

## Relationships

- Um **User** possui muitas **Transactions**, **Previsões** e **Tags**.
- Um **User** dono pode ter vários **AccountMember** convidados.
- Um **User** `pro` pode emitir vários **ApiKey**, cada um delegando um agente MCP distinto; a delegação age como o dono e não atravessa `AccountMember`.
- Um **Contact** tem uma **Conversation** ativa por vez (reaberta após `closed`).
- Uma **Conversation** acumula muitas mensagens nas duas direções (inbound do `Contact`, outbound do Bot ou Admin).
- **Admin** atua sobre **Conversation** somente após **Handoff**.
- **Bot** consulta **PlanConfig** ao responder a intent `price`.
- Um **Post** tem um **Category** (obrigatório) e muitos **Topic** (livres).
- Um **Post** tem um autor (`User` Admin).
- Um **Post** acumula muitos **PostComment** de **User** logados.
- Um **User** pode carregar um **Identificador de clique** opcional, capturado no cadastro (usuário novo) ou ao iniciar o checkout (free existente); a primeira ativação `pro` desse **User** reporta uma **Conversão** ao Google Ads usando esse identificador. O cadastro vindo de anúncio reporta também um **Sinal de cadastro**.

## Example dialogue

> **Dev:** "Quando um **Contact** clica em 'Falar com humano', a **Conversation** vira `human` ou `waiting_human`?"
> **Domínio:** "Vira `waiting_human` — só passa para `human` quando o **Admin** abre a conversa e responde. O badge na tela admin mostra quanto tempo está esperando."

> **Dev:** "Se o mesmo número manda mensagem semanas depois de uma **Conversation** `closed`, abre nova?"
> **Domínio:** "Não. Reabre a mesma — histórico contínuo é mais útil para o **Admin**. Conversa por **Contact** é única."

## Flagged ambiguities

- "cliente" foi usado para significar tanto **User** (cadastrado) quanto **Contact** (visitante anônimo no WhatsApp) — resolvido: são distintos. `Contact` pode virar `User` no futuro se signup amarrar telefone, mas não amarra hoje.
- "conta" foi usado para `User`, `Account` (NextAuth OAuth) e `AccountMember` — resolvido: `Account` é estritamente o registro OAuth do NextAuth, não um conceito de domínio.
- "pro" vs "premium" — resolvido: o plano pago é `pro` (tipo `Plan = "free" | "pro"` em `plan-utils.ts`; UI, gates e webhook do MercadoPago usam `pro`). "premium" era um erro lexical deste glossário (dizia `free | premium`), ampliado numa sessão de design ao canonizar "premium" — **corrigido**: o canônico em código, tipo e UI é `pro`. Não existe (nem existirá a curto prazo) um terceiro tier.
