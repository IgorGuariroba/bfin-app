import "server-only";

export interface RateLimitConfig {
  /** Máximo de chamadas permitidas dentro da janela. */
  limit: number;
  /** Tamanho da janela em milissegundos. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos até a janela reabrir; 0 quando a chamada foi permitida. */
  retryAfter: number;
}

interface Bucket {
  count: number;
  /** Instante (ms) em que a janela atual expira. */
  resetAt: number;
}

/**
 * Login por credentials: cota por IP+email contra brute-force de senha.
 * Conta toda tentativa (válida ou não); estourar devolve o mesmo erro
 * genérico de credenciais inválidas.
 */
export const LOGIN_RATE_LIMIT: RateLimitConfig = { limit: 5, windowMs: 15 * 60_000 };

/**
 * Comentários do blog: cota por usuário contra spam em volume — a moderação
 * (`status: pending`) cuida do conteúdo, esta cota cuida do ritmo.
 */
export const COMMENT_RATE_LIMIT: RateLimitConfig = { limit: 5, windowMs: 10 * 60_000 };

const buckets = new Map<string, Bucket>();

/**
 * Acima deste número de baldes vivos, fazemos uma varredura preguiçosa removendo
 * os já expirados. Sem isso o Map cresce indefinidamente (cada `apiKeyId:kind`
 * distinto fica para sempre, mesmo após a janela fechar) — memory leak lento em
 * produção. A limpeza só roda ao abrir uma janela nova, não no caminho quente.
 */
const MAX_BUCKETS = 1000;

function evictExpired(now: number): void {
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(k);
  }
}

/**
 * Rate limit in-memory por chave, janela fixa (ADR-0004). Cada chave
 * (`apiKeyId:kind`) tem seu balde: a primeira chamada abre a janela, e ao
 * exceder `limit` antes de `windowMs` retorna `allowed: false` com `retryAfter`.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size > MAX_BUCKETS) evictExpired(now);
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= config.limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { allowed: true, retryAfter: 0 };
}
