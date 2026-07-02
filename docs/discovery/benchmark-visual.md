# Benchmark visual — bfin

Data: 2026-07-02 · Status: **escopo ratificado no grilling** — amostra e método fechados; capturas pendentes.
Complementa o benchmark **funcional** já pronto (`docs/competitor-analysis.md`, `docs/strategy/market-research.md` — features, preços, reputação). Este doc cobre só a camada visual/expressiva.

## Por que benchmark visual (e não só funcional)

A identidade do bfin é aposta deliberada: **não parecer fintech** (`DESIGN.md`, ADR-0009). O benchmark visual existe para verificar essa hipótese contra o mercado real — se todos os concorrentes convergem para o mesmo visual, a divergência do bfin é diferenciação; se algum já ocupa o espaço "leve e humano", o posicionamento visual precisa de revisão.

**Papel no rebrand (grilling 2026-07-02):** decidido que o Discovery alimenta um rebrand completo que substitui os ativos herdados do Airbnb por ativo próprio. O benchmark ganha segunda função: além de mapear do que *fugir* (concorrentes), mapear o *território livre* — que cor de marca, forma e voz visual nenhum player financeiro BR ocupa e o bfin pode reivindicar.

## Eixos de análise (aplicar a cada concorrente)

1. **Paleta** — cor de marca, semântica de dinheiro (verde/vermelho?), uso de navy/dourado institucional.
2. **Tipografia** — peso, escala, "typographic muscle" vs modéstia.
3. **Densidade** — dashboard carregado vs respiro; quantos números por tela.
4. **Tom emocional** — pune ou acolhe? gráfico de pizza acusatório, streaks, badge de "você estourou"?
5. **Onboarding visual** — quanto pede antes de mostrar valor.
6. **Dark mode** — existe? é first-class?

## Amostra (ratificada 2026-07-02)

### Concorrentes — do que fugir / território ocupado

| Player | Por quê entra | Telas-alvo | Captura |
|---|---|---|---|
| **Mobills** | Líder; referência do que o ICP abandonou | Dashboard, categorização, **meta estourada** | **Instalação real** |
| **Organizze** | Melhor reputação; visual "sério" | Dashboard, orçamento por categoria | **Instalação real** |
| **ZapGastos / Jota** | Rivais diretos WhatsApp-first | Conversa de lançamento, resumo/relatório | Loja/site |
| **YNAB** | Padrão-ouro internacional de envelope budgeting | Dashboard, "age of money" | Loja/site |
| **Nubank (Insights)** | Ameaça incumbente; estética fintech BR dominante | Tela de insights | Loja/site |

### Referências de identidade própria — como se constrói ativo distintivo

| Marca | Por quê entra | Captura |
|---|---|---|
| **Airbnb** | Origem declarada do design system atual — o que o rebrand substitui | Loja/site |
| **iFood, 99, Inter** (consumer BR) | Identidade própria forte em produto de massa BR; como cor/forma viram ativo | Loja/site |
| **Monzo, Revolut, Copilot Money, Cash App** | Fintech leve/humana sem navy institucional — prova de que o espaço existe | Loja/site |

**Método (ratificado): híbrido** — screenshots oficiais de loja + landing de marketing para todos; instalação real só de Mobills e Organizze, para capturar as telas de culpa (meta estourada, cobrança de categorização) que a loja esconde.

## Hipóteses a verificar nas capturas

- H1: concorrentes convergem em **verde/azul institucional + dashboard denso** ("navy + dourado + pizza" das anti-referências do `PRODUCT.md`).
- H2: todos usam **vermelho como acusação** (estourou a meta) — nenhum trata negativo com calma (a tese do `feedback.*` desacoplado).
- H3: os WhatsApp-first não têm identidade visual própria — apostam tudo no canal (o que abre espaço para o bfin ter canal **e** identidade, ADR-0009).

## Posição visual do bfin (âncora, já decidida)

Canvas branco + ink near-black + Rausch `#ff385c` só como ação/marca; tipografia modesta (500-600); dado e espaço sobre peso e ornamento; semântica de dinheiro em `feedback.*`, nunca na cor da marca; dark mode first-class. Detalhe em `DESIGN.md`; extensão para o feed (typography-and-number-led) em ADR-0009.

## Armazenamento

Capturas em `docs/discovery/assets/` (imagens comprimidas, ~200KB cada máx.); se o volume crescer, migrar para Figma/Drive e deixar só o link + síntese aqui.
