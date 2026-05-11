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

### Totais — propostas de melhoria

**Camada 1 — Quick wins**
- [ ] Diário médio vira semáforo: vermelho quando acima da meta + mostrar `+X%` acima
- [ ] Contexto temporal em Performance: `dia 11 de 31` ou barra de progresso do mês

**Camada 2 — Reorganização visual**
- [ ] Performance vira hero: número grande centralizado, cor dominante (como header de Saldos)
- [ ] Fundir Economizado + Economias: aparecem duas vezes com a mesma informação — manter só em um lugar

**Camada 3 — Feature nova**
- [ ] Delta vs mês anterior em cada métrica (`↑ R$ 800 vs abril`) — responde "tô melhorando?" sem sair da tela

**Estrutura proposta:**
```
[ Maio 2026 — dia 11 de 31 ████░░░░░░ ]

        R$ 3.492,95  ← hero, verde
        Sobrou dinheiro
        ↑ R$ 1.200 vs abril

────────────────────────────────
Economizado    0%    Nada guardado
Custo de vida  R$ 6.507,05  ↑ vs abril
Diário médio   R$ 136,36 ⚠ +134% da meta   ← vermelho

────────────────────────────────
Movimentações do mês
E  Entradas    R$ 10.000,00  >
S  Saídas      R$  5.007,05  >
D  Diários     R$  1.500,00  >
```
