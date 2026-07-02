# SWOT — bfin

Data: 2026-07-02 · Fontes: `docs/strategy/market-research.md` (v1.2), `docs/competitor-analysis.md`, `PRODUCT.md`. **Primeira formalização** — o conteúdo existia disperso.

## Forças (internas, hoje)

- **Diferencial conceitual defensável**: separação Diário vs Fixo + previsão orientativa — nenhum concorrente nomeia essa distinção; vocabulário próprio é moat (`market-research.md`).
- **Horizonte**: projeção visual de saldo 6+ meses; nenhum concorrente BR direto tem. Prospectivo num mercado retrospectivo.
- **Multi-canal de lançamento**: UI + WhatsApp + agente MCP — atrito de input mínimo, que é exatamente a dependência crítica do Horizonte.
- **Privacidade sem conexão bancária**: vira virtude o que é limitação, num mercado onde a sincronização do líder (Mobills) queima reputação no Reclame Aqui.
- **Identidade não-fintech** (leveza sem culpa, canvas branco, sem "navy + dourado + pizza") — diferenciação estética alinhada ao posicionamento anti-culpa.
- **Custo operacional baixo + solo founder**: sem burn rate de equipe; sobrevive a fase longa de validação.

## Fraquezas (internas, hoje)

- **Solo founder**: bus factor 1 em dev, marketing e suporte; ritmo de produto limitado.
- **Marca desconhecida, base pequena**: fase 0-50 usuários; zero prova social contra players com milhões de usuários.
- **Dependência de input manual consistente**: se o usuário para de lançar, o Horizonte esvazia e o diferencial some — risco crítico da proposta (`competitor-analysis.md`).
- **Sem sincronização bancária**: para o segmento que realmente quer automação total, o bfin está fora da consideração (premissa "sync não é deal-breaker" ainda não validada com entrevistas — pendência aberta em `market-research.md`).
- **Retenção D7 ainda não provada**: a métrica norte existe, o resultado não.

## Oportunidades (externas)

- **Demanda estrutural**: 80,9% das famílias endividadas (recorde PEIC abr/2026), 81,7M CPFs negativados; dor ativa, não latente.
- **Penetração baixa**: só 19-20% usam app de gestão dedicado vs 81% app de banco — gap de ~80M adultos; 48% não controlam por método nenhum.
- **Líder vulnerável**: Mobills com reputação queimada em sincronização (raiva no Reclame Aqui); Organizze caro no Conectado (R$ 399-599/ano) e sem "dividir despesas" — que o `AccountMember` entrega.
- **Conversational finance em alta**: WhatsApp confirmado como interface vencedora no BR em 2026 — o bfin já está no canal.
- **Gap de pricing**: espaço entre grátis-estagnado (Minhas Economias) e caro (Organizze); lifetime acessível inexplorado no mercado.

## Ameaças (externas)

| Ameaça | Probabilidade | Mitigação documentada |
|---|---|---|
| ZapGastos/Jota capturam o nicho WhatsApp (mais maduros no canal) | Alta | Diferenciar por produto (Diário/Fixo, previsão), não por canal |
| Nubank lança finanças pessoais nativa (tem a Olivia adquirida) | Alta | Ser melhor para quem não quer ficar amarrado a um banco |
| Plataformas-fornecedoras (Meta, MercadoPago, Google) mudam regra/bloqueiam | Média | Multi-canal; nenhum canal único é o funil inteiro (ver [stakeholders.md](./stakeholders.md)) |
| Open Finance vira commodity e sync deixa de ser diferencial negativo | Média | Posicionar "manual rápido" como escolha, não falta |
| Mobills baixa preço ou conserta o produto | Média | Foco no ICP específico onde já falhou (culpa, categorização) |

## Cruzamentos que viram estratégia

- **Força × Oportunidade**: privacidade + reputação queimada do líder → atacar "alternativa Mobills sincronização" (keyword de baixa concorrência já priorizada em SEO).
- **Fraqueza × Oportunidade**: input manual + conversational finance → WhatsApp/agente é o que transforma a fraqueza (manual) em posicionamento ("registrar em 3 segundos sem conectar banco").
- **Fraqueza × Ameaça (a mais perigosa)**: D7 não provada + concorrentes WhatsApp maduros → se a retenção não fechar antes de escalar aquisição, o bfin financia o aprendizado do mercado para os rivais. Reforça o anti-objetivo de não escalar signups antes do D7.
