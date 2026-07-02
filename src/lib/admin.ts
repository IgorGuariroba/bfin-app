import "server-only";

import { isAdminEmail } from "@/core/identity";

// Ler o ambiente é papel do adapter (ADR-0013); a comparação vive no core.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export function isAdmin(email: string | null | undefined): boolean {
  return isAdminEmail(email, ADMIN_EMAILS);
}
