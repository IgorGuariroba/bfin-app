# bfin

Aplicativo de finanças pessoais (Next.js + Prisma + Postgres). Este documento é o glossário do domínio — sem detalhes de implementação.

## Language

### Núcleo financeiro

**Transaction**:
Lançamento de entrada ou saída de dinheiro feito pelo usuário, com data, valor, tipo e tags.
_Avoid_: lançamento, movimentação, gasto (gasto é um subtipo de Transaction).

**Previsão**:
Meta orientativa de valor mensal para uma categoria, não impõe trava.
_Avoid_: orçamento, budget, limite.

**Tag**:
Rótulo categorizador aplicado a Transactions; pode ser do sistema (`isSystem`) ou do usuário.
_Avoid_: categoria, label.

**PlanConfig**:
Valores correntes (mensal e anual) cobrados pelo plano Premium. Fonte única de verdade de preço.
_Avoid_: preço fixo, constante.

### Identidade

**User**:
Pessoa autenticada via NextAuth com plano (`free` | `premium`) e dados financeiros próprios.
_Avoid_: cliente, conta, account.

**AccountMember**:
Relação de compartilhamento entre um `User` dono e um convidado que pode ler/editar seus dados.
_Avoid_: membro, colaborador.

**Admin**:
`User` cujo `email` está em `ADMIN_EMAILS` (env var). Tem acesso a telas administrativas (`/admin/*`).
_Avoid_: superuser, root.

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

## Relationships

- Um **User** possui muitas **Transactions**, **Previsões** e **Tags**.
- Um **User** dono pode ter vários **AccountMember** convidados.
- Um **Contact** tem uma **Conversation** ativa por vez (reaberta após `closed`).
- Uma **Conversation** acumula muitas mensagens nas duas direções (inbound do `Contact`, outbound do Bot ou Admin).
- **Admin** atua sobre **Conversation** somente após **Handoff**.
- **Bot** consulta **PlanConfig** ao responder a intent `price`.

## Example dialogue

> **Dev:** "Quando um **Contact** clica em 'Falar com humano', a **Conversation** vira `human` ou `waiting_human`?"
> **Domínio:** "Vira `waiting_human` — só passa para `human` quando o **Admin** abre a conversa e responde. O badge na tela admin mostra quanto tempo está esperando."

> **Dev:** "Se o mesmo número manda mensagem semanas depois de uma **Conversation** `closed`, abre nova?"
> **Domínio:** "Não. Reabre a mesma — histórico contínuo é mais útil para o **Admin**. Conversa por **Contact** é única."

## Flagged ambiguities

- "cliente" foi usado para significar tanto **User** (cadastrado) quanto **Contact** (visitante anônimo no WhatsApp) — resolvido: são distintos. `Contact` pode virar `User` no futuro se signup amarrar telefone, mas não amarra hoje.
- "conta" foi usado para `User`, `Account` (NextAuth OAuth) e `AccountMember` — resolvido: `Account` é estritamente o registro OAuth do NextAuth, não um conceito de domínio.
