# Estratégia Go-to-Market — bfin

Data: 2026-05-14
Status: Rascunho v1 (vivo — atualizar conforme aprendizado)
Autor: @igor.guariroba

## Contexto

bfin é app pessoal de finanças com diferencial conceitual: separação entre **gasto fixo** e **diário** (gasto variável: mercado, uber, delivery), e **previsão** tratada como meta orientativa — não trava rígida. Posicionamento contrasta com Mobills/Organizze/GuiaBolso, que punem usuário com categorização excessiva e metas culposas.

Stack atual: Next.js (App Router), Prisma, integração WhatsApp Cloud API direta (ADR-0001), blog SEO em `/blog/*` com Topic (ADR-0002).

## Perfil público-alvo (ICP)

### Primário — "Planejador frustrado"

- **Demografia**: 25-40 anos, classe B/C urbano, Brasil
- **Renda**: R$ 3-15k/mês, gasto variável alto (delivery, uber, mercado)
- **Histórico**: já tentou planilha Excel, GuiaBolso, Mobills, Organizze — abandonou
- **Dor central**: apps existentes exigem categorização rígida e transformam meta em culpa
- **Comportamento revelador**: anota gasto no WhatsApp consigo mesmo, tira screenshot de Pix, abre planilha mensal e desiste

### Secundário — "Casal que briga por dinheiro"

- Compartilham conta corrente mas não visibilidade de gastos
- Quer ver pra onde vai dinheiro sem virar contador
- Entra via convite do primário (account sharing via `AccountMember`)

## Canais orgânicos

Listados por ROI estimado (alto → baixo) no estágio atual de produto.

### 1. Reddit BR + comunidades nicho

- Subreddits: r/financaspessoaisbr, r/brasil, r/investimentos, r/desabafos
- Tática: responder dúvida real com profundidade. Link no perfil, não no comentário.
- Cadência: 3 respostas úteis/semana
- Métrica: cliques no perfil, signups com utm=reddit

### 2. TikTok / Reels educativo

- Formato: hook concreto ("categorizei R$ 8k em 30s — surpresa"), não abstrato ("controle finanças")
- Cadência mínima: 3 posts/semana por 60 dias antes de avaliar
- Métrica: retenção média > 50%, salvamentos > comentários

### 3. SEO long-tail PT-BR

- Blog dentro do app (já existe estrutura `/blog/*` com Topic — ADR-0002)
- Alvos: "como dividir gasto variável fixo", "planilha gasto mercado 2026", "app finanças sem categoria"
- Meta inicial: 10 artigos focados, 1500+ palavras, intenção transacional/informacional
- Métrica: posição média no Search Console, CTR

### 4. Twitter/X tech BR + Threads

- Build in public: métrica semanal, decisão de produto, screenshot de feature
- Atrai early adopter + comunidade dev (efeito multiplicador via RT)
- Cadência: 1 thread longa/semana + microposts diários

### 5. Indique-ganhe

- **Pré-requisito**: 100+ usuários com retenção D30 saudável
- Recompensa: 1 mês premium grátis por indicação convertida
- Não ativar antes — vira spam sem produto sólido

## Faseamento

### Fase 0 — Validação (0-50 usuários)

- Onboarding manual via call/WhatsApp com primeiros 20 usuários
- Foco: aprender padrão real de dor, não escalar
- Sinal de saída: 5 usuários voltam sozinhos por 4 semanas seguidas

### Fase 1 — Tração orgânica (50-500 usuários)

- 1 canal principal escolhido (Reddit OU TikTok), não múltiplos
- Métrica norte: retenção D7, não signups brutos
- Sinal de saída: retenção D7 > 30%, custo de aquisição orgânico < 5min/usuário

### Fase 2 — Escala orgânica (500-5k usuários)

- SEO + indique-ganhe ativados
- Parceria com criador finanças nano (10-50k seguidores) — barter, não pago
- Sinal de saída: 30% dos signups vêm de canal não-fundador

## Princípios

1. **Foco em 1 canal por vez por 60 dias mínimo.** Tentar tudo dilui sinal e esgota energia.
2. **Retenção antes de aquisição.** Trazer 1000 usuários que somem em 7 dias é dano reputacional.
3. **Conteúdo educativo > promo.** Vender produto vem por consequência, não por anúncio direto.
4. **Build in public proporcional.** Compartilhar métrica real cria confiança, mas não vire performance.

## Ferramentas & Frameworks

Stack de referência para construir e validar a estratégia. Não usar tudo — escolher por fase.

### Frameworks mentais (leitura)

- **The Mom Test** (Rob Fitzpatrick) — como entrevistar usuário sem viés. Pergunta passado concreto, não opinião futura. **Obrigatório Fase 0**.
- **Traction** (Gabriel Weinberg) — 19 canais de aquisição. Bullseye framework: testa 3 baratos em paralelo, dobra no vencedor.
- **Continuous Discovery Habits** (Teresa Torres) — entrevista semanal sem virar projeto paralelo. Opportunity Solution Tree.
- **Hooked** (Nir Eyal) — trigger → action → reward → investment. Aplicável a finanças = hábito.
- **Lean Startup** (Eric Ries) — Build-Measure-Learn, MVP, pivot vs persevere. Resumo basta se já familiar.

### Pesquisa de mercado / ICP

| Ferramenta | Uso | Custo |
|---|---|---|
| Perplexity / ChatGPT Deep Research | Mapear concorrentes BR (Mobills, Organizze, Olivia), preço, posicionamento | Free/$20 |
| SimilarWeb | Tráfego de concorrentes, canais que funcionam pra eles | Free tier |
| Google Trends BR | Validar dor real ("controle gastos", "planilha finanças") | Free |
| Ahrefs Free / Ubersuggest | Palavras-chave SEO long-tail PT-BR com volume | Free tier |
| Answer The Public | Perguntas reais sobre finanças pessoais | Free |

### Entrevista / validação qualitativa

| Ferramenta | Uso |
|---|---|
| Tally.so | Survey curto, grátis ilimitado |
| Typeform | Survey premium, melhor UX |
| Maze | Teste de protótipo remoto com métricas UX |
| Dovetail / Notion | Organizar transcrição, tag por padrão recorrente |
| Loom + Otter.ai | Gravar call + transcrição automática PT-BR |

### Analytics / retenção (essencial Fase 1)

| Ferramenta | Por quê |
|---|---|
| **PostHog** (recomendado) | Funil, retenção cohort, session replay, feature flag — open source, self-host grátis. Combina bem com Next.js + Prisma. |
| Plausible / Umami | Analytics web simples, LGPD-friendly, sem cookie banner |
| Microsoft Clarity | Heatmap + replay, grátis ilimitado |
| Metabase | Dashboard SQL direto sobre Postgres (Prisma DB), open source |
| June.so | Analytics produto focado B2C SaaS, free tier |

### Growth / aquisição de canal

| Ferramenta | Uso |
|---|---|
| GummySearch | Minera Reddit por dor real do ICP — input direto pra copy |
| BuzzSumo / Exploding Topics | Tendências de conteúdo financeiro |
| Buffer / Publer | Agendar TikTok/Twitter/LinkedIn, free até 3 contas |
| Resend / Mailerlite | Newsletter — Resend tem API decente e free generoso |

### Comunidades BR (high signal, low effort)

- **r/financaspessoaisbr** — laboratório de dor real, não só canal
- **Startup SE BR (Discord)** — fundadores early stage
- **Latitud community** — LatAm founder pool
- **Cubo Itaú meetups** — presencial SP
- **Twitter BR tech** — founders pequenos por osmose

### Roteiro de aplicação (próximas 3 semanas)

**Semana 1:**
1. Ler *The Mom Test* (1 noite)
2. Instalar PostHog (self-host ou cloud free) — começa coletar funil `signup → primeira Transaction → D7`
3. GummySearch trial 7 dias — extrair 50 frases reais de dor do r/financaspessoaisbr → input pra copy

**Semanas 2-3:**
4. 10 entrevistas Mom Test com usuário atual + abandonou Mobills/Organizze
5. Mapear Bullseye (Traction): top 3 canais → testar cada por R$ 0 em 2 semanas
6. Decidir canal Fase 1 com base em sinal real, não intuição

## Decisões pendentes

- [ ] Escolher canal Fase 1: Reddit ou TikTok
- [ ] Definir métrica norte D7 vs D30
- [ ] Calendário editorial blog (10 títulos prioritários)
- [ ] Aprovar mecânica de indique-ganhe (1 mês premium é suficiente?)

## Histórico de revisões

- **2026-05-14** — v1 rascunho inicial. ICP definido, canais listados, faseamento esboçado.
- **2026-05-14** — v1.1 seção Ferramentas & Frameworks (livros, stack de validação, roteiro 3 semanas).
