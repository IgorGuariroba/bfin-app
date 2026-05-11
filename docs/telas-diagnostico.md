# Diagnóstico das Telas Principais

## Saldos — "Onde estou hoje?"

**Objetivo:** controle diário do saldo acumulado no mês atual. Lista cada dia com saldo acumulado e status (verde/amarelo/vermelho). Clicando num dia abre as transações daquele dia.

**Pontos fortes:**
- Feedback imediato: header muda de cor conforme saldo do dia atual
- Drill-down por categoria (filtro: entradas, saídas, diário, cartão, guardado)
- Auto-scroll para o dia de hoje ao abrir
- Atualiza em tempo real via evento `bfin:transaction-created`

**Lacunas:**
- Mostra só 1 mês — sem contexto histórico ou futuro
- [ ] _o que melhorar?_

---

## Horizonte de Saldos — "Como vai ser meu dinheiro nos próximos meses?"

**Objetivo:** visão macro do saldo acumulado dia a dia em 3, 6 ou 12 meses. Calendário colorido: verde = saldo saudável, vermelho = negativo. Permite detectar meses problemáticos antes que cheguem.

**Pontos fortes:**
- Calor visual instantâneo — um olhar revela padrões (todo mês fica no vermelho no dia 20?)
- Janela temporal ajustável (3/6/12 meses)
- Navegar no tempo com setas
- Dark mode com gradiente de intensidade por magnitude do saldo

**Lacunas:**
- Read-only, sem drill-down por dia — serve para diagnóstico, não para ação
- [ ] _o que melhorar?_

---

## Totais — "Como foi meu mês em números?"

**Objetivo:** resumo analítico do mês — performance (sobrou ou faltou), % economizado, custo de vida, diário médio. Cada métrica tem fórmula visual com dots coloridos por categoria.

**Pontos fortes:**
- Responde perguntas de alto nível sem precisar somar nada
- Benchmarks contextuais ("Abaixo da renda", "X% da renda guardado")
- Desce para transações por categoria
- Fórmulas visuais educam o usuário sobre como os números são compostos

**Lacunas:**
- Retrospectivo — não projeta o futuro
- Não compara meses entre si
- Elementos sem necessidade:
  - [x] `MetricRow` — componente definido mas nunca usado → deletar arquivo
  - [x] Fórmulas visuais com Dots (Performance, Custo de vida, Diário médio) — educam 1x, viram ruído permanente → removidas
  - [x] Dot direito na barra de Economizado — redundante com o esquerdo → removido
  - [x] Ícone `⊙` no Diário médio — críptico, substituído por label "meta:" textual
- Perguntas sem resposta na tela atual:
  - [ ] "Esse mês foi melhor ou pior que o anterior?"
  - [ ] "Tô melhorando ou piorando ao longo dos meses?"
  - [ ] "Meu % guardado tá subindo?"
  - [ ] "O que pesou mais nas saídas? Gastei mais que o normal em alguma categoria?"
  - [ ] "Onde posso cortar? Se eu cortar categoria X, quanto sobra?"
  - [ ] "Tô no ritmo certo pra meta Y?"

---

## Como as 3 se complementam

| Tela | Tempo | Granularidade | Capacidade de ação |
|------|-------|--------------|-------------------|
| Saldos | Hoje | Diário | Alta (abre transações) |
| Horizonte | 3–12 meses | Diário (visual) | Nenhuma |
| Totais | Mês fechado | Resumo analítico | Baixa (ver por tipo) |

**Gap identificado:** nenhuma tela compara meses históricos em formato analítico (Totais mês a mês lado a lado). Horizonte compara visualmente mas não numericamente.

---

## Ideias / próximos passos

- [ ] _listar aqui_
