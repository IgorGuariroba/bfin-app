# Documento de objetivos — bfin

Data: 2026-07-02 · Fontes: `PRODUCT.md`, `docs/strategy/market-research.md` (TAM/SAM/SOM), `docs/strategy/go-to-market.md` (faseamento)

## Métrica norte

**Retenção D7 > 30%.** Sucesso = retenção, não signups brutos — trazer usuários que somem em 7 dias é dano reputacional, não tração (`PRODUCT.md`).

Racional: o diferencial (Horizonte) só funciona com dados consistentes. Usuário que não retém não lança; sem lançamento a projeção fica vazia e o diferencial some (`docs/competitor-analysis.md`, "Risco Crítico da Proposta"). Por isso retenção é causa do valor, não só consequência.

## Objetivos por horizonte

| Horizonte | Objetivo | Métrica | Fonte |
|---|---|---|---|
| Fase 0 (0-50 usuários) | Validar que o Horizonte retém | D7 > 30% na coorte inicial | GTM |
| Fase 1 (50-500) | Tração orgânica multi-canal | Signups atribuíveis por canal (utm/gclid) mantendo D7 | GTM |
| 12 meses | SOM Fase 1 | 2-3k usuários (0,01% do SAM ativo) | market-research |
| 36 meses | SOM escala | ~120k usuários (0,5% do SAM ativo) | market-research |

## Objetivo de aquisição paga (corrente)

Medir retorno real do Google Ads: [[Conversão]] = primeira ativação `pro` paga (não clique, não cadastro), com [[Sinal de cadastro]] como conversão secundária de volume (`CONTEXT.md`, ADR-0010). Bloqueio atual: aprovação do developer token (Basic access).

**Sequenciamento (grilling 2026-07-02):** Ads liga em orçamento mínimo apenas para validar o funil técnico (conversão server-side, gclid); a escala de verba fica condicionada ao **rebrand** ([README](./README.md), decisão 7) — não se constrói reconhecimento pago sobre a identidade emprestada atual.

## Receita (decidido no grilling de 2026-07-02)

Receita é **não-objetivo até D7 > 30% estar provado**. Nenhuma meta de MRR ou conversão free→pro nos próximos 12 meses; otimizar conversão antes de reter repetiria o erro dos concorrentes (extrair antes de entregar valor). O custo de infra baixo (solo founder, VPS própria) banca a espera. Receita entra como objetivo no ciclo seguinte à comprovação do D7.

## Anti-objetivos (explícitos nos docs)

- Signups brutos sem retenção.
- Competir em sincronização Open Finance (ADR-0007; "não tentar" em market-research).
- Vender "IA" como promessa — vender feature concreta.
- Disputar escopo com super-apps (Jota: conta + finanças + IA).
