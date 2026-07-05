import "server-only";

// Admin = User cujo email está na lista configurada (CONTEXT.md › Admin).
// Comparação pura (ADR-0017: sem repo, não precisa de round-trip HTTP) —
// duplicada aqui e em core/identity/admin.ts no bfin-backend.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}
