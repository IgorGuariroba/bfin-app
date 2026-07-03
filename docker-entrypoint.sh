#!/bin/sh
set -e

# Aplica migrações pendentes antes de subir o servidor (ADR-0014: drizzle-kit
# é o dono desde o #149). Roda em todo start do container; é idempotente.
node scripts/db-migrate.mjs

exec "$@"
