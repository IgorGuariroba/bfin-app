#!/bin/sh
set -e

# Aplica migrações pendentes antes de subir o servidor.
# Roda em todo start do container; `migrate deploy` é idempotente.
npx prisma migrate deploy

exec "$@"
