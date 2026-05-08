import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: 'up' });
  } catch (e) {
    logger.error({ err: e }, 'health check: DB unreachable');
    const message = e instanceof Error ? e.message : 'unknown';
    return Response.json({ ok: false, db: 'down', error: message }, { status: 503 });
  }
}
