"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { MonthHeader } from "@/components/layout/month-header";
import { MovimentacaoItem } from "@/components/totais/movimentacao-item";
import { ProUpsellSheet } from "@/components/plan/pro-upsell-sheet";
import { useMonth } from "@/hooks/use-month";
import { useTotais } from "@/hooks/use-totais";
import { usePlan } from "@/hooks/use-plan";
import { generateFakeTotaisData } from "@/lib/fake-month-data";
import { fmt } from "@/lib/utils";
import { CAT_COLORS } from "@/lib/constants";

/* ── Tiny colored circle for formulas ─── */
function Dot({ cat, size = 20 }: { cat: string; size?: number }) {
  const initials: Record<string, string> = {
    entrada: "E", saida: "S", diario: "D", cartao: "C", economia: "G",
  };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-on-primary font-bold shrink-0"
      style={{
        backgroundColor: CAT_COLORS[cat as keyof typeof CAT_COLORS] ?? "#999",
        width: size,
        height: size,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      {initials[cat] ?? "?"}
    </span>
  );
}

const POSITIVE = "#2db55d";
const MONTH_NAMES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function prevMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return MONTH_NAMES[d.getMonth()];
}

function DeltaRow({
  current, prev, vsLabel, invert = false, format = "money",
}: {
  current: number; prev: number; vsLabel: string; invert?: boolean; format?: "money" | "pct";
}) {
  const diff = current - prev;
  if (diff === 0) return null;
  const up = diff > 0;
  const good = invert ? !up : up;
  const valueStr = format === "pct"
    ? `${up ? "+" : ""}${Math.round(diff)}pp`
    : `${up ? "↑" : "↓"} ${fmt(Math.abs(diff))}`;
  return (
    <>
      <span style={{ color: good ? POSITIVE : "var(--color-rausch)" }} className="text-xs mt-0.5 block">
        {valueStr}
      </span>
      <span className="text-xs text-muted/60">vs {vsLabel}</span>
    </>
  );
}

export default function TotaisPage() {
  const { month, prev, next, label } = useMonth();
  const { isFutureLocked } = usePlan();
  const isBlocked = isFutureLocked(month);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Only fetch real data if not blocked
  const totaisResult = useTotais(isBlocked ? "" : month);
  const data = isBlocked ? generateFakeTotaisData(month) : totaisResult.data;
  const loading = isBlocked ? false : totaisResult.loading;

  const economiaPct =
    data && data.entradas > 0
      ? Math.min(100, Math.round((data.economia / data.entradas) * 100))
      : 0;

  const perfLabel =
    data
      ? data.saldoAtual >= 0
        ? "Sobrou dinheiro"
        : "Faltou dinheiro"
      : "";

  const econLabel =
    data
      ? data.economia > 0
        ? `${economiaPct}% da renda`
        : "Nada guardado"
      : "";

  const custoLabel =
    data
      ? data.custoVida <= data.entradas
        ? "Abaixo da renda"
        : "Acima da renda"
      : "";

  const diarioPct =
    data && data.diarioPrev > 0
      ? Math.round((data.diarioMedio / data.diarioPrev - 1) * 100)
      : 0;

  const diarioColor =
    data && data.diarioMedio > data.diarioPrev
      ? "var(--color-rausch)"
      : POSITIVE;

  const diarioLabel =
    data && data.diarioPrev > 0
      ? diarioPct === 0
        ? "na meta"
        : diarioPct > 0
          ? `+${diarioPct}% da meta`
          : `${diarioPct}% da meta`
      : "";

  const isPartialMonth = data ? data.daysElapsed < data.daysInMonth : false;
  const prevLabel = prevMonthLabel(month);
  const prevMonthData = data?.prevMonth ?? null;

  return (
    <div className="flex flex-col pb-20">
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <div className="relative">
          {/* Blur when blocked */}
          {isBlocked && (
            <>
              <div className="blur-sm pointer-events-none select-none" />
              <button
                onClick={() => setUpsellOpen(true)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-canvas/60 backdrop-blur-[2px] cursor-pointer z-10"
              >
                <Lock className="text-ink/60" size={28} />
                <span className="text-sm font-semibold text-ink/80">Desbloqueie para ver seus totais futuros</span>
                <span className="text-xs text-ink/50">Toque para desbloquear</span>
              </button>
            </>
          )}

          <div className={isBlocked ? "blur-sm pointer-events-none select-none" : ""}>
            {/* ═══ Cálculos do mês ═══ */}
            <p className="px-4 pt-4 pb-2 text-xs font-medium text-muted">
              Cálculos do mês
            </p>

            {/* ── Performance ── */}
            <section className="px-4 py-4 border-b border-hairline-soft">
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold text-ink">Performance</span>
                <div className="text-right">
                  <p
                    className="text-base font-semibold tabular-nums"
                    style={{ color: data.saldoAtual >= 0 ? POSITIVE : "var(--color-rausch)" }}
                  >
                    {data.saldoAtual < 0 ? "– " : ""}{fmt(Math.abs(data.saldoAtual))}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{perfLabel}</p>
                  {isPartialMonth && (
                    <p className="text-xs text-muted mt-0.5">
                      dia {data.daysElapsed} de {data.daysInMonth}
                    </p>
                  )}
                  {prevMonthData && <DeltaRow current={data.saldoAtual} prev={prevMonthData.saldoAtual} vsLabel={prevLabel} />}
                </div>
              </div>
            </section>

            {/* ── Economizado ── */}
            <section className="px-4 py-4 border-b border-hairline-soft">
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold text-ink">Economizado</span>
                <div className="text-right">
                  <p className="text-base font-semibold tabular-nums text-ink">{economiaPct}%</p>
                  <p className="text-xs text-muted mt-0.5">{econLabel}</p>
                  {prevMonthData && <DeltaRow current={economiaPct} prev={prevMonthData.economiaPct} vsLabel={prevLabel} format="pct" />}
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-3">
                <Dot cat="economia" />
                <div className="flex-1 h-2 bg-surface-strong rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${economiaPct}%`,
                      backgroundColor: POSITIVE,
                    }}
                  />
                </div>
              </div>
            </section>

            {/* ── Custo de vida ── */}
            <section className="px-4 py-4 border-b border-hairline-soft">
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold text-ink">Custo de vida</span>
                <div className="text-right">
                  <p className="text-base font-semibold tabular-nums text-ink">{fmt(data.custoVida)}</p>
                  <p className="text-xs text-muted mt-0.5">{custoLabel}</p>
                  {prevMonthData && <DeltaRow current={data.custoVida} prev={prevMonthData.custoVida} vsLabel={prevLabel} invert />}
                </div>
              </div>
            </section>

            {/* ── Diário médio ── */}
            <section className="px-4 py-4 border-b border-hairline-soft">
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold text-ink">Diário médio</span>
                <div className="text-right">
                  <p
                    className="text-base font-semibold tabular-nums"
                    style={{ color: diarioColor }}
                  >
                    {fmt(data.diarioMedio)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {diarioLabel} · meta: {fmt(data.diarioPrev)}
                  </p>
                  {prevMonthData && <DeltaRow current={data.diarioMedio} prev={prevMonthData.diarioMedio} vsLabel={prevLabel} invert />}
                </div>
              </div>
            </section>

            {/* ═══ Movimentações do mês ═══ */}
            {!isBlocked && (
              <>
                <p className="px-4 pt-5 pb-2 text-xs font-medium text-muted">
                  Movimentações do mês
                </p>

                <MovimentacaoItem tipo="entrada" total={data.entradas} month={month} />
                <MovimentacaoItem tipo="saida" total={data.saidas} month={month} />
                <MovimentacaoItem tipo="diario" total={data.diarios} month={month} />
                <MovimentacaoItem tipo="economia" total={data.economia} month={month} />
              </>
            )}
          </div>
        </div>
      )}

      {!loading && !data && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Sem dados para este mês.
        </div>
      )}

      <ProUpsellSheet
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        context="totais"
      />
    </div>
  );
}
