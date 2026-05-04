# Tasks — bfin App

Cada task = entregável testável. Marque `[x]` quando done.

---

## T1 — Scaffold do projeto

**Entregável**: Projeto Next.js rodando em `localhost:3000` com página em branco.

- [ ] `npx create-next-app@latest` — App Router, TypeScript, Tailwind, ESLint
- [ ] `.env` com variáveis placeholder (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)
- [ ] `.gitignore` atualizado (node_modules, .env, .next)
- [ ] Commit inicial

**Verificação**: `npm run dev` → `localhost:3000` carrega sem erros.

---

## T2 — Docker + Prisma + Schema

**Entregável**: Banco PostgreSQL rodando, schema aplicado, Prisma Client gerado.

- [ ] `docker-compose.yml` com PostgreSQL 16 (porta 5432, volume persistente)
- [ ] `npm install prisma @prisma/client` + `npx prisma init`
- [ ] `prisma/schema.prisma` com models: `User`, `Account`, `Session`, `VerificationToken`, `Transaction`, `Tag`, `Previsao`
- [ ] `src/lib/prisma.ts` — singleton PrismaClient
- [ ] `npx prisma migrate dev --name init`
- [ ] Seed script com dados de exemplo (`prisma/seed.ts`)

**Verificação**: `docker compose up -d` → `npx prisma studio` mostra tabelas vazias.

---

## T3 — shadcn/ui + Tema bfin

**Entregável**: shadcn instalado com tema customizado do bfin (DESIGN.md).

- [ ] `npx shadcn@latest init` — estilo "new-york", cor base customizada
- [ ] `globals.css` com CSS vars mapeadas do DESIGN.md (Rausch, ink, muted, surfaces, hairlines)
- [ ] `tailwind.config.ts` com tokens de cor, radius, spacing do bfin
- [ ] Instalar componentes shadcn: `button input dialog sheet dropdown-menu badge progress separator toast select scroll-area popover card label`
- [ ] Font Inter configurada no layout

**Verificação**: Página de teste com Button primary → cor `#ff385c`, radius 8px, fonte Inter.

---

## T4 — Auth.js + Login screen

**Entregável**: Login funcional com Google OAuth + email/senha.

- [ ] `src/lib/auth.ts` — Auth.js config com Google + Credentials providers
- [ ] `src/app/api/auth/[...nextauth]/route.ts`
- [ ] `src/app/(auth)/layout.tsx` — layout sem bottom nav
- [ ] `src/app/(auth)/login/page.tsx` — tela login (logo bfin, Google button, email form, ilustração)
- [ ] `src/middleware.ts` — proteger rotas `(app)`, redirecionar não logados
- [ ] `src/app/page.tsx` — redirect para `/login` ou `/saldos`

**Verificação**: Login com Google redireciona para `/saldos`. Não logado → `/login`.

---

## T5 — App layout + Bottom nav

**Entregável**: Layout do app com navegação entre abas funcionando.

- [ ] `src/app/(app)/layout.tsx` — layout com bottom nav fixa
- [ ] `src/components/layout/bottom-nav.tsx` — 5 itens (Saldos, Totais, FAB+, Tags, Menu), active state com accent
- [ ] `src/components/layout/month-header.tsx` — ícone calendário, mês com arrows, grid icon
- [ ] `src/components/layout/back-header.tsx` — botão voltar + título + action
- [ ] `src/lib/constants.ts` — categorias, cores, labels (CAT_COLORS, CAT_LABELS, TYPE_LABELS_FULL)
- [ ] `src/lib/utils.ts` — formatadores (`fmt`, `fmtK`, `fmtH`)

**Verificação**: Navegar entre Saldos/Totais/Tags/Menu via bottom nav. FAB abre modal vazio.

---

## T6 — API Transactions CRUD

**Entregável**: API completa para criar, listar, editar e deletar transações.

- [ ] `src/app/api/transactions/route.ts` — GET (filtros: month, type, date range) + POST
- [ ] `src/app/api/transactions/[id]/route.ts` — PUT + DELETE
- [ ] Validação de input (zod ou manual)
- [ ] Lógica de repeat: ao criar com `repeat != none`, gerar transações futuras
- [ ] `src/hooks/use-transactions.ts` — hook client-side para fetch/mutate

**Verificação**: POST criar transação → GET lista com filtro → PUT edita → DELETE remove.

---

## T7 — Tela Saldos

**Entregável**: Grid diário com saldos acumulados, filtros, scroll to today.

- [ ] `src/app/(app)/saldos/page.tsx`
- [ ] `src/components/saldos/saldos-grid.tsx` — grid dia × categoria
- [ ] `src/components/saldos/day-row.tsx` — linha do dia com badges de categoria
- [ ] `src/components/saldos/saldo-cell.tsx` — célula colorida (green/amber/red/zero)
- [ ] Filtro dropdown por categoria (Todas, Entradas, Saídas, Diário, Cartão, Guardado)
- [ ] Scroll automático para o dia atual
- [ ] Clique em célula → abre detail ou add modal

**Verificação**: Ver grid de saldos do mês. Filtrar por "Entradas". Scroll para hoje.

---

## T8 — Add Transaction Modal

**Entregável**: Modal bottom sheet para adicionar transação com numpad.

- [ ] `src/components/transactions/quick-add-modal.tsx` — Sheet bottom com:
  - Campo valor com numpad customizado
  - Type selector (Entrada/Saída/Diário/Cartão/Guardado) com cores
  - Campo descrição
  - Campo data (date picker)
  - Opção "Repetir" (todo mês/semana/dia)
  - Opção "Até quando" (a perder de vista / número de vezes com stepper)
  - Campo tags
- [ ] `src/components/transactions/add-modal.tsx` — versão simplificada via FAB
- [ ] Integração com API (POST `/api/transactions`)
- [ ] Toast de confirmação

**Verificação**: FAB+ → modal abre → preencher valor → selecionar tipo → submit → transação aparece.

---

## T9 — API Saldos + Totais

**Entregável**: APIs que calculam saldos diários e totais mensais.

- [ ] `src/app/api/saldos/route.ts` — GET saldos diários de um mês (entrada, saída, diário, cartão, economia, saldo acumulado por dia)
- [ ] `src/app/api/totais/route.ts` — GET totais calculados (entradas, saídas, diários, economias, cartão, performance, custoVida, diarioMedio, diarioPrev)
- [ ] `src/hooks/use-month.ts` — hook para mês selecionado + navegação

**Verificação**: GET `/api/saldos?month=2026-05` → array de saldos diários. GET `/api/totais?month=2026-05` → totais calculados.

---

## T10 — Tela Totais

**Entregável**: Tela de totais mensais com métricas e lista de movimentações.

- [ ] `src/app/(app)/totais/page.tsx`
- [ ] `src/components/totais/metric-row.tsx` — linha de métrica com badges e valor
- [ ] `src/components/totais/movimentacao-item.tsx` — item clicável com ícone de categoria
- [ ] Seções: Performance, Economizado (com progress bar), Custo de vida, Diário médio
- [ ] Lista de movimentações com link para detalhes por categoria
- [ ] "Ver todas" no final

**Verificação**: Ver totais do mês. Clicar em "Entradas" → navega para detalhes.

---

## T11 — Movimentações Detalhes

**Entregável**: Tela de detalhes por categoria com lista de transações.

- [ ] `src/app/(app)/movimentacoes/[tipo]/page.tsx`
- [ ] Header com back + navegação de mês
- [ ] Filtro dropdown de categoria
- [ ] Lista de transações com ícone, descrição, valor, data
- [ ] Empty state quando não há lançamentos

**Verificação**: Totais → clicar "Entradas" → lista de entradas do mês. Filtrar por "Cartão".

---

## T12 — Day Detail

**Entregável**: Detalhe do dia com transações e navegação entre dias.

- [ ] `src/components/transactions/day-detail.tsx`
- [ ] Header com back + navegação dia anterior/seguinte + botão add
- [ ] Filtro dropdown por tipo
- [ ] Lista de transações do dia
- [ ] Empty state com botão "adicionar"

**Verificação**: Saldos → clicar no dia 4 → ver transações. Navegar dia 3 e dia 5.

---

## T13 — Horizonte de Saldos

**Entregável**: Grid multi-mês com projeção de saldos, swipe horizontal.

- [ ] `src/app/(app)/horizonte/page.tsx`
- [ ] `src/components/horizonte/horizonte-grid.tsx`
- [ ] Grid 3 meses lado a lado com scroll vertical por dia
- [ ] Células coloridas por saldo (green/amber/red)
- [ ] Destaque "today" em fundo ink
- [ ] Swipe horizontal (touch + mouse) para trocar conjunto de meses
- [ ] Headers de mês com navegação

**Verificação**: Ver 3 meses. Swipe para esquerda → próximos 3 meses. Scroll vertical por dia.

---

## T14 — Previsão de Diário

**Entregável**: Lista de gastos mensais previstos + cálculo do diário.

- [ ] `src/app/(app)/previsao/page.tsx`
- [ ] `src/components/previsao/swipeable-item.tsx` — item com swipe-to-delete
- [ ] `src/components/previsao/previsao-form.tsx` — form adicionar/editar gasto
- [ ] API: `src/app/api/previsao/route.ts` + `[id]/route.ts`
- [ ] Footer com total mensal, seletor de dias (28/30/31), cálculo do diário
- [ ] Empty state com botão adicionar

**Verificação**: Adicionar "Combustível R$400" → total atualiza. Swipe item → botão excluir. Diário calculado.

---

## T15 — Menu + Perfil

**Entregável**: Tela de menu com perfil e links.

- [ ] `src/app/(app)/menu/page.tsx`
- [ ] Card de perfil (nome, email, badge "Assinatura ativa")
- [ ] Lista de opções: Editar perfil, Previsão de diário, Configurações, Sugestões, Ajuda
- [ ] Logout
- [ ] Link para Previsão de Diário funcional

**Verificação**: Menu → ver perfil. Clicar "Previsão de diário" → navega. Logout → volta login.

---

## T16 — Tags

**Entregável**: CRUD de tags com associação a transações.

- [ ] `src/app/(app)/tags/page.tsx`
- [ ] API: `src/app/api/tags/route.ts` + `[id]/route.ts`
- [ ] Lista de tags com cor e nome
- [ ] Form criar/editar tag (nome + cor)
- [ ] Delete tag
- [ ] Tags visíveis no add transaction modal
- [ ] Filtro por tag nas listagens

**Verificação**: Criar tag "Alimentação" cor verde. Associar a transação. Filtrar por tag.

---

## T17 — PWA

**Entregável**: App instalável no mobile, funcionando offline básico.

- [ ] `src/app/manifest.ts` — name, icons, theme_color, display standalone
- [ ] Icons PWA (192px, 512px) em `public/icons/`
- [ ] Service worker básico para cache de assets
- [ ] Meta tags no layout (viewport, theme-color, apple-touch-icon)
- [ ] `next.config.js` com headers para service worker

**Verificação**: No Chrome mobile → "Add to Home Screen". App abre standalone. Offline → cache funciona.

---

## Dependências

```
T1 ─→ T2 ─→ T3 ─→ T4 ─→ T5
                         ↓
                    T6 (API transactions)
                    ↓
              T7 (Saldos) ← T9 (API saldos/totais)
              ↓               ↓
         T8 (Add modal)  T10 (Totais)
                         ↓
                    T11 (Movimentações)
                    ↓
              T12 (Day Detail)
              T13 (Horizonte)
              T14 (Previsão)
              T15 (Menu)
              T16 (Tags)
              T17 (PWA — pode rodar em paralelo)
```

---

## Estimativa de esforço

| Task | Complexidade | Depende de |
|------|-------------|------------|
| T1   | Baixa       | —          |
| T2   | Baixa       | T1         |
| T3   | Média       | T1         |
| T4   | Média       | T2, T3     |
| T5   | Média       | T3         |
| T6   | Média       | T2, T5     |
| T7   | Alta        | T5, T6, T9 |
| T8   | Alta        | T6, T5     |
| T9   | Média       | T6         |
| T10  | Média       | T9, T5     |
| T11  | Baixa       | T10        |
| T12  | Média       | T7, T6     |
| T13  | Alta        | T9         |
| T14  | Média       | T5         |
| T15  | Baixa       | T5         |
| T16  | Média       | T6         |
| T17  | Baixa       | T1         |
