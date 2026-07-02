# Mood inicial — bfin

Data: 2026-07-02 · Fontes: `PRODUCT.md` (Brand Personality, Anti-references), `DESIGN.md`, ADR-0009.
Status: **baseline a desafiar** — decidido no grilling de 2026-07-02 que o Discovery alimenta um **rebrand completo**. A *filosofia* abaixo (personalidade, anti-mood, marca ≠ dinheiro) é sagrada e atravessa o rebrand; as *âncoras visuais concretas* (Rausch, herança Airbnb) são exatamente o que o rebrand vai substituir por ativo próprio.

## Personalidade (4 pilares)

**Leveza sem culpa · Clareza · Confiança/calma · Esperteza/agilidade.**

O bfin é o oposto do app que pune: mostra o número e a consequência, confia no usuário para decidir. Esperto no que respeita o tempo (lançar em segundos), calmo no que comunica (dado e espaço, não alarme).

## Palavras-mood

| É | Não é |
|---|---|
| leve, arejado, respiro | denso, dashboard-parede |
| quente, humano, consumer | institucional, bancário, enterprise |
| calmo, honesto, direto | alarmista, moralista, culposo |
| número como protagonista | ornamento, efeito, neon |
| suave (cantos, pesos 500-600) | quina dura, bold gritado |

## Âncoras visuais

- **Referência-mãe**: design system do Airbnb — Rausch `#ff385c` como único acento de marca, neutros ink/body/muted, canvas branco, raio suave (proveniência declarada no `DESIGN.md`).
- **Hero tipográfico-numérico** (feed/marketing): tipografia gigante + número concreto + gráfico mínimo sobre canvas branco — sem stock photography financeiro (ADR-0009).
- **Dinheiro tem cor própria, marca tem outra**: semântica financeira em `feedback.*` (verde contido, âmbar zona-do-zero, vermelho "sério" `#c13515`); Rausch nunca significa saldo negativo (ADR-0008).
- **Dark mode como cidadão de primeira classe**, não filtro invertido.

## Anti-mood (o que rejeitar ativamente)

- **Fintech "navy + dourado + gráfico de pizza"** — seriedade vem da clareza do dado, não de paleta institucional.
- **Gamificação de culpa** — streaks, troféus, "você falhou hoje".
- **Estética viral de Reels** (fundo escuro/neon/bold) — trocaria alcance por quebra de continuidade entre feed e produto (trade-off aceito no ADR-0009).
- **Alarme visual gratuito** — a zona-do-zero informa com âmbar e contexto, não grita.

## Sensação-alvo em uma frase

> Abrir o bfin deve dar a sensação de abrir a cortina num quarto arrumado — luz, clareza e a informação de que você precisa — nunca a de receber a visita de um cobrador.
