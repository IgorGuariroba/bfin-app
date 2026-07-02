# Mapa de stakeholders — bfin

Data: 2026-07-02 · Fonte: código (`CONTEXT.md` Identidade), infra (Dokploy/Grafana), integrações. **Doc novo — não existia.**

Contexto que molda o mapa: **solo founder**. Não há sócios, investidores, equipe ou clientes B2B — o mapa é enxuto e concentrado em usuários e plataformas-fornecedoras.

## Internos

| Stakeholder | Papel | Interesse | Poder |
|---|---|---|---|
| **Dono (@igor.guariroba)** | Dev + design + marketing + suporte + Admin | Retenção D7, sustentabilidade do custo | Total |
| **Agentes (Claude etc.)** | Executores delegados de dev/ops/conteúdo | — | Delegado (contrato em ADR-0004 p/ MCP; guardrails de review) |

## Usuários (quem o produto serve)

| Stakeholder | Relação | Interesse | Influência |
|---|---|---|---|
| **User `free`** | Base de aquisição | Ver o Horizonte funcionar sem pagar | Alta — é a fonte de retenção D7 e do boca-a-boca |
| **User `pro`** | Paga a conta | Compartilhamento, baixa automática, agente MCP | Alta — churn dele é o sinal mais caro |
| **AccountMember (convidado)** | Entra pelo dono da conta | Visibilidade sem virar contador | Média — retém o dono (casal) |
| **Contact (WhatsApp)** | Visitante anônimo, pré-signup | Dúvida respondida rápido | Baixa individual, alta agregada (funil) |
| **Leitor do blog / seguidor Instagram** | Topo de funil | Conteúdo útil sem venda agressiva | Baixa |

## Plataformas-fornecedoras (dependências com poder real)

| Plataforma | O que controla | Risco se falhar |
|---|---|---|
| **Meta (WhatsApp Cloud API + Instagram)** | Canal de lançamento + canal de aquisição Fase 1 | Alto — bloqueio de número/conta derruba um canal inteiro (ADR-0001, ADR-0009) |
| **MercadoPago** | Cobrança da assinatura `pro` (webhook `authorized`) | Alto — receita para |
| **Google (Ads + Search)** | Aquisição paga + SEO | Médio — aprovação do developer token já é bloqueio ativo (ADR-0010) |
| **VPS/Dokploy + Postgres** | Produção e o dado do usuário (`bfin-app_pgdata`) | Crítico — perda de dado é morte reputacional |
| **Grafana Cloud / Discord / GitHub** | Observabilidade (Página → Discord; Detecção → Issue) | Baixo — degrada operação, não o produto |
| **Anthropic/OpenAI (clients MCP)** | Canal agente dos `pro` | Baixo hoje — canal minoritário |

## Reguladores / contexto

- **LGPD** — dado financeiro pessoal; privacidade já é pilar de posicionamento (intent `lgpd` no Bot; sem venda de dados).
- **Banco Central / Open Finance** — hoje irrelevante (integração removida, ADR-0007); volta ao mapa só se sync voltar ao roadmap.

## Leitura do mapa (poder × interesse)

- **Gerenciar de perto:** User `pro`, Meta, MercadoPago, Postgres/VPS.
- **Manter satisfeito:** User `free` (é o pipeline de tudo), Google.
- **Manter informado:** AccountMember, Contact.
- **Monitorar:** Grafana/GitHub/Discord, clients MCP, reguladores.

## ⚠️ Aberto

- Existe alguém fora deste mapa — mentor, contador, comunidade beta, familiares testando? Nenhum doc menciona.
