# 17. Split físico do backend em serviço/repositório separado

Data: 2026-07-04
Status: Aceito

## Contexto

A ADR-0013 (2026-07-02) decidiu que o agnosticismo de backend seria uma propriedade do **código**, não da infra: `src/core` organizado por agregado, portas + adapters, mas um único deploy Next. Essa migração foi concluída — Prisma saiu, todo o domínio (`transactions`, `tags`, `previsao`, `identity`, `billing`, `apikeys`, `insights`) vive em `src/core` com adapters Drizzle, e o ESLint impede o core de importar Next/React/ORM.

O motivo para reabrir essa decisão não é um novo consumidor com prazo nem crescimento de time (o projeto continua sendo um único dev) — é **cadência de deploy**: hoje qualquer mudança, mesmo restrita a `src/core`, força um rebuild completo do Next (`Dockerfile` builda a aplicação inteira num único `npm run build`) e um redeploy do processo que também serve a UI. Separar fisicamente permite mudar/deployar o backend sem depender do ciclo de build do frontend, e vice-versa.

Dois canais que já consomem o core hoje — MCP (`/api/mcp`, autenticado por `ApiKey` Bearer, ADR-0003) e o webhook do WhatsApp — **já não dependem de sessão de navegador**. Só as rotas financeiras usadas pela UI passam por `auth()` do NextAuth (cookie JWT). O login em si (`credentials-authorize.ts`, adapter do NextAuth) já acessa o Postgres diretamente dentro do processo Next, fora do core — um concern que a própria ADR-0013 já havia classificado como "adapter", não domínio.

## Decisão

O backend passa a ser um **serviço e repositório Git separados** (`bfin-backend`), com deploy independente do frontend (`bfin-app`).

- **Escopo do que migra**: `src/core` (financeiro + identidade + billing) + `src/adapters/drizzle` + os canais que só servem esse domínio — servidor MCP e webhooks (WhatsApp, MercadoPago). Blog/marketing continua no `bfin-app`, como a ADR-0013 já delimitava (não é domínio).
- **Framework HTTP**: Fastify, camada fina sobre os services do core (que continuam 100% agnósticos de framework).
- **Auth do navegador**: o Next continua validando a sessão via `auth()` (cookie JWT do NextAuth) e resolvendo `userId`/delegação de `AccountMember` — papel de gateway. As rotas financeiras da UI chamam o backend internamente já com o `userId` resolvido, autenticadas por um segredo compartilhado (mesmo padrão que `CRON_SECRET` já usa no repo hoje).
- **MCP e webhooks continuam públicos**, expostos direto no backend (não atravessam o Next) — cada canal com sua própria autenticação (`ApiKey` Bearer pro MCP, assinatura do provedor pros webhooks). O segredo compartilhado do gateway não se aplica a essas rotas.
- **URLs públicas preservadas**: mesmo domínio (`bfincont.com.br`). O Traefik (já na frente de tudo via Dokploy) roteia por path — `/api/mcp`, `/api/webhook/*`, `/api/whatsapp/webhook` vão direto para o container do backend; o resto vai para o Next. Ninguém que já colou a URL do MCP num client precisa mudar nada.
- **Banco compartilhado**: os dois processos falam com o mesmo Postgres. O Next mantém sua própria conexão Drizzle só para as tabelas que o NextAuth adapter precisa (`user`, `account`, `session`, `verification_token`) — não há chamada HTTP interna para login, o adapter continua funcionando como o NextAuth espera.
- **Schema e migrations**: `bfin-backend` é dono único, inclusive das tabelas de auth que o Next usa. Mudança de schema é sempre um PR no backend primeiro. O compose do backend declara o serviço `db` (reaproveitando o volume externo `bfin-app_pgdata` já existente) e a rede compartilhada como `external: true`; o compose do frontend só declara `app`, conectando-se a essa rede.
- **Sem npm workspace nem pacote de schema compartilhado**: os dois repositórios são independentes, cada um com seu `package.json`/lockfile. O Next reimplementa à mão as poucas tabelas de auth que lê (mesmo padrão de tipos de domínio escritos à mão que a ADR-0013 já aceitava).

## Consequências

**Positivas:**
- Mudança em `src/core` (regra de negócio, migration) não força rebuild/redeploy da UI, e vice-versa.
- MCP e webhooks ganham um blast radius menor: um bug de renderização da UI não pode derrubar o backend que serve agentes externos e webhooks de pagamento.
- A fronteira de código que a ADR-0013 já preparava (core sem dependência de framework) torna essa promoção "mecânica", como a própria ADR-0013 previu.

**Negativas / trade-offs aceitos:**
- Dois repositórios para manter: uma mudança que atravessa a fronteira (ex: novo campo de domínio que a UI também precisa exibir) vira dois PRs coordenados em vez de um.
- Ordem de deploy passa a importar: o backend precisa existir (rede + `db`) antes do frontend subir pela primeira vez.
- Postgres compartilhado por dois processos não é isolamento pleno — é uma concessão deliberada para não reimplementar o adapter do NextAuth como chamada HTTP.
- Mais um alvo de observabilidade/infra (novo serviço no Dokploy, nova rota no Traefik, novo `OTEL_SERVICE_NAME`).

## Alternativas descartadas

- **Continuar só com separação no código (reafirmar a ADR-0013)**: resolveria o agnosticismo, mas não a cadência de deploy, que é o motivo real desta decisão.
- **Backend decodifica o JWT do NextAuth direto (`next-auth/jwt`)**: eliminaria o hop pelo Next em runtime, mas exigiria roteamento same-origin ou CORS, e duplicaria a lógica de resolução de identidade (delegação de `AccountMember`) nos dois lados, sem pacote compartilhado.
- **Só o backend fala com o Postgres (login via chamada HTTP interna)**: mais "puro", mas reimplementa manualmente o que o adapter do NextAuth já resolve de graça.
- **Mesmo repositório, pasta irmã sem workspace**: PRs atômicos entre core e UI, mas foi preterido em favor de repositório separado.
- **Dois serviços de backend (um público para MCP/webhooks, outro interno para a API financeira)**: isola melhor o blast radius por canal, mas dobra o que precisa ser deployado/mantido sem motivo concreto hoje (projeto de um único dev).
- **Next faz proxy código-a-código das rotas de MCP/webhook**: funcionaria, mas reimplementaria proxy de streaming à mão dentro de um route handler para o transporte streamable HTTP do MCP — o Traefik já resolve isso nativamente.
- **`db-migrate.mjs` continua no repositório frontend**: inverteria a relação natural entre dono do schema e dono das migrations, e manteria uma dependência de ordem de deploy ao contrário (frontend precisaria subir antes do backend existir).

## Nota de execução (2026-07-06)

Trilha de implementação #181–#191 concluída. Desvios em relação ao texto acima:

- **O canal WhatsApp não migrou — foi removido** (#189 cancelada): estava sem uso (env vars nunca configuradas em produção, tabelas zeradas) e sem intenção de manter. As 3 tabelas foram dropadas por migration no `bfin-backend`. O roteamento público do Traefik ficou só com `/api/mcp` e `/api/webhook/mercadopago`.
- **O Drizzle local do `bfin-app` ficou menor que o previsto**: como a sessão do NextAuth é JWT (`strategy: "jwt"`) e não há Email provider, o adapter só usa `user` e `account` — `session` e `verification_token` saíram do schema local (as tabelas seguem existindo no banco, sob posse do `bfin-backend`). Além da fatia de auth, o schema local mantém as tabelas do blog e as usadas como fixture de teste.
