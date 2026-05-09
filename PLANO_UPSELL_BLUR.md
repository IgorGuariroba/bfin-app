# Plano: Upsell com Blur em Meses Bloqueados

## Objetivo

Meses além do limite free mostram conteúdo fake com blur overlay. Clique no overlay abre bottom sheet de upsell com CTA para `/assinar`. Backend já retorna 403 — o fake é só conversão.

## Princípios

- Dado real nunca chega ao cliente em meses bloqueados (backend 403)
- Blur é gatilho de conversão, não segurança
- Fake data deve parecer plausível (shape realista, não zeros)
- Mensagem contextual por tela — não genérica

---

## Componente compartilhado: `ProUpsellSheet`

**Arquivo:** `src/components/plan/pro-upsell-sheet.tsx`

Bottom sheet reutilizável por todas as telas.

```
Props:
  open: boolean
  onClose: () => void
  context: "saldos" | "totais" | "horizonte"
```

Conteúdo:
- Ícone de lock grande
- Título contextual (varia por `context`)
- 2-3 bullets do que Pro desbloqueia
- Botão primário → `router.push("/assinar")`
- Botão secundário → fechar

Títulos por contexto:
- `saldos`: "Veja seus saldos futuros"
- `totais`: "Acompanhe seus totais mês a mês"
- `horizonte`: "Planeje com visão completa do horizonte"

---

## Utilitário: `fake-month-data.ts`

**Arquivo:** `src/lib/fake-month-data.ts`

Gera dados fake deterministicos (seed = month string) para parecerem reais mas nunca serem os mesmos em telas diferentes.

```ts
// Saldos: gera 28-31 DayEntry com accSaldo variando naturalmente
generateFakeSaldosEntries(month: string): DayEntry[]

// Totais: gera TotaisData com valores plausíveis
generateFakeTotaisData(month: string): TotaisData

// Horizonte: gera SaldoEntry[] por mês
generateFakeHorizonteEntries(month: string): SaldoEntry[]
```

Seed por mês garante que o mesmo mês sempre mostra os mesmos números falsos (sem flickering).

---

## 1. Tela de Saldos

**Arquivos:** `saldos/page.tsx`, `saldos/saldos-grid.tsx`

### Fluxo atual
- Mês bloqueado → `isNextLocked` no header → usuário não consegue navegar

### Novo fluxo
- Mês bloqueado → usuário consegue navegar (remover `isNextLocked` do header)
- `SaldosGrid` recebe prop `isBlocked: boolean`
- Se `isBlocked`: renderiza fake entries com blur overlay + clique abre `ProUpsellSheet`
- Header: remover lock do botão next (navegação livre)

### Mudanças

**`saldos/page.tsx`**
```
- Remover isNextLocked do MonthHeader
- Calcular isBlocked = isFutureLocked(month)
- Passar isBlocked para SaldosGrid
- Estado: upsellOpen boolean
- Passar onUpsell={() => setUpsellOpen(true)} para SaldosGrid
- Renderizar <ProUpsellSheet context="saldos" />
```

**`saldos/saldos-grid.tsx`**
```
Nova prop: isBlocked: boolean, onUpsell: () => void

Se isBlocked:
  - Não faz fetch (evita 403)
  - Renderiza generateFakeSaldosEntries(month) no lugar de apiData
  - Wrapper com:
      relative + overflow-hidden
      blur-sm pointer-events-none (no conteúdo)
      overlay absoluto: fundo translúcido + ícone lock + texto
      onClick no overlay → onUpsell()
```

### UI do overlay (Saldos)
```
[lista de dias com saldos — borrada]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🔒
   Veja seu saldo futuro
   [Desbloquear com Pro]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 2. Tela de Totais

**Arquivos:** `totais/page.tsx`

### Fluxo atual
- Mês bloqueado → `isNextLocked` no header

### Novo fluxo
- Navegação livre
- Se mês bloqueado: renderiza `TotaisPage` com dados fake + blur overlay

### Mudanças

**`totais/page.tsx`**
```
- Remover isNextLocked do MonthHeader
- Calcular isBlocked = isFutureLocked(month)
- Se isBlocked:
    - Não chama useTotais (evita fetch 403)
    - Usa generateFakeTotaisData(month) no lugar de data
    - Wrapper com blur-sm + overlay clicável
- Estado: upsellOpen
- Renderizar <ProUpsellSheet context="totais" />
```

### UI do overlay (Totais)
```
[seções Performance, Economizado, etc — borradas]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🔒
  Desbloqueie para ver
  seus totais futuros
  [Assinar Pro]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. Horizonte de Saldos

**Arquivos:** `horizonte/page.tsx`, `horizonte/horizonte-grid.tsx`

### Fluxo atual
- Botão next lockado quando `months[2] >= freeNewestMonth()`

### Novo fluxo
- Navegação sempre livre (remover lock do botão next)
- `HorizonteGrid` recebe `blockedMonths: string[]`
- Colunas de meses bloqueados renderizam com fake data + blur
- Clique em qualquer célula de coluna bloqueada → `ProUpsellSheet`

### Mudanças

**`horizonte/page.tsx`**
```
- Remover isNextShiftLocked e cap do shift
- Calcular blockedMonths = months.filter(m => m > freeNewestMonth())
- Passar blockedMonths para HorizonteGrid
- Estado: upsellOpen
- Renderizar <ProUpsellSheet context="horizonte" />
- Passar onUpsell para HorizonteGrid
```

**`horizonte/horizonte-grid.tsx`**
```
Nova prop: blockedMonths: string[], onUpsell: () => void

Para cada mês em blockedMonths:
  - Usar generateFakeHorizonteEntries(month) no lugar de byMonth[m]
  - Coluna inteira com blur-sm + cursor-pointer
  - onClick em qualquer célula → onUpsell()
  - Header da coluna bloqueada: ícone 🔒 no lugar do nome do mês
    (ou nome do mês com lock ao lado)
```

### UI das colunas bloqueadas (Horizonte)
```
| MAR/25 | ABR/25 |  🔒   |
|--------|--------|-------|  ← header: mês + lock ou só lock
|  1,2K  |   980  | ████  |  ← célula bloqueada: valor fake + blur
|  1,1K  |   850  | ████  |
...
```

---

## Ordem de implementação

1. `src/lib/fake-month-data.ts` — gerador de dados fake ✅
2. `src/components/plan/pro-upsell-sheet.tsx` — sheet reutilizável ✅
3. Saldos (page + grid) ✅
4. Totais (page) ✅
5. Horizonte (page + grid) ✅

## O que NÃO muda

- Backend continua retornando 403 para meses bloqueados
- `isFutureLocked` em `use-plan.ts` continua existindo (usado para decidir `isBlocked`)
- `FREE_FUTURE_MONTHS` em `plan-utils.ts` continua sendo a fonte de verdade
- `/assinar` page não muda
