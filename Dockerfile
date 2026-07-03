# syntax=docker/dockerfile:1
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_FARO_URL
ENV NEXT_PUBLIC_FARO_URL=$NEXT_PUBLIC_FARO_URL
# FARO_API_KEY só é usado em build-time (upload de sourcemaps ao Faro pelo plugin webpack).
# Montado como secret BuildKit: exposto à env do RUN, sem persistir em layer nem na imagem final.
RUN --mount=type=secret,id=faro_api_key,env=FARO_API_KEY \
    npm run build -- --webpack

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

# scripts/db-migrate.mjs roda fora do server.js do Next (fica de fora do output
# file tracing do standalone) — precisa das próprias deps, mesmo padrão que já
# resolvia isso para o `prisma` CLI antes do ADR-0014.
RUN npm install drizzle-orm@0.45.2 pg@8.22.0 dotenv@17.4.2 && chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
