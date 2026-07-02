# Briefing — bfin

Data: 2026-07-02 · Fontes: `PRODUCT.md`, `docs/strategy/go-to-market.md`, `docs/competitor-analysis.md`

## O que é

App de finanças pessoais brasileiro (web, mobile-first) com um diferencial conceitual: separa **gasto fixo** de **gasto variável** ("diário": mercado, uber, delivery) e trata **previsão** como meta orientativa — não trava rígida. O núcleo é o **Horizonte**: projeção visual do saldo futuro (heatmap de 6+ meses) a partir das previsões aplicadas.

A pergunta que o bfin responde — e nenhum concorrente direto BR responde bem:

> "Onde meu dinheiro vai estar daqui 3 meses se eu continuar assim — e o que posso fazer hoje para mudar isso?"

Concorrentes são **retrospectivos** (onde foi meu dinheiro?). O bfin é **prospectivo** (para onde está indo?).

## Para quem

**Primário:** "Planejador frustrado" — 25-40 anos, classe B/C urbana, renda R$ 3-15k, gasto variável alto. Já tentou planilha/Mobills/Organizze e abandonou. **Secundário:** "Casal que briga por dinheiro" — entra por convite do primário (`AccountMember`). Detalhe em [personas.md](./personas.md).

## Contra o quê

O app que pune. Mobills/Organizze/GuiaBolso exigem categorização rígida e transformam meta em culpa. O bfin mostra o número e a consequência e confia no usuário para decidir. Posicionamento:

> **"O app de finanças que não te trata como mau aluno."**

## Como se usa (canais de lançamento)

Baixo atrito é a feature: lançar custa segundos por **UI**, **WhatsApp** (bot + handoff humano) ou **agente MCP** (Claude/ChatGPT/Cursor operando o domínio em nome do dono, via ApiKey). Sem conexão bancária — privacidade como pilar (integração Open Finance foi removida por custo, ADR-0007; hoje é posicionamento, não só limitação).

## Modelo de negócio

Freemium: `free` generoso + `pro` (assinatura mensal/anual via MercadoPago, preço em `PlanConfig` — mapa de preços da concorrência em `docs/strategy/market-research.md`). Pro destrava compartilhamento, baixa automática do diário, agente MCP.

## Estado atual (2026-07)

Produto vivo em produção (VPS/Dokploy), fase de tração: GTM orgânico documentado (Reddit, Instagram faceless — ADR-0009, SEO blog), Google Ads em setup (ADR-0010, aguardando Basic access do developer token). Métrica norte: **retenção D7 > 30%** — signups brutos não são sucesso.

## Time

Solo founder (@igor.guariroba) — dev, design, marketing e suporte. Ver [stakeholders.md](./stakeholders.md).
