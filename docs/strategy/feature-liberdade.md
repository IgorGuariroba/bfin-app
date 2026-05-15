# Feature: Liberdade — Saída de Dívida

**Data:** 2026-05-15
**Status:** Ideia — amadurecer antes de especificar
**Relacionado:** [user-pains.md](../user-pains.md) · [market-research.md](./market-research.md)

---

## Problema que resolve

80,9% das famílias brasileiras estão endividadas. É o gatilho de vida mais comum para procurar controle financeiro — mas o bfin hoje ajuda a não se endividar mais, não a sair de uma dívida existente. Fecha metade do ciclo.

Ferramentas de dívida existentes (Mobills, planilhas, calculadoras) seguem o mesmo modelo: lista de credores, taxa de juros, snowball vs. avalanche. O usuário abre uma vez, fica paralisado com os números, e fecha. Não é preguiça — a ferramenta faz o usuário encarar **o que deve**, não **para onde vai**.

---

## Hipótese central

> A âncora certa não é o valor da dívida. É a data de liberdade.

"Você deve R$ 15.000" paralisa.
"Você estará livre em março de 2028" motiva.

Mesmo dado. Enquadramento oposto. Resultado diferente.

---

## Conceito (rascunho)

### Input mínimo do usuário

- Nome da dívida (ex: "cartão Nubank", "empréstimo pessoal")
- Quanto deve hoje
- Quanto consegue pagar por mês

Não pedir: taxa de juros, credor, número de parcelas, estratégia de pagamento. Quanto menos, mais vai ser usado.

### Output único

Uma data. **"Você estará livre dessa dívida em X."**

Essa data aparece no Horizonte — o mesmo heatmap que já existe — como uma marcação visual que vai se aproximando conforme o usuário paga.

### Comportamento mês a mês

| Situação | O que acontece |
|---|---|
| Pagou o valor planejado | Data mantém o ritmo |
| Pagou a mais | Data pula meses |
| Pagou menos | Data recua — sem culpa, só informação |
| Não pagou | Data recua, lembrete suave no próximo mês |

### O que deliberadamente não tem

- Taxa de juros (o usuário não sabe e não quer calcular)
- Estratégia snowball vs. avalanche (complexidade que paralisa)
- Lista de credores com detalhes
- Relatório de custo total com juros (desmotiva)
- Comparativo de cenários (feature de v2, não v1)

---

## Integração com o produto existente

O Horizonte já projeta saldo futuro. A dívida aparece como uma **sombra que vai sumindo** no heatmap — sem abrir seção separada, sem novo conceito para aprender.

O pagamento mensal já entra como despesa recorrente fixa no fluxo de caixa. A feature de Liberdade só adiciona a camada de significado: "esse gasto fixo tem uma data de fim."

---

## Loop de hábito

1. **Trigger:** início do mês — bfin mostra data de liberdade atual
2. **Ação:** usuário separa o valor planejado para a dívida
3. **Recompensa:** data anda para frente (mesmo que 1 semana já é progresso visível)
4. **Investimento:** histórico de progresso acumula, difícil de abandonar

---

## Nome — em aberto

"Dívidas" carrega vergonha e não é coerente com o tom do bfin. Candidatos:

| Nome | Sensação |
|---|---|
| **Liberdade** | Aspiracional, futuro |
| **Zerar** | Direto, sem drama |
| **Saída** | Movimento, não peso |
| **Horizonte de Saída** | Conecta ao vocabulário existente |

Decisão: validar com usuários reais qual enquadramento ressoa mais antes de fixar.

---

## Posição na jornada do usuário

Resolve a Dor 5 do mapeamento (acumular patrimônio) — mas é o pré-requisito dela. Não dá para construir patrimônio com dívida cara ativa. A sequência natural é:

```
Controlar gastos → Sobrar dinheiro → Zerar dívida → Acumular
```

A feature de Liberdade é a ponte entre "sobrar dinheiro" e "acumular patrimônio".

---

## O que precisa ser respondido antes de construir

- [ ] Usuários que chegam com dívida entendem a data de liberdade como motivação ou como pressão?
- [ ] O input mínimo (nome + valor + pagamento mensal) é suficiente para gerar confiança no cálculo?
- [ ] A dívida deve aparecer no Horizonte principal ou em uma visualização separada?
- [ ] Como tratar múltiplas dívidas? Uma data por dívida ou uma data de "liberdade total"?
- [ ] O nome certo é testado com usuário ou decidido internamente?
- [ ] Qual é o gatilho para apresentar essa feature? (onboarding, descoberta orgânica, lembrete?)

---

## Próximos passos sugeridos

1. Validar hipótese central com 5 entrevistas Mom Test focadas em dívida
2. Protótipo de baixa fidelidade do fluxo de input + visualização no Horizonte
3. Testar nomes com amostra pequena (Tally.so, 20 respondentes)
4. Só então: especificação técnica e priorização no roadmap
