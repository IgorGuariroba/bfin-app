# src/core — domínio agnóstico de framework e ORM

Regras do ADR-0013 (`docs/adr/0013-backend-agnostico-no-codigo.md`), impostas por
ESLint (`eslint.config.mjs`): nada aqui importa `next/*`, `next-auth`, `react`,
`server-only`, `@prisma/*`, `@/generated/*`, `@/app`, `@/adapters`, `@/lib`,
`@/components` ou `@/hooks`. A dependência aponta sempre para dentro: todo mundo
pode importar o core; o core não importa ninguém.

## O padrão (calibrado no piloto `tags/` — use como gabarito)

Cada agregado é uma pasta com:

- **`types.ts`** — tipos de domínio escritos à mão (nunca derivados do client do ORM).
- **`ports.ts`** — interfaces de persistência moldadas pelo que o service precisa
  (não CRUD genérico). Contratos como ordenação são documentados na porta.
- **`service.ts`** — regras de negócio + erros do domínio, via factory
  `makeXService(repo)`. Identidade entra como `userId` já resolvido — sessão,
  cookie e ApiKey são problema dos adapters.
- **`service.test.ts`** — testes unitários com repo fake em memória (sem DB, sem Next).
- **`index.ts`** — superfície pública do agregado.

Fora do core:

- **`src/adapters/prisma/`** — implementação das portas (e testes de integração
  contra o banco real).
- **`src/adapters/index.ts`** — composition root: instancia os services com os
  repos concretos. Trocar de ORM = trocar os repos aqui, agregado por agregado.
- **Rotas/páginas/canais** consomem os services prontos de `@/adapters`; erros de
  domínio são mapeados para HTTP no handler (validação → 400, not found → 404,
  system tag imutável → 403).
