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

const POSITIVE = "#2db55d";
const MONTH_NAMES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function prevMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return MONTH_NAMES[d.getMonth()];
}

function Delta({
  current, prev, vsLabel, invert = false, format = "money",
  className = "",
}: {
  current: number; prev: number | null; vsLabel: string;
  invert?: boolean; format?: "money" | "pct"; className?: string;
}) {
  if (prev === null) {
    return <span className={`text-xs text-muted/60 ${className}`}>— vs {vsLabel}</span>;
  }
  const diff = current - prev;
  if (diff === 0) return <span className={`text-xs text-muted/60 ${className}`}>vs {vsLabel}</span>;
  const up = diff > 0;
  const good = invert ? !up : up;
  const valueStr = format === "pct"
    ? `${up ? "+" : ""}${Math.round(diff)}pp`
    : `${up ? "↑" : "↓"} ${fmt(Math.abs(diff))}`;
  return (
    <span className={`text-xs ${className}`}>
      <span style={{ color: good ? POSITIVE : "var(--color-rausch)" }}>{valueStr}</span>
      <span className="text-muted/60"> vs {vsLabel}</span>
    </span>
  );
}

export default function TotaisPage() {
  const { month, prev, next, label } = useMonth();
  const { isFutureLocked } = usePlan();
  const isBlocked = isFutureLocked(month);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const totaisResult = useTotais(isBlocked ? "" : month);
  const data = isBlocked ? generateFakeTotaisData(month) : totaisResult.data;
  const loading = isBlocked ? false : totaisResult.loading;

  const economiaPct =
    data && data.entradas > 0
      ? Math.min(100, Math.round((data.economia / data.entradas) * 100))
      : 0;

  const perfLabel =
    data ? (data.saldoAtual >= 0 ? "Sobrou dinheiro" : "Faltou dinheiro") : "";

  const econLabel =
    data ? (data.economia > 0 ? `${economiaPct}% da renda` : "Nada guardado") : "";

  const custoLabel =
    data ? (data.custoVida <= data.entradas ? "Abaixo da renda" : "Acima da renda") : "";

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
        ? `Na meta · ${fmt(data.diarioPrev)}`
        : diarioPct > 0
          ? `+${diarioPct}% da meta · ${fmt(data.diarioPrev)}`
          : `${diarioPct}% da meta · ${fmt(data.diarioPrev)}`
      : "";

  const isPartialMonth = data ? data.daysElapsed < data.daysInMonth : false;
  const prevLabel = prevMonthLabel(month);
  const prevMonthData = data?.prevMonth ?? null;

  return (
    <div className="flex flex-col pb-20">
      <MonthHeader
        month={label}
        onPrev={prev}
        onNext={next}
        className="mx-3 mt-2 rounded-2xl border border-hairline shadow-sm"
      />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <div className="relative">
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
            <p className="px-4 pt-5 pb-3 text-xs font-semibold tracking-widest uppercase text-muted/70">
              Cálculos do mês
            </p>

            {/* ── Performance card ── */}
            <div className="mx-4 mb-3 rounded-2xl border border-hairline shadow-sm bg-canvas px-6 py-6 flex flex-col items-center text-center">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted/60 mb-3">
                Performance
              </p>
              <p
                className="text-4xl font-bold tabular-nums leading-none"
                style={{ color: data.saldoAtual >= 0 ? POSITIVE : "var(--color-rausch)" }}
              >
                {data.saldoAtual < 0 ? "– " : ""}{fmt(Math.abs(data.saldoAtual))}
              </p>
              <div className="mt-2 flex flex-col items-center gap-0.5">
                <Delta
                  current={data.saldoAtual}
                  prev={prevMonthData?.saldoAtual ?? null}
                  vsLabel={prevLabel}
                />
                <span className="text-xs text-muted/70">{perfLabel}</span>
                {isPartialMonth && (
                  <span className="text-xs text-muted/50">dia {data.daysElapsed} de {data.daysInMonth}</span>
                )}
              </div>
            </div>

            {/* ── 3 métricas (cards separados) ── */}
            <div className="px-4 space-y-2.5 mb-2">

              {/* Economizado */}
              <div className="rounded-2xl border border-hairline shadow-sm bg-canvas px-4 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Economizado</p>
                  <p className="text-xs text-muted/70 mt-0.5">{econLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold tabular-nums text-ink">{economiaPct}%</p>
                  <Delta
                    current={economiaPct}
                    prev={prevMonthData?.economiaPct ?? null}
                    vsLabel={prevLabel}
                    format="pct"
                    className="block mt-0.5"
                  />
                </div>
              </div>

              {/* Custo de vida */}
              <div className="rounded-2xl border border-hairline shadow-sm bg-canvas px-4 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Custo de vida</p>
                  <p className="text-xs text-muted/70 mt-0.5">{custoLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold tabular-nums text-ink">{fmt(data.custoVida)}</p>
                  <Delta
                    current={data.custoVida}
                    prev={prevMonthData?.custoVida ?? null}
                    vsLabel={prevLabel}
                    invert
                    className="block mt-0.5"
                  />
                </div>
              </div>

              {/* Diário médio */}
              <div className="rounded-2xl border border-hairline shadow-sm bg-canvas px-4 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Diário médio</p>
                  <p className="text-xs text-muted/70 mt-0.5">{diarioLabel}</p>
                </div>
                <div className="text-right">
                  <p
                    className="text-base font-bold tabular-nums"
                    style={{ color: diarioColor }}
                  >
                    {fmt(data.diarioMedio)}
                  </p>
                  <Delta
                    current={data.diarioMedio}
                    prev={prevMonthData?.diarioMedio ?? null}
                    vsLabel={prevLabel}
                    invert
                    className="block mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* ═══ Movimentações do mês ═══ */}
            {!isBlocked && (
              <>
                <p className="px-4 pt-5 pb-3 text-xs font-semibold tracking-widest uppercase text-muted/70">
                  Movimentações do mês
                </p>

                <div className="px-4 space-y-2.5">
                  <MovimentacaoItem tipo="entrada" total={data.entradas} month={month} />
                  <MovimentacaoItem tipo="saida" total={data.saidas} month={month} />
                  <MovimentacaoItem tipo="diario" total={data.diarios} month={month} />
                  <MovimentacaoItem tipo="economia" total={data.economia} month={month} />
                </div>
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
