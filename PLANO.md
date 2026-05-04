# Plano: bfin App - Controle Financeiro

## Contexto

Converter prototype HTML (React inline) em app Next.js production-ready.
App financeiro pessoal com controle de saldos diários, totais mensais, horizonte de saldos, previsão de diário, tags e movimentações.

**Stack**: Next.js 14 (App Router) + shadcn/ui + Prisma + PostgreSQL (Docker) + Auth.js + PWA

**Prototype de referência**: `/home/movida/Downloads/bfin/bfin.html` — App React inline com todas as telas e interações. Fonte de verdade visual para layout, cores, espaçamento e comportamentos.

**Guia de design**: `DESIGN.md` — Design system estilo Airbnb (Rausch, Cereal VF, shapes soft).

**Estratégia de componentes**: Todos componentes UI construídos sobre shadcn/ui primitives. Usar MCP (Model Context Protocol) para auxiliar na construção dos componentes shadcn — consultas de API, referências de componentes, best practices em tempo real.

---

## Componentes shadcn/ui → Mapeamento

Cada componente customizado do prototype será construído sobre primitives do shadcn:

| Componente bfin           | Base shadcn                    | MCP uso                                      |
|---------------------------|--------------------------------|----------------------------------------------|
| `bottom-nav`              | `Button` + custom nav          | Consultar variantes de Button, exemplos de nav|
| `month-header`            | `Button` + `Popover`           | Popup de calendário, arrows navigation       |
| `back-header`             | `Button`                       | Ícone de voltar, action buttons              |
| `add-modal`               | `Sheet` (bottom) + `Input`     | Sheet slide-up, numpad, form fields          |
| `quick-add-modal`         | `Sheet` + `DropdownMenu`       | Type selector dropdown, bottom sheet         |
| `day-detail`              | `ScrollArea` + `DropdownMenu`  | Lista scrollável, filtro tipo                |
| `transaction-item`        | `Badge` + custom               | Badge de categoria, layout item              |
| `saldos-grid`             | `ScrollArea` + custom          | Grid diário, scroll to today                 |
| `saldo-cell`              | Custom (color-coded)           | Consultar padrões de cor condicional         |
| `metric-row`              | `Progress` + `Badge`           | Barra de progresso, badges de categoria      |
| `movimentacao-item`       | `Badge` + `Button`             | Item clicável com ícone e valor              |
| `horizonte-grid`          | `ScrollArea` + custom          | Grid multi-mês, swipe, células coloridas     |
| `swipeable-item`          | Custom (touch gestures)        | Consultar padrões de swipe no shadcn         |
| `previsao-form`           | `Sheet` + `Input`              | Form de adicionar/editar gasto               |
| `login-form`              | `Button` + `Input` + `Card`    | Google button, email input, card layout      |
| `filter-pill`             | `DropdownMenu` + `Badge`       | Dropdown de filtro com badge de categoria    |

### Componentes shadcn a instalar

```bash
npx shadcn@latest add button input dialog sheet dropdown-menu badge progress separator toast select scroll-area popover card label
```

### Fluxo MCP durante construção

Para cada componente:
1. Consultar MCP pela referência do componente shadcn base (props, variants, exemplos)
2. Construir componente customizado estendendo o primitive shadcn
3. Validar acessibilidade e responsividade via MCP
4. Garantir consistência com tema bfin (CSS vars customizados)

---

## Estrutura do Projeto

```
bfin-app/
├── docker-compose.yml          # PostgreSQL container
├── prisma/
│   └── schema.prisma           # DB schema
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (PWA meta, providers)
│   │   ├── page.tsx            # Redirect to /login or /dashboard
│   │   ├── globals.css         # Tailwind + CSS vars (bfin theme)
│   │   ├── manifest.ts         # PWA manifest
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx  # Login screen
│   │   │   └── layout.tsx      # Auth layout (no bottom nav)
│   │   ├── (app)/
│   │   │   ├── layout.tsx      # App layout (bottom nav, header)
│   │   │   ├── saldos/page.tsx # Saldos screen
│   │   │   ├── totais/page.tsx # Totais screen
│   │   │   ├── tags/page.tsx   # Tags screen
│   │   │   ├── menu/page.tsx   # Menu screen
│   │   │   ├── horizonte/page.tsx
│   │   │   ├── previsao/page.tsx
│   │   │   └── movimentacoes/[tipo]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── transactions/
│   │       │   ├── route.ts          # GET list, POST create
│   │       │   └── [id]/route.ts     # PUT, DELETE
│   │       ├── saldos/route.ts       # GET daily balances
│   │       ├── totais/route.ts       # GET monthly totals
│   │       ├── horizonte/route.ts    # GET multi-month projection
│   │       ├── previsao/route.ts     # CRUD previsão items
│   │       └── tags/route.ts         # CRUD tags
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── layout/
│   │   │   ├── bottom-nav.tsx
│   │   │   ├── month-header.tsx
│   │   │   └── back-header.tsx
│   │   ├── saldos/
│   │   │   ├── saldos-grid.tsx
│   │   │   ├── day-row.tsx
│   │   │   └── saldo-cell.tsx
│   │   ├── transactions/
│   │   │   ├── add-modal.tsx
│   │   │   ├── quick-add-modal.tsx
│   │   │   ├── day-detail.tsx
│   │   │   └── transaction-item.tsx
│   │   ├── totais/
│   │   │   ├── metric-row.tsx
│   │   │   └── movimentacao-item.tsx
│   │   ├── horizonte/
│   │   │   └── horizonte-grid.tsx
│   │   ├── previsao/
│   │   │   ├── swipeable-item.tsx
│   │   │   └── previsao-form.tsx
│   │   └── auth/
│   │       └── login-form.tsx
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   ├── auth.ts              # Auth.js config
│   │   ├── utils.ts             # Formatters (fmt, fmtK)
│   │   └── constants.ts         # Colors, labels, categories
│   └── hooks/
│       ├── use-month.ts
│       └── use-transactions.ts
├── public/
│   ├── icons/                   # PWA icons
│   └── sw.js                    # Service worker
├── next.config.js
├── tailwind.config.ts
├── package.json
└── .env                         # DATABASE_URL, AUTH_SECRET
```

---

## Schema Prisma

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  transactions  Transaction[]
  previsoes     Previsao[]
  tags          Tag[]
}

model Account { ... }  // NextAuth padrão
model Session { ... }  // NextAuth padrão
model VerificationToken { ... }  // NextAuth padrão

model Transaction {
  id          String   @id @default(cuid())
  userId      String
  type        String   // entrada, saida, diario, cartao, economia
  description String
  amount      Float
  date        DateTime
  repeat      String   @default("none") // none, monthly, weekly, daily
  repeatEnd   String   @default("forever") // forever, count
  repeatCount Int      @default(0)
  tagIds      String[] // tag IDs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  tags        Tag[]

  @@index([userId, date])
  @@index([userId, type])
}

model Tag {
  id        String   @id @default(cuid())
  userId    String
  name      String
  color     String
  user      User     @relation(fields: [userId], references: [id])
  transactions Transaction[]

  @@unique([userId, name])
}

model Previsao {
  id        String   @id @default(cuid())
  userId    String
  name      String
  amount    Float
  user      User     @relation(fields: [userId], references: [id])
}
```

---

## Guia de Design

**Referência**: `DESIGN.md` — Design system estilo Airbnb adaptado para fintech.

**Princípios do guia**:
- Canvas branco puro (`#ffffff`) com texto ink (`#222222`)
- Cor primária Rausch (`#ff385c`) usada com moderação — maioria das telas é 90% branco + ink
- Shape language soft: botões 8px radius, cards 14px, search pill 9999px, sem cantos duros
- Tipografia modesta (weights 500-600), confia em whitespace e não em peso tipográfico
- Um único tier de shadow: `rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px`
- Touch targets mínimo 48x48px (WCAG AAA)
- Spacing base 4px, major sections 64px

### Fonte
- **Primária**: Airbnb Cereal VF (se disponível) ou **Inter** como substituto open-source
- **Fallback**: Circular, -apple-system, system-ui, Roboto, sans-serif

### Mapeamento DESIGN.md → bfin CSS vars / Tailwind

| DESIGN.md Token           | Valor         | Uso no bfin                           |
|---------------------------|---------------|---------------------------------------|
| `colors.primary`          | `#ff385c`     | accent, FAB, CTAs, saídas             |
| `colors.primary-active`   | `#e00b41`     | hover/active em CTAs                  |
| `colors.primary-disabled` | `#ffd1da`     | CTAs desabilitados                    |
| `colors.luxe`             | `#460479`     | Categoria cartão (purple)             |
| `colors.plus`             | `#92174d`     | Categoria diário (pink)               |
| `colors.ink`              | `#222222`     | Texto principal                       |
| `colors.muted`            | `#6a6a6a`     | Labels, subtítulos                    |
| `colors.muted-soft`       | `#929292`     | Placeholders, texto disabled          |
| `colors.canvas`           | `#ffffff`     | Background principal                  |
| `colors.surface-soft`     | `#f7f7f7`     | Background sections, hover            |
| `colors.surface-strong`   | `#f2f2f2`     | Icon buttons, surfaces pesadas        |
| `colors.hairline`         | `#dddddd`     | Bordas, dividers                      |
| `colors.hairline-soft`    | `#ebebeb`     | Separadores leves                     |
| `rounded.sm`              | `8px`         | Botões, inputs                        |
| `rounded.md`              | `14px`        | Cards, modais                         |
| `rounded.full`            | `9999px`      | Pills, badges, avatares, FAB          |
| `colors.on-primary`       | `#ffffff`     | Texto sobre Rausch                    |
| `colors.primary-error`    | `#c13515`     | Texto de erro                         |
| `colors.star-rating`      | `#222222`     | Mantido ink (não amarelo)             |

### Tipografia no bfin (baseado DESIGN.md)

| Uso bfin           | Token DESIGN.md        | Size | Weight |
|--------------------|------------------------|------|--------|
| Logo "bfin"        | display-xl             | 28px | 700    |
| Header mês         | display-sm             | 20px | 600    |
| Modal valor        | display-lg             | 22px | 500    |
| Nomes de tela      | title-md               | 16px | 600    |
| Valores/descrição  | body-md                | 16px | 400    |
| Category labels    | body-sm                | 14px | 400    |
| Badges categoria   | badge                  | 11px | 600    |
| Micro labels       | micro-label            | 12px | 700    |
| Button labels      | button-md              | 16px | 500    |

### Cores semânticas bfin (não no DESIGN.md)

| Token     | Cor       | Uso                    |
|-----------|-----------|------------------------|
| green     | `#2db55d` | Entradas, guardado     |
| green-bg  | `#e8f7ef` | Background entradas    |
| red       | `#c13515` | Saldos negativos       |
| red-bg    | `#fde8e8` | Background negativo    |
| amber     | `#c17a00` | Alertas, saldos baixos |
| amber-bg  | `#fef3c7` | Background amber       |
| green-saldo | `#bbf7d0` | Saldo positivo cell   |
| red-saldo | `#fecaca` | Saldo negativo cell    |

---

## Fases de Implementação

### Fase 1: Setup base
1. `npx create-next-app@latest` — App Router, TypeScript, Tailwind, ESLint
2. Instalar shadcn/ui (`npx shadcn@latest init`) com tema customizado
3. Instalar shadcn components: button, input, dialog, sheet, dropdown-menu, badge, progress, separator, toast, select, scroll-area
4. Criar `docker-compose.yml` com PostgreSQL 16
5. Configurar Prisma, criar schema, rodar migração
6. Configurar Auth.js com Google + Credentials providers
7. Criar `.env` com `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_*`

### Fase 2: Layout e navegação
1. Root layout com providers (SessionProvider, PWA meta tags)
2. Auth layout (sem bottom nav)
3. App layout com bottom nav (Saldos, Totais, FAB+, Tags, Menu)
4. Month header component
5. Back header component (sub-screens)

### Fase 3: Auth
1. Tela login (Google button + email form)
2. Auth.js config com Google + Credentials
3. Middleware protegendo rotas `(app)`

### Fase 4: Core features
1. **Saldos** — Grid diário com saldo acumulado, filtro por categoria, scroll to today
2. **Add Transaction** — Modal bottom sheet com numpad, type selector, descrição, data, repetir
3. **Totais** — Performance, economizado, custo de vida, diário médio, lista movimentações
4. **Movimentações detalhes** — Lista por categoria com filtro
5. **Day Detail** — Transações do dia com navegação entre dias
6. **Horizonte de Saldos** — Grid multi-mês com swipe horizontal
7. **Previsão de Diário** — Lista de gastos mensais + cálculo diário, swipe-to-delete
8. **Menu** — Perfil, configurações, links
9. **Tags** — CRUD de tags, associação com transações

### Fase 5: PWA
1. `manifest.ts` com icons, name, theme_color
2. Service worker para offline caching
3. Meta tags PWA no layout

---

## API Routes

| Rota                     | Métodos | Descrição                              |
|--------------------------|---------|----------------------------------------|
| `/api/transactions`      | GET/POST| Listar (com filtros) / Criar           |
| `/api/transactions/[id]` | PUT/DEL | Atualizar / Deletar                    |
| `/api/saldos`            | GET     | Saldos diários de um mês               |
| `/api/totais`            | GET     | Totais calculados do mês               |
| `/api/horizonte`         | GET     | Projeção multi-mês                     |
| `/api/previsao`          | GET/POST| Listar / Criar itens de previsão       |
| `/api/previsao/[id]`     | PUT/DEL | Atualizar / Deletar previsão           |
| `/api/tags`              | GET/POST| Listar / Criar tags                    |
| `/api/tags/[id]`         | PUT/DEL | Atualizar / Deletar tag                |

---

## Ordem de Execução (steps concretos)

1. Setup Next.js + deps (docker, prisma, auth, shadcn)
2. DB schema + migração
3. Auth config + login page
4. App layout + bottom nav
5. API: transactions CRUD
6. Saldos screen
7. Add transaction modal
8. API: totais/saldos calculations
9. Totais screen
10. Movimentações detalhes
11. Day detail
12. Horizonte de saldos
13. Previsão de diário
14. Menu + Tags
15. PWA config

---

## Verificação

1. `docker compose up -d` → PostgreSQL rodando
2. `npx prisma migrate dev` → Schema aplicado
3. `npm run dev` → App no ar em localhost:3000
4. Login com Google funciona
5. CRUD transações funciona
6. Saldos calculados corretamente
7. Totais batem com dados
8. Horizonte mostra projeção multi-mês
9. PWA instalável no mobile
