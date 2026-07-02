# Personas — bfin

Data: 2026-07-02 · Fontes: `PRODUCT.md` (Users), `docs/user-pains.md` (perfis e dores), `docs/strategy/go-to-market.md` (ICP), `docs/strategy/market-research.md` (dados de mercado)

## Unificação (ratificada no grilling de 2026-07-02)

`PRODUCT.md`/GTM definiam **2 personas** (Planejador frustrado + Casal); `user-pains.md` define **3 perfis** (planilha, ex-app, sem hábito) — recortes diferentes do mesmo público que nunca tinham sido unificados. Unificação ratificada:

- Perfis 1 e 2 do `user-pains.md` são **variantes de origem** da persona primária (mesma pessoa, jornadas de chegada diferentes).
- Perfil 3 ("nunca teve hábito") **não é** o Planejador frustrado — ele nunca planejou. É persona de **expansão**, não de aquisição.

## Persona primária — "Planejador frustrado"

25-40 anos, classe B/C urbana BR, renda R$ 3-15k/mês, gasto variável alto (delivery, uber, mercado). Já tentou controlar e **abandonou** — a ferramenta cobrava mais do que entregava. Comportamento revelador: anota gasto no WhatsApp consigo mesmo, tira screenshot de Pix, abre planilha na virada do mês e desiste na segunda semana.

**Job to be done:** enxergar o saldo futuro e o gasto variável sem o atrito de categorizar tudo nem a culpa de estourar orçamento.

### Variante A — vem da planilha

Organizado, mas cansado: 40 min/semana atualizando planilha e mesmo assim só sabe o passado. Quer a aba de projeção sem a fórmula. É o público **mais próximo do bfin** (quer controle real, não resumo) e o alvo do posicionamento "usuário de planilha que quer automatizar sem conectar a conta" (`competitor-analysis.md`).

> "Eu controlo tudo na planilha mas demoro 40 minutos por semana atualizando. E mesmo assim não sei se estou indo bem ou mal."

### Variante B — vem de app concorrente

Usou Mobills/Organizze 2-3 meses e saiu: categorizar gasto a gasto sem utilidade, relatório que espelha o passado e culpa. Chega com **ceticismo de recaída** — o onboarding precisa provar rápido que este app é diferente (aha do Horizonte com dados próprios).

> "O app me dizia que gastei R$800 em restaurante. Eu já sabia disso. Ele não me dizia o que fazer diferente."

## Persona secundária — "Casal que briga por dinheiro"

Compartilham conta corrente mas não visibilidade de gastos. Entra **por convite** do primário (`AccountMember`) — não é alvo de aquisição direta; é multiplicador de retenção e razão de upgrade `pro`. Dado de suporte: 53% dos casais brigam por dinheiro (Serasa, jun/2025); "dividir despesas" é o pedido não atendido mais recorrente do Organizze.

## Persona de expansão — "Ansioso sem hábito" (perfil 3 do user-pains)

Não é desorganizado — é ansioso; evita olhar porque o que vê assusta. É o maior pool do mercado (48% não controlam por método nenhum) e o mais difícil de converter (dor latente, não declarada; `market-research.md`). **Não priorizar em aquisição paga**; o produto o serve indiretamente (resposta rápida a "posso gastar isso agora?"), e a progressão de dores do `user-pains.md` (ansiedade → enxergar → controlar → planejar → crescer) manda não jogar tudo de uma vez em cima dele.

## Como as personas usam os canais de entrada

| Canal | Primária A (planilha) | Primária B (ex-app) | Casal | Ansioso |
|---|---|---|---|---|
| UI web | Setup e revisão mensal | Onboarding cético | Visão conjunta | Só se for indolor |
| WhatsApp | Lançamento em movimento | Lançamento em movimento | — | Menor barreira de todas |
| Agente MCP | Early adopter técnico | — | — | — |
