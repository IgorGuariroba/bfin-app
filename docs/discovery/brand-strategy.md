# Estratégia de Marca — bfin

Data: 2026-07-02 · Status: **Grilling concluído** (2026-07-02) — decisão fundacional e todas as lacunas ratificadas; 5 peças consolidadas.

Propósito deste doc: definir **quem a marca é**. É o documento-guia que o rebrand (ADR-0012) vai traduzir em identidade visual própria — por isso vive logo após o Discovery e antes da exploração de marca.

Fontes: `PRODUCT.md` (Brand Personality, Design Principles, Anti-references), `docs/discovery/{briefing,mood,personas,objetivos}.md`, `docs/strategy/instagram-channel.md` (§5 Tom de voz), ADRs 0008/0009/0012. **Aponta para as fontes, não copia** (regra anti-deriva do Discovery).

## Decisão fundacional (ratificada 2026-07-02)

**A marca deriva da filosofia/identidade; os gatilhos psicológicos são instrumento de canal, não a fonte.**

Justificativa: o critério de sucesso do rebrand é **distintividade** ("teste sem logo", ADR-0012). Distintividade vem de identidade, não de função de gatilho — qualquer concorrente pode ativar "aversão à perda", ninguém copia uma posição moral (recusar-se a culpar o usuário). Os 3 traços operacionais do Instagram sobrevivem, mas como **expressão** dos 4 pilares de personalidade, não como origem.

Inverte a hierarquia declarada em `instagram-channel.md:61` ("a voz deriva dos gatilhos... não é arquétipo"). O canal Instagram agora **desce** desta Brand Strategy; a re-hierarquização formal do doc do canal é tarefa pendente (lacuna 4).

---

## 1. Brand Core

### Propósito (ratificado 2026-07-02)
> Tirar o peso de saber sobre o próprio dinheiro.

### Missão (ratificada 2026-07-02)
> Dar ao brasileiro uma projeção honesta do saldo futuro e do gasto variável, com baixíssimo atrito, sem julgar como ele gasta.

### Visão (ratificada 2026-07-02)
> Um país onde a pergunta "posso gastar isso?" tem resposta em segundos e não dá medo.

### Valores (formalização dos 4 pilares + Design Principles)
1. **Clareza sem julgamento** — o número e a consequência, nunca a lição de moral. (Design Principle 1)
2. **O usuário é o agente** — a ferramenta orienta, nunca decide por ele nem o pune. ("previsão orienta, não pune")
3. **Atrito é inimigo** — segundos para lançar; toda fricção paga seu preço em valor. (Design Principle 5)
4. **Dado sobre ornamento** — hierarquia por número e respiro, nunca alarme visual gratuito. (Design Principle 2)
5. **Marca ≠ dinheiro** — cor de ação não significa saldo negativo. (Design Principle 4, ADR-0008)

## 2. Brand Positioning

Positioning statement (ratificado 2026-07-02):
> "Para o brasileiro que já tentou controlar o próprio dinheiro e abandonou por achar que a ferramenta cobrava mais do que entregava, o bfin é o app de finanças que mostra **para onde o dinheiro vai** — não só onde foi — sem transformar meta em culpa. Diferente de Mobills e Organizze, que cobram categorização rígida e tratam o usuário como inadimplente do próprio orçamento."

- **Categoria mental (ratificada):** "app de finanças pessoais" — mesma dos rivais. Não criar categoria nova (custo educativo proibitivo para solo founder). Diferenciação por **posição dentro** da categoria: o sub-segmento prospectivo e não-culposo. Âncora em `briefing.md`.
- **Frame competitivo:** retrospectivo (rivais) × prospectivo (bfin). `competitor-analysis.md`.

## 3. Value Proposition

**Primária (JTBD, de `PRODUCT.md`):**
> Enxergar o saldo futuro e o gasto variável sem o atrito de categorizar tudo nem a culpa de estourar orçamento.

Camadas:
- **Funcional:** projeção de saldo no tempo (Horizonte) + lançamento em segundos (UI / WhatsApp / agente MCP).
- **Emocional:** alívio de saber, sem o peso de ser julgado por saber.
- **Defensável:** prospectivo + não-culposo é a combinação que nenhum rival BR entrega (`competitor-analysis.md`).

## 4. Brand Personality

Os 4 pilares (ratificados no Discovery):
**Leveza sem culpa · Clareza · Confiança/calma · Esperteza/agilidade.**

**Arquétipo narrativo (ratificado 2026-07-02):** o bfin é o **Guia / Sábio-aliado** — o mentor que respeita a autonomia do herói (o usuário). Não o Herói (a marca não é protagonista da jornada do dinheiro), não o Bobo-da-corte (humor piadista quebraria confiança em tema sensível), não o Cuidador paternalista (cuidador adverte, e a filosofia rejeita advertência). O Guia dá clareza e sai do caminho.

> Nota: `instagram-channel.md:61` rejeitou **"arquétipo estético"** (adorno visual). Arquétipo **narrativo** (papel da marca na jornada) é coisa diferente; a rejeição ao arquétipo como mero enfeite visual se mantém.

**StoryBrand (ratificado):** o **usuário é o herói**; o bfin é o guia que entrega o plano (a projeção) e a ferramenta (lançamento de baixo atrito). A marca nunca rouba a agência.

## 5. Voice & Tone Guide

Reconcilia e transversaliza os 3 traços do `instagram-channel.md` com os 4 pilares do `PRODUCT.md`.

### Eixos de tom (calibragem por situação)
- **Claro ↔ Denso:** sempre claro; "concreto ao extremo".
- **Calmo ↔ Urgente:** quase sempre calmo; urgência só na consequência real prospectiva (zona-do-zero), nunca como tática de hook.
- **Próximo ↔ Institucional:** sempre próximo, humano, consumer — nunca bancário.

### Traços permanentes (atravessam toda superfície)
1. **Validadora, não juíza** — começa do lado do usuário. *(cobre "leveza sem culpa")*
2. **Concreta ao extremo** — número, exemplo, situação; nunca "controle suas finanças". *(cobre "clareza")*
3. **Prospectiva** — olha para onde vai, não para onde foi. *(cobre a proposta central)*

### É / Não é
| A marca fala assim | Nunca assim |
|---|---|
| "Seus próximos 3 meses no azul." | "Tome controle do seu dinheiro!" |
| "Você gastou R$800 em delivery. E agora?" | "Você gastou DEMAIS em delivery 😱" |
| "Lança em 5 segundos pelo Zap." | "Cadastre todas as suas categorias." |

### Aplicação por superfície
| Superfície | Calibragem | Origem |
|---|---|---|
| Produto (app) | Máximo calmo + claro; urgência só no Horizonte quando justificado | `PRODUCT.md`, `mood.md` |
| Instagram (aquisição) | Calma-clara-próxima; gatilhos (aversão à perda, validação) como **técnica de hook a serviço da identidade** | `instagram-channel.md`, re-hierarquizado |
| WhatsApp (bot/handoff) | Direta, curta, útil; espelha um aliado rápido | canais, `PRODUCT.md` |
| Suporte | Aliada; nunca culpa o usuário pelo próprio erro | Valor 1 |
| Landing / Blog | Prospectiva + concreta; sem jargão de contador | `briefing.md`, GTM |

### Voz falada (Reels/áudio)
Mantém o definido em `instagram-channel.md:99`: voz IA hiper-realista, perfil **calma-clara-próxima** (timbre médio/médio-grave, ritmo moderado, calor controlado). Animada/hype é contra-indicada. Deriva da personalidade calma/confiança, não é decisão isolada de canal.

---

## Status do grilling (concluído 2026-07-02)

Decisões ratificadas:
- **(a) Fundacional** — a marca deriva da filosofia/identidade; gatilhos psicológicos são instrumento de canal, não a fonte.
- **(b) Arquétipo narrativo** — Guia/Sábio-aliado (o usuário é o herói; o bfin entrega plano + ferramenta e sai do caminho).
- **(c) Posicionamento de categoria** — mesma categoria ("app de finanças pessoais"), diferenciação por **posição** (prospectivo + não-culposo).
- **(d) Brand Core** — Propósito refinado ("Tirar o peso de saber sobre o próprio dinheiro."); Missão e Visão ratificadas como estavam.
- **(e) Re-hierarquização** — o `instagram-channel.md` agora declara que a voz desce daqui.

**Próximo passo:** o rebrand propriamente dito (exploração de identidade visual própria) desce desta Brand Strategy + do [benchmark visual](./benchmark-visual.md) quando as capturas estiverem prontas.
