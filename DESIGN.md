# DESIGN.md — bfin

> Fonte de verdade visual e de interação do **bfin** (app de finanças pessoais, Next.js + Tailwind v4 + shadcn/ui).
> A implementação dos tokens vive no `src/app/globals.css` (`@theme inline` + `:root` + `.dark`). Este documento é o **porquê** e o **quando usar** — o CSS é o **como**.
>
> Proveniência: a paleta de marca, a escala de texto, spacing e radius foram herdadas do design system do **Airbnb** (Rausch `#ff385c`, neutros ink/body/muted, raio suave). A semântica de dinheiro foi depois **desacoplada da marca** — ver [ADR-0008](docs/adr/0008-design-system-feedback-tokens.md).

---

## 1. Regra de ouro

**Componente nunca usa cor/valor crus — sempre token.** Sem `bg-[#2db55d]`, sem `green-500`, sem `z-50` solto. O token carrega o valor claro **e** escuro; usar o token é o que faz o dark mode funcionar (§7). Cor crua em PR é apontamento de revisão.

Ordem de decisão diante de uma dúvida de design:
1. já existe token/regra aqui? → use.
2. já existe componente equivalente? → reuse.
3. prefira consistência a criatividade isolada.
4. sem regra: resolva pensando em reuso, semântica e dark, e **documente aqui**.

---

## 2. Marca

| Token (CSS var) | Valor | Uso |
|---|---|---|
| `--rausch` | `#ff385c` | **Só ação/marca**: CTA primário, foco/ring, links de marca. Nunca como "negativo de dinheiro". |
| `--rausch-active` | `#e00b41` | Press do CTA primário. |
| `--rausch-disabled` | `#ffd1da` | CTA desabilitado. |
| `--luxe` | `#460479` | Acento sub-marca (raro). |
| `--plus` | `#92174d` | Acento sub-marca (raro). |

`--ring` e `--primary` mapeiam para Rausch.

## 3. Texto, superfície, borda

São os neutros já cabeados no `globals.css`:

- **Texto:** `--ink` (`#222`, títulos/corpo) · `--body-text` (`#3f3f3f`) · `--muted-text` (`#595959`) · `--muted-soft` (`#929292`) · `--on-primary` (`#fff`, sobre Rausch).
- **Superfície:** `--canvas` (`#fff`, fundo) · `--surface-soft` (`#f7f7f7`) · `--surface-strong` (`#f2f2f2`).
- **Borda:** `--hairline` (`#ddd`, padrão) · `--hairline-soft` (`#ebebeb`) · `--border-strong` (`#c1c1c1`).

## 4. Feedback (semântica — dinheiro **e** status)

Camada única `feedback.*` que serve tanto valores financeiros (saldo) quanto estado de UI (toast, badge, convite). Desacoplada do Rausch. **Já definida no `globals.css`** — uso: texto `text-feedback-positive`, fundo `bg-feedback-positive-surface` (idem caution/negative/info). Migrar o código que ainda improvisa `green-500`/`amber-400`/`red-500`:

| Token | Papel | Light (texto / bg) | Dark (texto / bg) |
|---|---|---|---|
| `feedback.positive` | saldo+, sucesso, ativo | `#15803d` / `#f0fdf4` | `#4ade80` / `#0a1f12` |
| `feedback.caution` | zona-do-zero, warning | `#b45309` / `#fffbeb` | `#fbbf24` / `#1c1500` |
| `feedback.negative` | saldo−, erro de validação | `#c13515` (= `--error`) / `#fef2f2` | `#f87171` / `#1f0a0a` |
| `feedback.info` | aviso neutro | `#2563eb` / `#eff6ff` | `#60a5fa` / `#0a1530` |

Notas:
- `feedback.negative` **reusa** o `--error` (`#c13515`) — um vermelho "sério" só, distinto do Rausch.
- A faixa `caution` é real: representa "saldo dentro de ~R$200 do zero" (limiar de negócio hoje duplicado e sem nome em `saldo-cell.tsx` e `horizonte-grid.tsx` — extrair para constante nomeada).
- **A migrar:** `saldo-cell.tsx` (usa Rausch como negativo + `#2db55d` reprovado em contraste AA) → `feedback.*`.

## 5. Data-viz (heatmap do horizonte) · camada à parte

O `horizonte-grid` pinta saldo por **magnitude** (rampa de 5 níveis de vermelho para negativo, 3 de verde para positivo, âmbar para zero), em claro e dark. É escala de **visualização**, ancorada nos hues de `feedback.*` mas com gradação de intensidade — **não** é token de feedback. Documentar como `data-viz.*` quando for tokenizada; por ora vive nas funções `cellColor`.

## 6. Tipografia

Fonte real: **Inter** (`--font-inter`, sans + heading) e **Geist Mono** (`--font-geist-mono`, dados/código). A escala foi derivada do Airbnb Cereal — Inter é a substituta declarada (ajustar line-height de display ~2% mais apertado). Escala (size / weight / line-height): `display` 28/700/1.43 · `display-lg` 22/500 · `title` 16/600 · `body-md` 16/400/1.5 · `body-sm` 14/400 · `caption` 14/500 · `badge` 11/600. Pesos de display ficam **modestos** (500–600) — o sistema confia em espaço e dado, não em peso tipográfico.

## 7. Dark mode · first-class

Suportado de 1ª classe via `next-themes` (toggle em `configuracoes`), `.dark` no `globals.css` re-mapeia todos os tokens. **Contrato:** componente que usa token herda dark de graça; componente com cor crua **quebra** no escuro. Por isso a regra de ouro (§1). Sombra quase não aparece no escuro → elevação vira `ring`/borda (§9).

## 8. Spacing & Radius

- **Spacing** (base 4px): `xxs` 2 · `xs` 4 · `sm` 8 · `md` 12 · `base` 16 · `lg` 24 · `xl` 32 · `xxl` 48 · `section` 64.
- **Radius** (base `--radius` = 8px): `sm` ·`md` · `lg` · `xl` · `2xl` · `3xl` · `full`. Tudo arredondado; canto duro só na grid.

## 9. Elevação · 3 tiers semânticos

| Token | Uso | Light | Dark |
|---|---|---|---|
| `shadow-card` | card resting | sombra sutil | `ring-1 ring-foreground/10` |
| `shadow-overlay` | dropdown, popover, sheet, dialog | sombra média | ring + borda |
| `shadow-float` | FAB (WhatsApp), banner | sombra forte | ring + borda |

Definido no `globals.css` via namespace `--shadow-*` (Tailwind v4) → utilitários `shadow-card/overlay/float`. Substitui o uso livre de `shadow-sm/md/lg/xl`.

## 10. z-index · escala custom 100-based

Sobrescreve o `z-50` do Radix. **Tailwind v4 não tem namespace `--z-index-*`** — os tokens são CSS vars no `:root` e o uso é via `z-[var(--z-nav)]` (não há utilitário `z-nav`).

| Token | z | Aplicar em |
|---|---|---|
| `z.sticky` | 100 | headers de seção sticky |
| `z.header` | 200 | chrome do app (month/back/admin header) |
| `z.nav` | 300 | bottom-nav, floating actions |
| `z.scrim` | 400 | `DialogOverlay` / `SheetOverlay` |
| `z.overlay` | 500 | `DialogContent` / `Sheet` / dropdown / popover / select |
| `z.toast` | 600 | sonner |

Custo assumido: cada `z-50` em `src/components/ui/*.tsx` vira token e deve ser reconferido após `npx shadcn@latest add`.

## 11. Componentes reais do bfin

Primitivos shadcn (`src/components/ui/`): button, input, label, select, switch, badge, card, dialog, sheet, popover, dropdown-menu, table, skeleton, progress, scroll-area, separator, sonner. Já consomem token + têm variantes `dark:`.

Componentes de domínio a documentar (objetivo / quando usar / estados / a11y):
- **saldo-cell**, **day-row** (saldos) — badge de saldo por `feedback.*`.
- **horizonte-grid** — heatmap data-viz.
- **movimentacao-item**, **day-detail**, **edit-transaction-modal** (transactions).
- **bottom-nav**, **back-header**, **month-header**, **delegated-account-banner** (layout/chrome).
- **pro-upsell-sheet**, **assistente-panel**.

## 12. Gaps abertos (a definir)

- **Migrar componentes para os tokens** — `feedback.*`, `shadow-*` e `--z-*` já existem no CSS, mas `saldo-cell`, os 36 hex e os `z-50`/`shadow-*` soltos ainda não consomem.
- **Motion** — sem tokens (duração/easing, `prefers-reduced-motion`). `tw-animate-css` presente, não padronizado.
- **Opacity** — sem escala (disabled/scrim/loading).
- **Catálogo de componentes** §11 — só listado, falta a doc por componente (estados, a11y, anti-patterns).
- **Constante do limiar `caution`** (~R$200) — duplicada e sem nome.

---

> Fronteira: decisões de domínio (o que é uma Transaction, Previsão etc.) vivem no `CONTEXT.md`. Este arquivo é **só** visual/interação.
