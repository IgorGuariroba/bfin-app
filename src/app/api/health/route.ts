import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { logger } from '@/lib/logger';

// ADR-0018 (#230): SHA do commit buildado, gravado pelo Dockerfile na raiz do
// runner. O workflow de smoke pós-deploy faz polling deste campo até a versão
// nova estar servida. Fora do container (dev, next start no CI) fica "unknown".
let buildSha = 'unknown';
try {
  buildSha = readFileSync('BUILD_SHA', 'utf8').trim() || 'unknown';
} catch {
  // sem BUILD_SHA no cwd — ambiente sem build Docker
}

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: 'up', sha: buildSha });
  } catch (e) {
    logger.error({ err: e }, 'health check: DB unreachable');
    const message = e instanceof Error ? e.message : 'unknown';
    return Response.json({ ok: false, db: 'down', sha: buildSha, error: message }, { status: 503 });
  }
}
