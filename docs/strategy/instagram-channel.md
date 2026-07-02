# Estratégia do Canal Instagram — bfin

Data: 2026-06-30
Status: Rascunho vivo (preenchido durante sessão de design — grill-with-docs)
Autor: @igor.guariroba

## Contexto

Materializa o canal Fase 1 do [`go-to-market.md`](./go-to-market.md). O GTM estabelecia "1 canal por 60 dias" e tinha pendência "Reddit ou TikTok"; este documento registra a escolha por Instagram e aprofunda identidade, conteúdo e operação.

O bfin é app de finanças pessoais com diferencial conceitual: **separação gasto fixo vs diário** e **previsão como meta orientativa (não trava culposa)**. Posicionamento: educação > promo, contra a categorização rígida e culposa de Mobills/Organizze.

## Decisões consolidadas (resumo)

1. **Canal Fase 1 = Instagram (Reels).** Resolve a pendência "Reddit ou TikTok" do GTM. Foco, não paralelo.
2. **Lead é métrica de marketing, não entidade de domínio.** Capturada via UTM no signup; vira `User` direto (não `Contact`).
3. **Conta é faceless brand.** Asset do produto, sem rosto. Identidade vem de design + conceito + copy.
4. **Pilares:** P1 Conceito (~50%) / P2 Produto em ação (~30%) / P3 Cabeça de quem controla (~20%).
5. **Voz desce da Brand Strategy** ([brand-strategy.md](../discovery/brand-strategy.md) — personalidade: leveza sem culpa, clareza, calma, esperteza; arquétipo narrativo: Guia/Sábio-aliado). No canal, se expressa via dor + gatilho. Gatilhos-mãe: **validação/alívio** + **aversão à perda**.
6. **Estética = extensão do design system do app** ([ADR-0009](../adr/0009-identidade-visual-do-canal-instagram.md)). Hero tipográfico-numérico.
7. **Formatos:** Reel 65% / Carrossel 20% / Story 15%.
8. **Áudio dos Reels:** voz IA + música baixa + legenda dinâmica.
9. **Operação:** híbrido faseado — manual desde já + setup da Graph API em paralelo.
10. **Arquitetura:** workflow no Claude Code em `/home/movida/projetos/bfin-instagram/` (git separado).
11. **Cadência:** 4 feeds/semana (3 Reels + 1 Carrossel) + Story diário.
12. **Medição:** norte = retenção + salvamentos + signups-UTM; alcance como diagnóstico; revisão quinzenal.

---

## 1. Canal Fase 1 = Instagram (Reels)

Instagram é o canal de aquisição primário. Equivale ao "canal 2 (TikTok/Reels)" do GTM — escolha de foco, não adição paralela. Resolve a pendência "Reddit ou TikTok" do GTM. Princípio "1 canal por 60 dias" mantido.

## 2. Lead é métrica de marketing, não entidade de domínio

"Lead" **não é termo canônico** do glossário (`CONTEXT.md`) e não vira modelo do Prisma. Lead = pessoa com fit de ICP + intenção de uso, capturada via **CTA de link → landing → signup**.

- Conversão se revela no **clique** e se confirma no **signup como `User`** (não passa por `Contact`).
- Atribuição por **UTM**: `utm_source=instagram`, `utm_medium=reels|story|bio`, `utm_campaign=<slug-do-post>`.
- `Contact` segue exclusivo do canal WhatsApp (definido por telefone). Instagram é top-of-funnel que deságua direto no signup web.
- _Avoid_: tratar lead do Instagram como `Contact`; criar `InstagramLead` como entidade.

## 3. Conta é faceless brand (sem rosto)

A conta é do produto (asset da marca), **sem fundador ou pessoa na câmera**. Identidade vem do **design + conceito + copy**, não de rosto humano. Trade-off aceito: trust mais lento num tema que pede gente, em troca de operação mais automatizável e zero exposição pessoal. Implica formatos sem pessoa (carrossel, Reel animado/motion, voz IA).

## 4. Pilares de conteúdo

Espinha dorsal editorial. A conta é faceless, então o conceito carrega a identidade — o ângulo é o diferencial do bfin (fixo vs diário, previsão sem culpa), não "dicas genéricas de economia".

| Pilar | O que é | % | Ancora em |
|---|---|---|---|
| **P1 — Conceito** | Ensinar o jeito bfin: fixo vs diário, "o que sobrou de verdade", "posso gastar agora?", previsão como meta (não culpa) | ~50% | Diferencial do bfin; "educação > promo" |
| **P2 — Produto em ação** | Mostrar o Horizonte/heatmap, a previsão, o lançamento rápido — demonstrar, não vender | ~30% | Dor 1 e 2 do user-pains |
| **P3 — Cabeça de quem controla** | Hábito, ansiedade, impulso, "nunca sobra nada" — o lado emocional do ICP | ~20% | Perfil 3 do user-pains |

Excluído de propósito: build-in-public como pilar regular (faceless + early stage), dicas genéricas de economia (saturado), venda/promo direta (contra o GTM).

## 5. Tom de voz

A voz **desce da Estratégia de Marca** ([brand-strategy.md](../discovery/brand-strategy.md)): a fonte é a personalidade da marca (filosofia: leveza sem culpa, clareza, calma, esperteza; arquétipo narrativo de Guia/Sábio-aliado). Aqui no canal ela se **expressa** via dor + gatilho (método: dor → gatilho → traço de voz) — os gatilhos são técnica de canal a serviço da identidade, não a fonte dela. Arquétipo **estético** (adorno visual) segue descartado.

**Gatilhos-mãe** (prioridade): **validação/alívio** (ancora no diferencial "não te trata como mau aluno") + **aversão à perda** (ancora na proposta prospectiva: mostrar a consequência antes do susto).

**Traços operacionais** (emergem do cruzamento dor→gatilho):
1. **Validadora, não juíza** — dor da culpa é o fosso vs Mobills/Organizze. Todo post começa do lado do usuário.
2. **Concreta ao extremo** — "hook concreto, não abstrato" (GTM); número, exemplo, situação. Nunca "controle suas finanças".
3. **Prospectiva** — proposta central (`competitor-analysis.md`): "para onde vai, não onde foi". A voz olha pra frente.

Traços secundários (esporádicos): curiosidade/contraste (hook de alcance), esforço-mínimo (demonstração de produto), pertencimento (P3, sem virar coach).

## 6. Estética visual

A estética do canal **estende** o design system do app (`DESIGN.md` — identidade Airbnb-like, propositalmente não-fintech), não cria linguagem viral própria. Decisão e trade-off formalizados no [ADR-0009](../adr/0009-identidade-visual-do-canal-instagram.md). Resumo operacional:

- **Paleta:** canvas branco (`#ffffff`) + ink near-black (`#222222`) + **Rausch (`#ff385c`) como único accent de marca**, usado escassamente.
- **Convenção de cor de dado:** Rausch **não** carrega semântica financeira (saldo/dívida). Para dados/projeções, usar ink/neutral para o saldo e um verde contido para positivo — Rausch fica reservado para UI/CTA/traços de marca.
- **Shapes soft:** cantos arredondados, pill-shaped, sem quina dura — igual ao app.
- **Tipografia modesta** (pesos 500/600), generosa — *"whitespace over typographic muscle"*.
- **Hero visual = tipográfico-numérico**, não fotográfico (a conta é faceless): tipografia gigante + número concreto + gráfico mínimo sobre canvas branco.
- **Rejeitado de propósito:** estética fintech azul/verde, tipografia bold/heavy, fundos escuros/neon "viral", stock photography financeiro genérico.

## 7. Formatos

Mix definido pelo dono, priorizando **descoberta/alcance** (Reel é onde o Instagram entrega nano-conta):

| Formato | % | Papel | Pilar dominante |
|---|---|---|---|
| **Reel** | ~65% | Motor de descoberta/alcance; hook forte; precisa motion + áudio | P1 (hooks), P3 (emocional), P2 (motion do Horizonte) |
| **Carrossel** | ~20% | Autoridade + salvamento; mais automatizável | P1 (conceito em passos) |
| **Story** | ~15% | Conversão (link sticker → landing, único link clicável direto) + bastidores | CTA transversal |

**Consequência crítica (colide com "automatizar tudo daqui"):** Reel dominante (65%) é o formato **mais caro de produzir e automatizar** — exige motion + áudio + legendagem, ao contrário de carrossel (imagens estáticas template-driven). A decisão de operação (seção 9) é dominada por esta escolha.

## 8. Áudio dos Reels

Padrão: **voz IA + música baixa + legenda dinâmica**. A voz carrega o conteúdo (necessário pra P1 conceitual, que é ensino), a música pega o algoritmo, a legenda garante quem assiste sem som.

- **Voz de marca:** IA de geração de voz **humana/hiper-realista** (não robótica), perfil **calma-clara-próxima** (timbre médio/médio-grave, ritmo moderado, calor controlado) — deriva do ICP ansioso e do gatilho validação/alívio; animada/hype é contra-indicada.
- **Voice ID/clonagem específica:** por **teste A/B na Fase A** (métrica decisória: retenção). Provedor recomendado: **ElevenLabs** (estado da arte PT-BR, suporta clonagem de voz humana); alternativas: OpenAI TTS, PlayHT.
- **Trade-off aceito na operação:** música **embutida no vídeo** (livre/licenciada), não trending do catálogo — perde algum boost do algoritmo de áudio, mas evita automação browser (risco de banimento).
- **Biblioteca (aprovado 2026-06-30):** **Meta Sound Collection + Pixabay Music** — grátis, zero strike, uso comercial liberado. Catálogo curado de ~15-20 faixas (calmas, ritmo moderado) em `bfin-instagram/templates/audio/`, reutilizadas entre Reels pra consistência.

## 9. Operação de produção e postagem

**Criação = 100% daqui** (independente do método de postagem): Claude gera roteiro → arte (template/SVG) → voz IA (TTS) → ffmpeg monta o Reel (vídeo + voz + música livre + legenda queimada) → legenda + hashtags.

**Postagem = híbrido:**

| Conteúdo | Método | Por quê |
|---|---|---|
| Reel (65%) + Carrossel (20%) | **Graph API oficial** | Automatizado, estável, sem risco de banimento |
| Story com link sticker (15%) | **Manual** (celular/web) | API não suporta link sticker — e o Story só cumpre o papel de conversão com o link |

**Decisões técnicas confirmadas (validado em 2026-06-30):**
- Graph API publica Reel (`media_type=REELS`, modelo container de 3 passos), Carrossel, single image. Exige conta **Business** (Creator não serve) + **Facebook Page** vinculada + **Meta App** com `instagram_content_publish` + App Review.
- **Limitação material:** API **não suporta link sticker nem stickers interativos em Stories** — por isso Story é manual.
- Rate limit: 100 posts/24h (suficiente).

**Automação browser (chrome-devtools, porta 9222) — NÃO usada para postagem.** Risco de shadowban/banimento em conta nova/nano viola ToS. Reservada para **leitura/engajamento** (DMs, comentários, pesquisa de concorrentes, leitura de Insights) — uso menos detectável.

**Faseamento decidido:** paralelo, sem parar de postar.
- **Fase A — Manual assistido (desde já):** Claude gera 100% do material; dono publica manualmente. Valida conteúdo/voz/estética contra o algoritmo real desde o dia 1.
- **Fase B — Setup API oficial (em paralelo):** converter/criar conta IG **Business** + vincular **Facebook Page** + criar **Meta App** + submeter ao **App Review** (`instagram_content_publish`). Quando aprovado, migrar Reel+Carrossel para API. Story permanece manual.
- **Fallback se o setup não acontecer:** degrada para manual assistido em tudo — realiza "fazer daqui" na criação, perde só a automação da postagem.

## 10. Arquitetura da operação (onde mora)

**Fase 1: workflow leve no Claude Code, assets versionados.** Sem sistema, sem infra nova. Diretório `/home/movida/projetos/bfin-instagram/` (git próprio, desacoplado do bfin-app):

```
bfin-instagram/
├── templates/   # SVG/HTML de carrossel, motion base de Reel, paleta/tipografia (extensão do DESIGN.md)
├── scripts/     # gerar arte, TTS (voz IA), ffmpeg (montar Reel), postar/ler via Graph API
├── content/     # roteiros, legendas, hashtags, calendário editorial, experiments.md
└── README.md    # Brand voice, pilares, gatilhos, estética (este doc é a fonte)
```

**Desacoplamento com o bfin-app:** o conteúdo de marketing do Instagram **não** entra no domínio do app (`User`/`Transaction`/`Contact`). Se um dia precisar de dados reais do produto (ex.: screenshot do Horizonte para o pilar P2), o script consome a API do bfin por `ApiKey` — o principal delegado `Agente` MCP (ADR-0003/0004) — sem acoplar repositórios.

**Evolução:** quando o conteúdo estabilizar e a postagem for 100% via API (Fase 2), o `bfin-instagram/` vira projeto dedicado.

## 11. Cadência

**4 feeds/semana + Story diário.** Traduz o mix (Reel 65 / Carrossel 20 / Story 15) em ritmo sustentável com criação automatizada:

- **Feed (4):** 3 Reels + 1 Carrossel. Dos 3 Reels: ~2 P1 (conceito/hooks) + 1 P3 (emocional); o Carrossel é P1 profundo. P2 (produto em ação) entra como Reel quinzenal no lugar de um P1.
- **Story (7/semana):** diário, leve — CTA com link sticker nos dias de feed + bastidores/conteúdo efêmero nos demais.
- **Por que 4 e não 3 (piso GTM) ou 5+:** criação via Claude remove o gargalo de produção que justificava o piso de 3; mas "retenção > aquisição" continua valendo — 5+ força ritmo e degrada qualidade. Reavaliação em **60 dias** por retenção > 50% e salvamentos, não alcance bruto.

## 12. Medição & experimentação (loop de aprendizado)

O funil de fundo já está coberto (UTM no signup, seção 2). O loop fecha o topo/meio e transforma métrica em decisão.

**Norte de métricas (3), uma por estágio — o que decide:**

| Métrica-mãe | Estágio | Responde | Fonte |
|---|---|---|---|
| **Retenção média do Reel** (watch %) | Conteúdo | hook segura? prende? | IG Insights (video_views, avg_watch_time) |
| **Salvamentos** (por post) | Valor | é útil demais pra perder? | IG Insights (`saved`) |
| **Signups por UTM** (por slug de post) | Negócio | trouxe lead real? | bfin-app (UTM no signup) |

**Alcance/impressões = diagnóstico, não norte.** Servem pra explicar *por que* uma métrica-mãe mudou. Curtidas rejeitadas como norte (não correlacionam com valor nem conversão).

**Atribuição:** cada post ganha **slug único** (`2026-07-reel-fixo-vs-variavel`) que vira `utm_campaign` — liga post a signup. Sem slug = sem aprendizado.

**Registro:** `bfin-instagram/content/experiments.md` (git), uma linha por post — data, pilar, formato, hook, gatilho-mãe, alcance, retenção%, salvamentos, shares, signups-UTM, hipótese, conclusão.

**Experimentação:** hipótese **pré-registrada** antes de postar; **uma variável por vez** (hook, gatilho, formato, pilar) entre posts comparáveis.

**Coleta (casa com a faseagem):**
- Fase A (manual): Insights do app IG (30s) + signups no bfin-app; anota no log. Leitura via `chrome-devtools` permitida (só leitura, baixo risco).
- Fase B (API): `GET /{media-id}/insights` da Graph API preenche o log automaticamente via script.

**Decisão:**
- A cada **2 semanas**: revisar o log, decidir continue / kill / escalar por formato, pilar e hook.
- Aos **60 dias**: reavaliação de canal inteiro (Instagram continua como Fase 1 ou pivot?).

---

## 13. Identidade da conta

- **Handle:** `@bfin.app` (preferencial). Fallback: `@bfin` → `@usebfin` → `@bfinbr`. Criação **manual** pelo dono (automação = risco de banimento da conta nova). Converter para **Business** na criação (libera Graph API + Insights).
- **Nome de exibição:** `bfin · finanças pessoais` (marca + palavra-chave pesquisável).
- **Bio:**
  > 📊 O app de finanças que não te trata como mau aluno.
  > Veja pra onde seu dinheiro vai — não só onde foi.
  > 👇 Começa aqui

  Link → `bfincont.com.br` (home; landing dedicada `/comecar` fica pra depois).
- **Foto de perfil:** símbolo do logo do bfin **isolado** sobre canvas branco, em **versão otimizada pra perfil** (≥320×320, quadrada, com respiro pra não ser cortada pelo círculo). Se o logo for símbolo simples, vai direto; se tiver texto fino que some em miniatura, isola só o símbolo/monograma. Requer o logo em vetor (SVG) — ver pendências.

## A definir (pendências)

- [x] Handle → `@bfin.app` (preferencial); fallback `@bfin` → `@usebfin` → `@bfinbr`
- [x] Nome de exibição → `bfin · finanças pessoais`
- [x] Bio aprovada; link → `bfincont.com.br`
- [x] Foto de perfil → símbolo do logo isolado sobre canvas branco, versão profile otimizada
- [x] Estado da conta IG → não existe; **criar do zero como Business**
- [ ] Obter o logo do bfin em **vetor (SVG)** — necessário pra foto de perfil otimizada e templates
- [x] Voz de marca → IA hiper-realista (humana), perfil calma-clara-próxima; provedor ElevenLabs; voice ID por teste A/B
- [x] Biblioteca de música → **Meta Sound Collection + Pixabay Music** (grátis, sem strike, uso comercial); catálogo curado em `bfin-instagram/templates/audio/`
- [ ] **Facebook Page** do bfin — necessária pra Fase B (Graph API)

## Histórico de revisões

- **2026-06-30** — v1 inicial. Canal, funil/lead e decisão faceless consolidados.
- **2026-06-30** — v2: pilares de conteúdo, voz (dor→gatilho), estética (ADR-0009), formatos, áudio, operação híbrida faseada, arquitetura `bfin-instagram/`, cadência, medição & experimentação.
