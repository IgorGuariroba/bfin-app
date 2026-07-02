# Product

## Register

brand

> Nota: `brand` é o **default** porque o trabalho de design corrente vive nas superfícies de aquisição — landing (`/`, `/precos`, `/sobre`), blog SEO (`/blog/*`) e o canal Instagram (ADR-0009). O grupo `(app)` (horizonte, saldos, movimentações, previsão, tags) é **product-register** e deve ser sobreposto por tarefa quando o trabalho for ali. Um default, dois mundos.

## Users

**Primário — "Planejador frustrado"** (25-40, classe B/C urbano BR, renda R$3-15k, gasto variável alto). Já tentou planilha, GuiaBolso, Mobills, Organizze e **abandonou** — os apps existentes exigem categorização rígida e transformam meta em culpa. Comportamento revelador: anota gasto no WhatsApp consigo mesmo, tira screenshot de Pix, abre planilha mensal e desiste. Contexto de uso: lançamento rápido no celular, muitas vezes em movimento; quer ver para onde vai o dinheiro sem virar contador.

**Secundário — "Casal que briga por dinheiro"**: compartilham conta corrente mas não visibilidade de gastos. Entra via convite do primário (account sharing via `AccountMember`). Quer transparência sem virar planilha conjugal.

**Job to be done**: enxergar o saldo futuro (horizonte) e o gasto variável sem o atrito de categorizar tudo nem a culpa de estourar orçamento.

> Unificação com os 3 perfis do `docs/user-pains.md` (variantes de origem A-planilha e B-ex-app; "Ansioso sem hábito" como persona de expansão, fora da aquisição): [docs/discovery/personas.md](docs/discovery/personas.md), ratificada 2026-07-02.

## Product Purpose

bfin é um app de finanças pessoais com um diferencial conceitual: separa **gasto fixo** de **gasto variável** ("diário": mercado, uber, delivery) e trata **previsão** como meta orientativa, não trava rígida. O núcleo é o **horizonte** — projeção de saldo no tempo a partir de previsões aplicadas. Lançamento de baixo atrito por múltiplos canais: UI, WhatsApp e agente MCP (Claude/ChatGPT/Cursor operando o domínio em nome do dono).

Sucesso = retenção, não signups brutos. A métrica norte da fase atual é **retenção D7 > 30%**; trazer usuários que somem em 7 dias é dano reputacional, não tração.

## Brand Personality

**Leveza sem culpa · Clareza · Confiança/calma · Esperteza/agilidade.**

O bfin é o oposto do app que pune. Onde Mobills/Organizze cobram disciplina e disparam culpa por estourar orçamento, o bfin oferece uma projeção honesta e a deixa nas mãos do usuário — previsão orienta, não trava. Voz: direta, sem jargão de contador, sem moralismo financeiro. Mostra o número e a consequência, confia no usuário para decidir. Esperto no que respeita o tempo (lançar em segundos via WhatsApp/agente), calmo no que comunica (dado e espaço, não alarme).

## Anti-references

- **Mobills / Organizze / GuiaBolso**: categorização excessiva obrigatória, metas como trava culposa, dashboards que tratam o usuário como inadimplente do próprio orçamento. O bfin existe contra isso.
- **Planilha de Excel**: poder sem leveza; exige montar a estrutura antes de obter valor.
- **Fintech "navy + dourado + gráfico de pizza"**: o reflexo visual de seriedade financeira. Seriedade aqui vem da clareza do dado, não de paleta institucional.
- **Apps de orçamento que gamificam culpa**: streaks, troféus e "você falhou hoje". Nada de moralizar gasto.

## Design Principles

1. **Previsão orienta, não pune.** Toda comunicação de valor (saldo, horizonte, zona-do-zero) informa a consequência sem cobrar — o usuário decide, o app não julga.
2. **Dado e espaço sobre peso e ornamento.** Hierarquia por número, tipografia modesta (pesos 500-600) e respiro; nunca alarme visual gratuito. (Ver DESIGN.md §6.)
3. **Cor crua é dívida.** Componente sempre usa token semântico (`feedback.*`, neutros de marca) — é o que faz dark mode e contraste AA funcionarem. (DESIGN.md §1, regra de ouro.)
4. **Marca ≠ dinheiro.** Rausch (`#ff385c`) é só ação/marca; nunca o "negativo" de um saldo. Semântica financeira vive em `feedback.*`, desacoplada da marca (ADR-0008).
5. **Baixo atrito é a feature.** Lançar (UI, WhatsApp, agente) deve custar segundos. Qualquer fricção adicionada precisa pagar seu preço em valor.

## Accessibility & Inclusion

Meta: **WCAG 2.1 AA**. Corpo de texto ≥ 4.5:1, texto grande ≥ 3:1 — inclusive placeholders e texto sobre superfícies tintadas (`feedback.*-surface`). Dark mode é first-class via `next-themes`, com todos os tokens re-mapeados (DESIGN.md §7). `prefers-reduced-motion` obrigatório em toda animação (framer-motion presente). Cor nunca é o único portador de significado financeiro — saldo positivo/negativo/zona-do-zero também se distinguem por sinal, rótulo e magnitude, não só por hue (relevante para daltonismo, já que o domínio é verde/vermelho).
