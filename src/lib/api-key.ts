import "server-only";

import { randomBytes, scryptSync } from "node:crypto";

const PREFIX = "sk-bfin-";

if (!process.env.APIKEY_PEPPER && process.env.NODE_ENV === "production") {
  throw new Error("APIKEY_PEPPER é obrigatória em produção.");
}
const PEPPER = process.env.APIKEY_PEPPER ?? "dev-pepper-change-me";

export function hashApiKey(plain: string): string {
  return scryptSync(plain, PEPPER, 64).toString("base64url");
}

export function verifyApiKey(plain: string, hashedKey: string): boolean {
  return hashApiKey(plain) === hashedKey;
}

export function generateApiKey(): {
  plain: string;
  prefix: string;
  hashedKey: string;
} {
  const random = randomBytes(32).toString("base64url");
  const plain = `${PREFIX}${random}`;
  const prefix = `${PREFIX}${random.slice(0, 4)}`;
  return { plain, prefix, hashedKey: hashApiKey(plain) };
}
