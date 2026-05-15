# Pesquisa de Mercado — bfin

Data: 2026-05-14
Status: v1 (snapshot — atualizar trimestralmente)
Autor: @igor.guariroba
Relacionado: [go-to-market.md](./go-to-market.md)

## Sumário executivo

- **Mercado em alta**: 80,9% das famílias brasileiras endividadas (recorde), 29,7% inadimplentes, 54% dos trabalhadores formais não fecham o mês. Demanda por solução é estrutural, não cíclica.
- **Penetração baixa de apps dedicados**: apenas 19-20% dos brasileiros usam app de gestão financeira, contra 81% que usam app de banco. Gap = ~80M adultos com smartphone sem solução adequada.
- **Concorrência consolidada mas vulnerável**: Mobills (7M usuários) lidera mas tem reputação ruim em sincronização bancária; Organizze (2M) é querido mas tem preço alto no plano Conectado (R$ 399-599/ano).
- **Concorrência emergente em WhatsApp**: ZapGastos, Jota, Radar Dinheiro atacam por chat-first. bfin já está nessa categoria via WhatsApp Cloud API (ADR-0001).
- **Diferencial defensável do bfin**: separação Diário vs Fixo + previsão orientativa ataca dor real (Organizze cansa, Mobills erra categoria, todos punem com meta rígida).

## TAM / SAM / SOM

| Camada | Definição | Estimativa | Fonte |
|---|---|---|---|
| **TAM** | Adultos brasileiros com smartphone | ~150M | IBGE + penetração smartphone ~85% |
| **SAM** | Usuários potenciais de app finanças pessoais (já usam app de banco) | ~120M (81%) | Lina/MindMiners 2026 |
| **SAM ativo** | Quem hoje usa app de gestão financeira dedicado | ~24-30M (19-20%) | Lina/MindMiners 2026 |
| **Mercado capturado pelos líderes** | Mobills + Organizze + Olivia (no Nubank) + outros | ~12-15M (~50% do SAM ativo) | Play Store self-report |
| **SOM bfin 12 meses (Fase 1)** | 0,01% do SAM ativo | 2-3k usuários | Meta conservadora |
| **SOM bfin 36 meses** | 0,5% do SAM ativo | ~120k usuários | Premissa: produto + canal funcionando |

**Dado-chave**: 48% dos brasileiros não controlam finanças **por nenhum método** (nem app, nem planilha, nem anotação). É o maior pool não-explorado — mas também o mais difícil de converter (dor latente, não declarada).

## Mapa de concorrentes

### Tradicionais (app dedicado)

| Player | Usuários | Preço Premium | Modelo | Forças | Fraquezas |
|---|---|---|---|---|---|
| **Mobills** | 7M | R$ 99,90/ano | Automação + 30+ features | Marca, blog SEO, conexão Open Finance | Sincronização quebrada (reclamação massiva no Reclame Aqui), suporte ruim, plano premium não cumpre promessa |
| **Organizze** | 2M | R$ 159/ano (manual) / R$ 399-599/ano (Conectado) | Manual = consciência | Boa reputação Reclame Aqui, offline, criptografia, simplicidade | Sem dividir despesas, manual cansa, plano Conectado caro |
| **Minhas Economias** | n/d | 100% grátis | Manual, sem premium | Grátis ilimitado | Stack antigo, pouca evolução, UX datada |
| **Olivia** | — | — | — | — | **Morreu em 2022, adquirida pelo Nubank** |
| **Focca-Ai** | n/d | R$ 24,90/mês | IA + categorização | Pitch de IA | Premium caro relativo, marca pequena |
| **Encaixei** | n/d | n/d | Comparativo + planilha | Posicionamento de "comparador" | Não é app principal, é nicho |

### Emergentes (WhatsApp-first) — concorrência direta do bfin

| Player | Modelo | Diferencial | Risco pro bfin |
|---|---|---|---|
| **ZapGastos** | WhatsApp + Open Finance | Texto/áudio/foto, free trial, automação total | **Alto** — mesmo canal, mais maduro |
| **Jota** | WhatsApp + IA + conta digital | 100% CDI sem IOF, Pix por áudio, gratuito | **Alto** — escopo maior que finanças |
| **Radar Dinheiro** | Chat-first | "Conversa em vez de planilha", elimina curva | **Médio** — posicionamento puro chat |
| **Financinha** | Blog + chat | Conteúdo educativo + bot | **Baixo** — mais conteúdo que produto |

**Tendência confirmada por múltiplas fontes**: "Interface invisível" / "conversational finance" é a aposta de 2026. WhatsApp é a interface vencedora no Brasil.

## Validação de dor (qualitativa)

### Dor do mercado (Lina/MindMiners 2026, n=1000)

- **37%** nunca receberam educação financeira formal
- **38%** apontam falta de disciplina ou tempo como obstáculo principal
- **48%** não controlam finanças por nenhum método
- **72%** reconhecem tecnologia como útil — mas não convertem em uso

**Insight**: gap entre intenção e adoção é massivo. Aposta de produto: reduzir fricção ao mínimo (chat > app), não educar (já existe consciência).

### Dor específica do Mobills (Reclame Aqui)

Padrões recorrentes nas reclamações:

- "Sincronização automática é uma mentira"
- Migração forçada para Open Finance piorou experiência
- Duplicação de lançamentos
- Plano Premium pago não cumpre promessa de sincronização
- Categorização automática erra em CNPJ genérico
- Não permite criar transação manual em contas automáticas

**Implicação pro bfin**: se prometer sincronização, tem que entregar — risco reputacional alto. Alternativa: posicionar como "input manual rápido + sem categoria forçada" (vira virtude o que é limitação).

### Dor específica do Organizze

- Sem feature de dividir despesas (pedido recorrente)
- Manual cansa usuários com muita transação
- Plano Conectado tem preço fora do bolso da classe C (R$ 399-599/ano)

### Dor emocional (contexto macro)

Entre endividados: **66% relatam aumento de estresse, 43% irritabilidade, 39% insônia**. Produto não é só feature — é redução de ansiedade. Copy deve refletir isso.

## SEO PT-BR — palavras-chave prioritárias

Volumes exatos requerem Ahrefs/Ubersuggest. Lista abaixo é qualitativa (alta intenção observada nas SERPs):

### Topo de funil (informacional)

- `como controlar gastos`
- `planilha controle financeiro`
- `como dividir gasto fixo variável`
- `app finanças pessoais 2026`
- `controle financeiro pelo whatsapp`

### Meio de funil (comparativo — alta intenção)

- `Mobills vs Organizze` (concorrentes já disputam — entrar com 3º ponto de vista)
- `alternativa ao Mobills`
- `melhor app finanças sem sincronização`
- `app finanças com WhatsApp`
- `Mobills bom ou ruim`

### Fundo de funil (transacional)

- `controle financeiro grátis whatsapp`
- `aplicativo gastos diários sem categoria`
- `app finanças pessoais brasileiro`

### Oportunidades não óbvias

- **"alternativa Mobills sincronização"** — pega dor específica, baixa concorrência
- **"app finanças sem meta rígida"** — pega diferencial do bfin (previsão orientativa)
- **"controle gastos variáveis mercado uber"** — pega ICP "Planejador frustrado" pelo exemplo concreto

## Posicionamento sugerido pro bfin

Baseado em gaps confirmados:

> **"O app de finanças que não te trata como mau aluno."**
> Diário separado de fixo. Previsão como meta, não trava. WhatsApp pra registrar em 3 segundos.

### Eixos de diferenciação (defensáveis)

1. **Diário vs Fixo** — nenhum concorrente nomeia essa distinção; é decisão de domínio (ver CONTEXT.md). Vocabulário próprio = moat.
2. **Previsão orientativa** — Mobills/Organizze tratam meta como teto rígido; bfin trata como referência. Reduz culpa.
3. **WhatsApp + flexibilidade manual** — ZapGastos automatiza tudo via Open Finance; bfin pode ser "WhatsApp pra registrar rápido sem precisar conectar banco".
4. **Foco classe B/C com preço justo** — Premium R$ 9,90-14,90/mês ataca faixa entre Minhas Economias (grátis sem evolução) e Organizze Conectado (R$ 33-50/mês).

### O que NÃO tentar

- **Não competir em sincronização Open Finance** (ainda) — é apostar onde Mobills queima reputação. Validar primeiro se ICP realmente quer ou só "acha que quer".
- **Não vender IA** — mercado saturado de promessa, baixa entrega. Vender feature concreta.
- **Não brigar com Jota em escopo** — Jota quer ser conta + finanças + IA. bfin é finanças only, melhor focado.

## Riscos e ameaças

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Nubank lança feature de finanças pessoais nativa (já tem Olivia adquirida) | Alta | Ser melhor pra quem **não** quer ficar amarrado a um banco |
| ZapGastos / Jota crescerem rápido e capturarem nicho WhatsApp | Alta | Diferenciar por produto (Diário/Fixo, previsão), não canal |
| Open Finance simplificar a ponto de virar commodity | Média | Posicionar como "manual rápido", aceitar que sync não é diferencial |
| Mobills baixar preço ou reformar produto | Média | Manter foco no ICP específico onde Mobills já falhou |
| Concorrente novo de fora (Money Lover, YNAB-style BR) | Baixa | Vantagem de PT-BR nativo + cultura local |

## Decisões abertas pós-pesquisa

- [ ] Validar premissa "sincronização não é deal-breaker" com 10 entrevistas Mom Test
- [ ] Decidir faixa de preço Premium: R$ 9,90, 12,90 ou 14,90/mês
- [ ] Escolher 1 keyword long-tail pra primeiro artigo do blog (sugestão: "alternativa Mobills sincronização")
- [ ] Definir se Open Finance entra no roadmap 12 meses (ou nunca)
- [ ] Estudar adquisição da Olivia pelo Nubank — o que sobrou da equipe / produto?

## Fontes

### Mercado / TAM
- [Exame: Apenas 20% dos brasileiros utilizam aplicativos de gestão financeira](https://exame.com/bussola/apenas-20-dos-brasileiros-utilizam-aplicativos-de-gestao-financeira/) (Lina Open X + MindMiners, jan/2026, n=1000)
- [CNN Brasil: Inadimplência atinge 81,7 milhões](https://www.cnnbrasil.com.br/economia/macroeconomia/inadimplencia-atinge-817-milhoes-e-cresce-38-em-10-anos-no-brasil/)
- [ISTOÉ Dinheiro: 80% das famílias do Brasil estão endividadas](https://istoedinheiro.com.br/endividamento-familias-brasil-inadimplencia)
- [Serasa: 10 anos do Mapa de Inadimplência](https://www.serasa.com.br/imprensa/10-anos-do-mapa-de-inadimplencia/)
- [GPF: Inadimplência no Brasil em 2026](https://www.gpf.adv.br/2026/04/01/inadimplencia-no-brasil-em-2026-endividamento-das-familias-no-teto-historico-risco-de-credito-estrutural-e-implicacoes-juridicas-para-empresas/)

### Concorrentes
- [Mobills Pricing](https://www.mobills.com.br/pricing/)
- [Organizze Planos](https://www.organizze.com.br/planos/)
- [Cashme: 9 aplicativos de controle financeiro](https://www.cashme.com.br/blog/aplicativos-para-controle-financeiro/) (base usuários Mobills/Organizze)
- [Encaixei: Comparativo de preços apps finanças](https://www.encaixei.com.br/comparativo-de-precos-apps-financas)
- [Focca-AI: Melhor app financeiro 2026](https://focca-ai.com/melhor-app-financeiro-2026)
- [ZapGastos](https://zapgastos.com/)
- [Jota](https://jota.ai/)
- [Finsiders: Os novos passos da Olivia](https://finsidersbrasil.com.br/reportagem-exclusiva-fintechs/os-novos-passos-da-olivia-para-ser-plataforma-de-inteligencia-financeira/)

### Dor (Reclame Aqui — amostra Mobills)
- [Sincronização automática é uma mentira](https://www.reclameaqui.com.br/mobills-educacao-financeira/sincronizacao-automatica-e-uma-mentira-e-suporte-terrivel_h_QwhE44gieuwFM-/)
- [Open Finance piorou a Sincronização](https://www.reclameaqui.com.br/mobills-educacao-financeira/open-finance-piorou-a-sincronizacao_xMWI77t81tB75asl/)
- [Lista de reclamações Mobills](https://www.reclameaqui.com.br/empresa/mobills-educacao-financeira/lista-reclamacoes/?pagina=1&status=EVALUATED)

### Tendências
- [Exame: Tendências fintech 2026](https://exame.com/future-of-money/tendencias-para-o-mercado-fintech-e-inovacao-financeira-em-2026/)
- [Startups to Watch: Por que a IA venceu os apps tradicionais](https://startupstowatch.com.br/o-melhor-aplicativo-para-controle-financeiro-em-2026-por-que-a-ia-venceu-os-apps-tradicionais/)

## Histórico de revisões

- **2026-05-14** — v1 inicial. Mapeamento concorrentes BR, validação de dor via Reclame Aqui + Lina/MindMiners, TAM/SAM/SOM estimado, keywords SEO priorizadas, posicionamento sugerido.
