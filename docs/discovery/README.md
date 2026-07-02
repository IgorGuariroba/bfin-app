# Discovery — bfin

Data: 2026-07-02
Status: **Grilling concluído** — decisões ratificadas abaixo; único trabalho pendente é a execução das capturas do benchmark visual.

Objetivo: entender profundamente o produto, o mercado e o usuário. **Propósito ratificado: alimentar o rebrand (ADR-0012).**

## Entregáveis

| Doc | Estado | Fonte primária |
|---|---|---|
| [Briefing](./briefing.md) | Rascunho completo | `PRODUCT.md`, `docs/strategy/go-to-market.md` |
| [Objetivos](./objetivos.md) | Rascunho — metas de receita em aberto | `PRODUCT.md`, `docs/strategy/market-research.md` |
| [Personas](./personas.md) | Rascunho — unificação proposta, não ratificada | `PRODUCT.md`, `docs/user-pains.md`, GTM |
| [Mapa de stakeholders](./stakeholders.md) | Rascunho novo (não existia) | Código + infra + docs |
| [Benchmark visual](./benchmark-visual.md) | Esqueleto — capturas pendentes | `docs/competitor-analysis.md`, `market-research.md` |
| [SWOT](./swot.md) | Rascunho completo | `market-research.md`, `competitor-analysis.md` |
| [Mood inicial](./mood.md) | Rascunho — direção já decidida em ADR-0009/DESIGN.md | `DESIGN.md`, `PRODUCT.md`, ADR-0009 |

## Regra anti-deriva

Estes docs são **consolidação**, não fonte de verdade. Quando um dado viver em outro doc (preços de concorrente, ICP, tokens), este doc **aponta** para lá em vez de copiar. Fontes de verdade: `PRODUCT.md` (produto/marca), `CONTEXT.md` (domínio), `DESIGN.md` (visual), `docs/strategy/*` (mercado/canal).

## Decisões da sessão de grilling (2026-07-02)

1. **Propósito**: o Discovery alimenta um **rebrand completo** (logo, paleta, tom), propagando para app e aquisição.
2. **Motivação**: a identidade atual é **ativo emprestado do Airbnb** (Rausch `#ff385c`, proveniência declarada no `DESIGN.md`) — não é distintiva nem defensável para escalar aquisição paga.
3. **Contrato do rebrand**: a **filosofia é sagrada** (leveza sem culpa, dado e espaço, marca ≠ dinheiro/`feedback.*` desacoplado, dark first-class, tipografia modesta); os **valores estão em jogo** (Rausch, sub-acentos, logo, possivelmente neutros/radius). A estrutura dos ADRs 0008/0009 sobrevive; os valores dos tokens não necessariamente.
4. **Nome**: "bfin" **fica** — não é emprestado, é curto e já está em domínio/Instagram/Ads.
5. **Benchmark visual**: amostra ratificada (concorrentes + consumer BR + fintechs gringas de design forte); método **híbrido** — loja/site para todos, instalação real de Mobills/Organizze. Ver [benchmark-visual.md](./benchmark-visual.md).
6. **Critério de sucesso do rebrand**: (a) **distintividade** — passa o "teste sem logo", não lembra Airbnb nem fintech genérica; (b) **acessibilidade mantida** — WCAG AA em light e dark, `feedback.*` continua desacoplado da marca.
7. **Sequenciamento com Google Ads**: Ads liga em **orçamento mínimo** só para validar o funil técnico (conversão server-side, gclid); **escala de verba só após o rebrand** — não se constrói reconhecimento pago sobre ativo emprestado.

8. **ADR-0012 criado** — `docs/adr/0012-rebrand-ativo-proprio.md` registra a decisão do rebrand, o contrato, os critérios de sucesso e o gate de verba do Ads.
9. **Personas ratificadas** — unificação de [personas.md](./personas.md) aceita; `PRODUCT.md` ganhou ponteiro.
10. **Receita é não-objetivo até D7 > 30% provado** — sem meta de MRR nos próximos 12 meses; ver [objetivos.md](./objetivos.md).

## Próximos passos

1. Executar as capturas do [benchmark visual](./benchmark-visual.md) (método híbrido) e sintetizar os achados contra as hipóteses H1-H3.
2. Com o benchmark em mãos, abrir o trabalho de rebrand propriamente dito (exploração de identidade) — fora do escopo deste Discovery.

## Fase seguinte: Estratégia de Marca (concluída)

Definir **quem a marca é** (Brand Core, Positioning, Value Proposition, Personality, Voice & Tone) — o documento-guia que o rebrand (ADR-0012) traduz em identidade visual própria. Concluído em grilling (2026-07-02): [brand-strategy.md](./brand-strategy.md). Decisão fundacional ratificada: a marca deriva da **filosofia/identidade**, com os gatilhos psicológicos como instrumento de canal. Arquétipo: **Guia/Sábio-aliado**. Posicionamento: mesma categoria, diferenciado por **posição** (prospectivo + não-culposo).
