# 8. Design system do bfin: linguagem visual herdada do Airbnb, semântica de dinheiro desacoplada da marca

Data: 2026-06-29
Status: Aceito

## Contexto

O `DESIGN.md` da raiz nasceu como um spec **do Airbnb** (frontmatter `name: Airbnb`): documentava `property-card`, `search-orb`, `reservation-card` — componentes de marketplace de hospedagem que não existem no bfin. O que foi de fato adotado dele foram os **tokens de fundação** — a cor de marca Rausch (`#ff385c`), a escala de texto ink/body/muted, spacing e radius — todos cabeados no `globals.css` via Tailwind v4. A camada de componentes era ilustrativa, não um catálogo real.

Isso deixou o app numa situação contraditória:

- **Três vermelhos circulando sem token:** o Rausch da marca (CTA primário), o `error` (`#c13515`, validação) e o vermelho de "saldo negativo" — que em `saldo-cell.tsx` *era o próprio Rausch*, em `horizonte-grid.tsx` (claro) era `#b91c1c`, e no dark era `#fca5a5`. O mesmo conceito ("dinheiro no vermelho") renderizava em três cores diferentes conforme o arquivo.
- **`success`/`warning`/`info` inexistentes como token:** o código improvisava `green-500`, `amber-400`, `emerald-600`, `red-500` soltos (36 hex hardcoded, 315 valores `[..px]` arbitrários em TSX), violando a própria regra "nunca cor crua".
- **z-index ad-hoc:** `z-10/30/40/50` espalhados, com `bottom-nav`, floating actions e os overlays do Radix **todos empatados em `z-50`**, desempate só pela ordem de portal no DOM.
- **Dark mode contraditório:** `globals.css` tem um tema dark completo (`.dark`, ~45 linhas) servido por `next-themes` com toggle real em configurações — mas o DESIGN.md afirmava "Airbnb não tem dark mode", e os componentes de feature usavam cor crua de tema claro que **não vira** no escuro (`saldo-cell` quebrado, `horizonte` corrigido na mão).

## Decisão

1. **O `DESIGN.md` passa a descrever o bfin, não o Airbnb.** Os componentes de marketplace saem; entram os reais (saldos, horizonte, transactions). A proveniência Airbnb dos tokens de marca fica registrada como nota histórica, não como catálogo.

2. **Cor de dinheiro é escala semântica própria, desacoplada do Rausch.** O `#ff385c` volta a ser **só ação/marca** e sai do `saldo-cell`. Dinheiro no vermelho ganha cor própria — sem sobrecarregar "clique aqui" com "você está quebrado".

3. **Camada única `feedback.*` serve dinheiro E status genérico.** Um conjunto semântico (`positive` / `caution` / `negative` / `info`) com valor claro **e** escuro por token cobre tanto saldo quanto toast/badge/convite-ativo. Anula a duplicação de hex e os três vermelhos:

   | Token | Light (texto/bg) | Dark (texto/bg) |
   |---|---|---|
   | `feedback.positive` | `#15803d` / `#f0fdf4` | `#4ade80` / `#0a1f12` |
   | `feedback.caution` | `#b45309` / `#fffbeb` | `#fbbf24` / `#1c1500` |
   | `feedback.negative` | `#c13515` (reusa o `error`) / `#fef2f2` | `#f87171` / `#1f0a0a` |
   | `feedback.info` | `#2563eb` / `#eff6ff` | `#60a5fa` / `#0a1530` |

4. **z-index: escala custom 100-based, sobrescrevendo o `z-50` do Radix.** `z.sticky` 100 → `z.header` 200 → `z.nav` 300 → `z.scrim` 400 → `z.overlay` 500 → `z.toast` 600. Permite separar scrim de conteúdo (que o shadcn empata em `z-50`).

5. **Elevação: 3 tiers semânticos** — `elevation.card` (resting), `elevation.overlay` (dropdown/popover/sheet/dialog), `elevation.float` (FAB/banner). No dark, vira `ring`/borda sutil em vez de box-shadow.

6. **Dark mode é first-class, com token obrigatório como contrato.** Regra dura: componente **nunca** usa hex/cor crua, **sempre** token — que carrega claro+escuro. Os hardcoded existentes (`saldo-cell`, os 36 hex) são corrigidos para consumir token. Vira critério de revisão de PR.

7. **Heatmap do horizonte é camada `data-viz` à parte.** A rampa de magnitude (5 níveis de verde/vermelho por intensidade de saldo) é escala de visualização ancorada nos hues de `feedback.*`, não um token de feedback.

## Consequências

**Positivas:**
- Um conceito → uma cor: "dinheiro no vermelho" deixa de ter três renderizações.
- Dark mode passa a funcionar nas telas de feature de graça, porque o token carrega o valor escuro — o trabalho de `feedback.*` é o que conserta o dark.
- "Sempre token, nunca cor crua" vira regra enforçável que ataca os 36 hex / 315 px arbitrários.
- z-index e elevação param de depender de sorte de ordem de DOM.

**Negativas:**
- **Churn de refactor:** todo componente com cor crua precisa migrar para token; todo `z-50` em `src/components/ui/*.tsx` vira token e precisa ser reconferido a cada `npx shadcn@latest add` que sobrescreva o componente.
- **Briga contínua com o shadcn** no z-index (a lib hardcoda `z-50`).
- `motion`, `opacity` e o catálogo completo de componentes ficam marcados como "a definir" — o sistema não está 100% fechado.

## Alternativas descartadas

- **Manter o Rausch como negativo de dinheiro:** menos cores, mas sobrecarrega o tom da marca (CTA vira igual a alerta) e mantém a colisão visual.
- **Camadas separadas `money.*` e `feedback.*`:** semântica mais precisa, mas mais tokens para manter sem ganho real — saldo positivo e "operação deu certo" podem dividir o mesmo verde.
- **Ancorar z-index no `z-50` do shadcn** (tudo do app abaixo de 50): churn mínimo, mas abre mão de separar scrim de conteúdo e mantém o app refém do número mágico da lib.
- **Desligar o dark mode:** simplificaria, mas joga fora infra `next-themes` já pronta e funcional.
- **Aposentar o DESIGN.md** e tratar `globals.css` + shadcn como o sistema: perde a camada de *quando usar o quê* e a documentação dos componentes reais do bfin.
