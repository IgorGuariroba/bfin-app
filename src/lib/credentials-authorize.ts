import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, LOGIN_RATE_LIMIT } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Fluxo `authorize` do provider Credentials, extraído do NextAuth para ser
 * testável. Rate limit por IP+email antes de tocar o banco: cota estourada
 * devolve `null` — o mesmo resultado de credenciais inválidas — para não
 * revelar se o email existe.
 */
export async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>> | undefined,
  ip: string
): Promise<{ id: string; name: string | null; email: string | null } | null> {
  if (!credentials?.email || !credentials?.password) return null;
  const email = credentials.email as string;

  const limit = checkRateLimit(`login:${ip}:${email}`, LOGIN_RATE_LIMIT);
  if (!limit.allowed) {
    logger.warn({ ip, email }, "auth: login rate limited");
    return null;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    logger.warn({ ip, email }, "auth: login failed");
    return null;
  }

  const isValid = await bcrypt.compare(credentials.password as string, user.password);
  if (!isValid) {
    logger.warn({ ip, email }, "auth: login failed");
    return null;
  }

  return { id: user.id, name: user.name, email: user.email };
}

/** IP do cliente atrás do proxy: primeiro hop do X-Forwarded-For. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
