import "server-only";

/**
 * Postgres unique_violation (23505) — equivalente ao P2002 do Prisma. O driver
 * `pg` lança o erro original; drizzle-orm o embrulha em DrizzleQueryError e
 * expõe o original em `.cause`.
 */
export function isUniqueViolation(err: unknown): boolean {
  const cause = err instanceof Error && "cause" in err ? err.cause : err;
  return typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505";
}
