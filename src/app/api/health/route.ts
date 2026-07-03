import { sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ ok: true, db: 'up' });
  } catch (e) {
    logger.error({ err: e }, 'health check: DB unreachable');
    const message = e instanceof Error ? e.message : 'unknown';
    return Response.json({ ok: false, db: 'down', error: message }, { status: 503 });
  }
}
