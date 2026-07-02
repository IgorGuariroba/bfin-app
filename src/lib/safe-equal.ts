import { timingSafeEqual } from "node:crypto";

/** Compara em tempo constante; length-mismatch → false (timingSafeEqual exige buffers do mesmo tamanho). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
