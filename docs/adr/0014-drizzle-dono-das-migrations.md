# 14. Drizzle assume a posse das migrations

Data: 2026-07-03
Status: Aceito

## Contexto

ADR-0013 previu dois movimentos: extrair portas com Prisma como único adapter (feito, #155–#163) e, depois, escrever adapters Drizzle e flipar agregado por agregado, começando pelo piloto Tags (#149). Esse segundo movimento levanta uma decisão de lock-in que a ADR-0013 deixou em aberto: durante a transição, quem aplica as migrations do banco — `prisma migrate deploy` (como hoje, em `predev`, CI e `docker-entrypoint.sh`) ou `drizzle-kit`?

Manter os dois sistemas de migration coexistindo (Prisma dono enquanto restarem agregados não flipados, Drizzle dono só no final) significa que cada alteração de schema físico precisa decidir em qual dos dois nasce, e o journal de migrations aplicadas vive em dois lugares. Os bancos existentes (dev e prod — o volume `bfin-app_pgdata` é vivo, ADR do Dokploy) já têm todo o DDL aplicado via Prisma; qualquer novo dono precisa reconhecer esse histórico sem re-executar DDL que já rodou.

## Decisão

**`drizzle-kit` assume a posse das migrations a partir do #149**, não gradualmente ao final da migração de agregados:

- `src/db/schema.ts` nasceu de `drizzle-kit pull` (introspecção do banco vivo) — sem mudança de schema físico. `drizzle.config.ts` aponta esse schema como fonte da verdade.
- A partir de agora, qualquer alteração de schema físico (nova coluna, tabela, índice) é feita em `src/db/schema.ts` e gera migration via `drizzle-kit generate` — mesmo para agregados cujo adapter ainda é Prisma. `prisma/schema.prisma` continua existindo só para gerar o Prisma Client (`prisma generate`) usado pelos agregados ainda não flipados; `prisma/migrations/` fica congelado como histórico, não recebe migration nova.
- `scripts/db-migrate.mjs` substitui `prisma migrate deploy` nos três pontos onde ele rodava (`predev`, CI, `docker-entrypoint.sh`). Ele resolve o baseline: se o banco já tem o schema da era Prisma (detecta pela tabela `User`) mas não tem o journal do Drizzle (`drizzle.__drizzle_migrations`), marca a migration `0000` (o dump por introspecção) como já aplicada sem executá-la; bancos novos rodam a `0000` normalmente. Dali em diante é `drizzle-orm/node-postgres/migrator` puro.
- Isso é decisão de infra, não do flip por agregado do ADR-0013: a posse de migrations é uma propriedade do banco inteiro (não dá para ter Tags migrado por Drizzle e Transactions por Prisma no mesmo schema), enquanto o adapter de query é uma propriedade por agregado.

## Consequências

**Positivas:**
- Um único journal de migrations, uma única fonte de verdade de schema físico, desde o início da migração — sem período híbrido para gerenciar.
- `drizzle-kit generate`/`push` dão diff automático contra o schema TS; queries tipadas desde a introspecção, sem esperar o flip completo de cada agregado.
- O baseline idempotente em `scripts/db-migrate.mjs` deixa bancos pré-existentes (dev e prod) e bancos novos (CI) no mesmo caminho de código.

**Negativas / trade-offs aceitos:**
- Dois ORMs describem o mesmo schema em paralelo (`prisma/schema.prisma` e `src/db/schema.ts`) até o último agregado flipar — mudança de schema físico feita só do lado Prisma (fora do fluxo) ficaria invisível para o Drizzle e vice-versa; convenção passa a ser: schema físico sempre nasce em `src/db/schema.ts`.
- `scripts/db-migrate.mjs` reimplementa manualmente o formato do journal do Drizzle (hash sha256 do `.sql`, `created_at` = `when` do `_journal.json`) para escrever o registro de baseline — acoplado à versão pinada de `drizzle-orm` no `package.json`.

## Alternativas descartadas

- **Prisma continua dono até o último agregado flipar:** evita reimplementar o baseline agora, mas mantém dois sistemas de migration ativos por toda a duração da migração (#149–#163+) — mudança de schema em qualquer agregado ainda em Prisma exigiria decidir "isso nasce em qual dos dois", com risco de journals divergindo.
- **Migration squash/reset (dropar histórico Prisma e recomeçar limpo no Drizzle):** inviável — bancos de produção são vivos, não dá para recriar do zero.
