import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { saoPauloTodayRange } from "@/lib/date-utils";
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

  // Apaga o diário (projeção) do dia corrente em São Paulo apenas dos usuários
  // pro que ativaram a baixa automática. Único deleteMany, filtrado pela relação
  // (ADR-0005). Escopo deliberado: só hoje — não recupera dias passados.
  //
  // - source: "manual" — só toca a projeção gerada por apply_previsao; nunca
  //   importados do Open Finance (source: pluggy) nem do agente, espelhando o
  //   contrato de apply_previsao (CONTEXT.md › Previsão; ADR-0004 §4).
  // - planExpiresAt — replica getUserPlan (plan.ts): pro vencido conta como free.
  const now = new Date();
  const { gte, lt } = saoPauloTodayRange(now);
  const { count } = await prisma.transaction.deleteMany({
    where: {
      type: "diario",
      source: "manual",
      date: { gte, lt },
      user: {
        autoBaixaDiario: true,
        plan: "pro",
        OR: [{ planExpiresAt: null }, { planExpiresAt: { gt: now } }],
      },
    },
  });

  logger.info({ action: "baixa_diaria", count }, "baixa automática do gasto diário");

  return Response.json({ count });
}
