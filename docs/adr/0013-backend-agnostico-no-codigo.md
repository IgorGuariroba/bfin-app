# 13. Backend agnóstico de framework no código, não na infra

Data: 2026-07-02
Status: Aceito

## Contexto

A lógica de negócio vive em services (`src/lib/*-service.ts`) que os route handlers do Next chamam — um desacoplamento pela metade: os services derivam tipos do Prisma (`Awaited<ReturnType<typeof prisma.transaction.create>>`), usam o marcador `"server-only"` (Next-ismo), a regra de delegação está misturada com leitura de cookie em `effective-user.ts`, e ~12 páginas server component (blog, admin, preços, LP) chamam Prisma direto, pulando qualquer camada.

Dois desejos motivaram a decisão: (a) o backend sobreviver intacto a uma troca de framework HTTP e ser consumível por outros clientes além da web (o MCP e o WhatsApp já são clientes); (b) uma **migração planejada de Prisma para Drizzle** — por controle fino sobre as queries geradas e observabilidade. Não há consumidor novo com prazo (app mobile etc.) nem problema de escala que exija API separada.

## Decisão

O agnosticismo é propriedade do **código**, não da infra: **um único deploy Next** continua sendo o sistema inteiro. Concretamente:

- **`src/core/`** abriga o domínio, organizado por agregado (`transactions/`, `tags/`, `previsao/`, `identity/`, `billing/`...). Regra ESLint proíbe o core de importar `next/*`, `next-auth`, `react` e `@/app`. `"server-only"` sai do core; a proteção contra import em client component vira lint na fronteira.
- **Portas de repositório**: o core define interfaces (`TransactionRepo`, `TagRepo`...) e **tipos de domínio próprios** (escritos à mão, não derivados do ORM). `src/adapters/prisma/` implementa as portas hoje; `adapters/drizzle/` amanhã. A migração de ORM vira flip por agregado com os testes do core inalterados.
- **Escopo do core**: financeiro + identidade + billing (o webhook MercadoPago muda plano — é domínio). **Blog/marketing fica fora**, acoplado ao Next sem culpa: é conteúdo web por natureza, não paga o custo de portas.
- **Identidade** entra no core como `userId` já resolvido. A regra de delegação "membro ativo opera como dono" (ADR-0011) vira `resolveEffectiveUser(sessionUserId, requestedOwnerId)` no core; ler cookie/sessão/ApiKey é papel do adapter. A auditoria de agente permanece fora dos services (ADR-0004).
- **Dois movimentos separados**: (1) extrair portas + tipos de domínio com Prisma como único adapter, comportamento idêntico, agregado por agregado — começando por um pequeno (tags) para calibrar o padrão; (2) depois, escrever adapters Drizzle e flipar agregado por agregado. Cada PR muda uma coisa só.

## Consequências

**Positivas:**
- A migração Prisma→Drizzle deixa de ser big-bang: vira uma série de PRs pequenos e reversíveis, e um terceiro ORM no futuro custa só mais um adapter.
- Se um dia surgir consumidor que exija API separada, promover `src/core` a pacote/serviço é mecânico — a fronteira já estará limpa.
- Observabilidade fica no adapter, onde pertence: o adapter Prisma pode ganhar `@prisma/instrumentation` (spans por query no pipeline OTel já registrado em `instrumentation.ts`) sem esperar a migração.

**Negativas / trade-offs aceitos:**
- Tipos de domínio à mão são código novo para manter em sincronia com o schema.
- A fronteira por ESLint é mais fraca que module resolution de workspace — um `eslint-disable` fura; aceito pelo custo zero de monorepo.
- Interfaces + wiring por agregado são cerimônia que só se paga porque a troca de ORM é plano real, não hipótese.

## Alternativas descartadas

- **API deployável separada agora:** segundo processo na VPS, auth entre serviços, CORS, versionamento, mais um alvo no Dokploy/Traefik/Grafana — custo operacional permanente comprado para um consumidor que não existe.
- **Prisma direto no core, sem portas:** era a recomendação inicial (simplicidade), derrubada pela migração Drizzle concreta — sem portas ela seria reescrita simultânea de todos os services e seus tipos.
- **Portas + Drizzle no mesmo movimento:** cada PR mudaria estrutura e ORM ao mesmo tempo; teste quebrado não diria qual movimento causou.
- **npm workspace `packages/core`:** fronteira mais forte, mas config de workspace + atrito de lockfile (CI/Docker em node 22) sem segundo consumidor de verdade.
- **Tudo no core, inclusive blog:** interfaces + tipos de domínio para CRUD de posts que só a web usa — burocracia sem benefício.
