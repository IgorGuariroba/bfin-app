# 11. Em conta delegada, o plano do dono da conta manda nos gates de recurso

Data: 2026-07-02
Status: Aceito

## Contexto

A delegação por convite (`AccountMember`) permite que um convidado opere a conta
de um dono. As rotas de dados resolvem a conta com `getEffectiveUserId`, mas os
gates de plano divergiam sobre **qual plano avaliar**:

- `GET /api/saldos` e `GET /api/totais` avaliam o plano do **dono efetivo**
  (`getUserPlan(userId)` após `getEffectiveUserId`).
- `GET /api/transactions` (gate de histórico de 3 meses) e o `PlanProvider` do
  layout do app avaliam o plano do **usuário logado** (`session.user.id`).

Consequências da divergência (issue #118):

- Convidado **free** vendo conta de dono **pro**: bloqueado num histórico que a
  conta pagou para ter.
- Convidado **pro** vendo conta de dono **free**: enxerga histórico completo de
  uma conta free — fura o paywall da conta.

## Decisão

**O plano do dono da conta manda** nos gates de recursos *da conta* (histórico
de transações, meses futuros de saldos/totais, previsão, baixa automática):
quem acessa uma conta delegada herda o plano dela, para mais e para menos. O
recurso pago pertence à conta, não a quem a visualiza.

Regra prática: onde a rota opera sobre `getEffectiveUserId(...)`, o gate usa
`getUserPlan(effectiveUserId)` — plano e dados sempre da mesma conta.

**Exceções — recursos do próprio usuário logado** continuam avaliando
`session.user.id`, porque a delegação não os atravessa:

- Emitir `ApiKey` (`/api/apikeys`): a chave delega a conta do próprio emissor
  (ADR-0003; CONTEXT.md — "a delegação age como o dono e não atravessa
  `AccountMember`").
- Criar convites (`/api/invites`): o convite é da conta do próprio usuário.
- Assinatura/checkout: o upgrade é sempre do usuário logado.

## Consequências

- `saldos` e `totais` já seguem a regra; `GET /api/transactions` e o
  `PlanProvider` do layout `(app)` precisam trocar a origem do plano para o
  usuário efetivo (issue de implementação própria).
- O upsell exibido a um convidado free numa conta free segue fazendo sentido:
  o CTA de upgrade leva ao checkout do próprio convidado, mas o desbloqueio da
  conta exige o upgrade do dono — a UI pode comunicar isso depois; não bloqueia
  esta decisão.
- Fecha a brecha de convidado pro "destravar" histórico de conta free.
