# 12. Rebrand: substituir a identidade herdada do Airbnb por ativo próprio

Data: 2026-07-02
Status: Aceito

## Contexto

O design system do bfin declara abertamente sua proveniência: paleta de marca, escala de texto, spacing e radius herdados do **Airbnb** — incluindo o Rausch `#ff385c` como cor de marca (`DESIGN.md`). A herança foi um bootstrap de qualidade: deu ao produto consistência visual madura sem custo de design. Mas marca construída sobre ativo alheio não é distintiva nem defensável — e o momento força a decisão: o Google Ads está prestes a escalar (ADR-0010), e cada real de mídia construiria reconhecimento sobre uma identidade que pertence a outra empresa.

O Discovery de rebrand vive em `docs/discovery/` (briefing, personas, benchmark visual, SWOT, mood).

## Decisão

Fazer um **rebrand completo** (logo, paleta, tom) propagando para app e superfícies de aquisição, sob o seguinte contrato:

- **Sagrado (atravessa o rebrand):** a filosofia — leveza sem culpa, dado e espaço sobre peso e ornamento, **marca ≠ dinheiro** (semântica financeira em `feedback.*`, desacoplada — ADR-0008), dark mode first-class, tipografia modesta (pesos 500-600).
- **Em jogo:** os valores concretos — Rausch e sub-acentos (`luxe`, `plus`), logo, e potencialmente neutros/radius. A **estrutura** dos ADRs 0008 (tokens semânticos) e 0009 (Instagram estende o design system) sobrevive; os **valores** dos tokens não necessariamente.
- **Nome "bfin" fica** — não é emprestado, é curto e já está investido em domínio, SEO, Instagram e Ads.

**Critérios de sucesso:** (a) **distintividade** — uma tela do bfin passa o "teste sem logo": não lembra Airbnb nem fintech genérica; (b) **acessibilidade mantida** — WCAG 2.1 AA (≥ 4.5:1 corpo) em light **e** dark em toda cor nova.

**Gate de mídia:** o Google Ads liga em **orçamento mínimo**, apenas para validar o funil técnico (conversão server-side, gclid); a **escala de verba fica condicionada ao rebrand**.

## Consequências

**Positivas:**
- A marca vira ativo próprio e defensável antes do investimento em reconhecimento pago.
- Momento mais barato possível: base < 50 usuários, produção do Instagram é template-driven (ADR-0009) — retrabalho contido.
- A arquitetura de tokens (regra de ouro do `DESIGN.md`) faz o rebrand ser majoritariamente troca de **valores** de token, não caça a cor crua espalhada.

**Negativas / trade-offs aceitos:**
- Atrasa a escala do Google Ads — validação de canal em verba cheia espera a identidade nova.
- Trabalho real de re-tokenização, novo logo e re-template do feed.
- Risco de a identidade nova ser pior que a herdada (o Airbnb é referência de classe mundial); mitigado pelo benchmark visual (`docs/discovery/benchmark-visual.md`) e pelos critérios de sucesso verificáveis.

## Alternativas descartadas

- **Manter a identidade emprestada e escalar mesmo assim:** cada real de mídia construiria memória visual sobre ativo do Airbnb — dívida de marca crescendo com juros pagos em verba.
- **Rebrand incluindo o nome:** perderia domínio, SEO do blog e handles sem ganho — "bfin" não sofre da falha que motiva o rebrand.
- **Troca pontual só da cor de marca:** não resolve logo nem expressão; rebrand pela metade manteria a dívida com custo de migração quase igual.
