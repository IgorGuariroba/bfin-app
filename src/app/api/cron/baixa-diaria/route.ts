import { timingSafeEqual } from "node:crypto";
import { previsaoService } from "@/adapters";
import { logger } from "@/lib/logger";

/** Compara em tempo constante; length-mismatch → false (timingSafeEqual exige buffers do mesmo tamanho). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const provided = request.headers.get("x-cron-secret") ?? "";
  if (!safeEqual(provided, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await previsaoService.baixaDiaria();

  logger.info({ action: "baixa_diaria", count }, "baixa automática do gasto diário");

  return Response.json({ count });
}
