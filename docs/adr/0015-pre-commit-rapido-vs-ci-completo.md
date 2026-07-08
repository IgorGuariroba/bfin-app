# Pre-commit roda checagem rápida e escopada; CI roda a suíte completa

O pre-commit (`.husky/pre-commit`) passa a rodar apenas verificações rápidas: `eslint --fix` nos arquivos staged (já existia via lint-staged), `tsc --noEmit` completo (aproveitando o cache incremental de `tsconfig.tsbuildinfo`, já gitignored) e `vitest related --project unit --run` sobre os arquivos staged. O CI (`ci.yml`) continua rodando tudo full-repo: typecheck, lint, knip, jscpd, suíte de testes completa (unit + integration) e build.

O motivo do split de `vitest` em dois projects (`unit`/`integration`) é que 60% dos arquivos de teste (21 de 35) dependem de um Postgres real via `DATABASE_URL` — não só a camada de adapter (`src/adapters/drizzle`), mas também vários testes em `src/lib` e `src/app/api` que montam fixtures direto no banco. Não dá para usar a pasta como proxy de "unit vs integração": os 21 arquivos foram renomeados para o sufixo `*.integration.test.ts` para tornar essa fronteira explícita e permitir o pre-commit escopar `vitest related` só ao project `unit`, sem depender de Postgres estar de pé a cada commit.

**Trade-off aceito**: uma mudança que quebra um teste de integração só é pega no CI, não no commit local. `knip` e `jscpd` continuam full-repo no pre-commit (decisão anterior, não revisitada aqui).

## Revisão (2026-07-07, ADR-0018)

A decisão "não revisitada aqui" foi revisitada: `tsc --noEmit`, `knip` e `jscpd` saem do pre-commit e passam a rodar num novo hook **pre-push**. O pre-commit fica só com `lint-staged` (eslint --fix + `vitest related --project unit` nos staged). Racional e trade-offs na ADR-0018.
