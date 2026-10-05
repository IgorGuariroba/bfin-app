# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_FARO_URL
ENV NEXT_PUBLIC_FARO_URL=$NEXT_PUBLIC_FARO_URL
# FARO_API_KEY só é usado em build-time (upload de sourcemaps ao Faro pelo plugin webpack).
# Montado como secret BuildKit: exposto à env do RUN, sem persistir em layer nem na imagem final.
RUN --mount=type=secret,id=faro_api_key,env=FARO_API_KEY \
    npm run build -- --webpack
# ADR-0018 (#230): SHA do commit buildado, exposto pelo /api/health para o
# workflow pós-merge saber quando a versão nova está servida. Resolvido dos
# metadados do git no contexto (HEAD pode ser ref simbólica ou detached;
# a ref pode estar solta em refs/ ou em packed-refs).
RUN HEAD=$(cat .git/HEAD 2>/dev/null || true); \
    case "$HEAD" in \
      ref:*) REF=$(echo "$HEAD" | cut -d' ' -f2); \
             SHA=$(cat ".git/$REF" 2>/dev/null || \
                   grep " $REF" .git/packed-refs 2>/dev/null | cut -d' ' -f1);; \
      *)     SHA=$HEAD;; \
    esac; \
    echo "${SHA:-unknown}" > BUILD_SHA && cat BUILD_SHA

# Deps que o file tracing do Next não enxerga e que o servidor precisa em runtime:
#
#  - scripts/db-migrate.mjs roda fora do server.js do Next (fica de fora do output
#    file tracing do standalone) — precisa das próprias deps, mesmo padrão que já
#    resolvia isso para o `prisma` CLI antes do ADR-0014.
#  - `pino-opentelemetry-transport`: o pino resolve o transport por string num
#    worker em runtime, então o tracing também não o inclui (nem às deps dele).
#    Sem o pacote o app sobe e toda rota que importa o logger estoura com
#    "unable to determine transport target".
#
# Instaladas num estágio isolado: rodar `npm install` sobre o node_modules parcial
# do output standalone (sem lockfile) quebra o arborist do npm em `#loadPeerSet` —
# "Cannot read properties of null (reading 'edgesOut')" (npm/cli#9787).
# `--legacy-peer-deps` evita reinstalar o `pino` (peer) e sobrescrever o do standalone.
FROM node:22-alpine AS runtime-deps
WORKDIR /deps
RUN npm init -y >/dev/null 2>&1 && \
    npm install --no-audit --no-fund --omit=dev --legacy-peer-deps \
      drizzle-orm@0.45.2 pg@8.22.0 dotenv@17.4.2 \
      pino-opentelemetry-transport@3.0.0

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/BUILD_SHA ./BUILD_SHA
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

# Merge das deps de runtime (ver estágio runtime-deps) sobre o node_modules do
# standalone — só adiciona os pacotes que o tracing deixou de fora e as transitivas.
COPY --from=runtime-deps --chown=nextjs:nodejs /deps/node_modules ./node_modules
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
