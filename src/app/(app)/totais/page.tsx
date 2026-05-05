"use client";

import { MonthHeader } from "@/components/layout/month-header";
import { MovimentacaoItem } from "@/components/totais/movimentacao-item";
import { useMonth } from "@/hooks/use-month";
import { useTotais } from "@/hooks/use-totais";
import { fmt } from "@/lib/utils";
import { CAT_COLORS } from "@/lib/constants";

/* ── Tiny colored circle for formulas ─── */
function Dot({ cat, size = 20 }: { cat: string; size?: number }) {
  const initials: Record<string, string> = {
    entrada: "E", saida: "S", diario: "D", cartao: "C", economia: "G",
  };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-bold shrink-0"
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

function Operator({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground font-medium mx-0.5">{children}</span>;
}

export default function TotaisPage() {
  const { month, prev, next, label } = useMonth();
  const { data, loading } = useTotais(month);

  const economiaPct =
    data && data.entradas > 0
      ? Math.min(100, Math.round((data.economia / data.entradas) * 100))
      : 0;

  const perfLabel =
    data
      ? data.performance >= 0
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

  return (
    <div className="flex flex-col pb-20">
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <>
          {/* ═══ Cálculos do mês ═══ */}
          <p className="px-4 pt-4 pb-2 text-xs text-muted-foreground">
            Cálculos do mês
          </p>

          {/* ── Performance ── */}
          <section className="px-4 py-4 border-b border-hairline-soft">
            <div className="flex items-start justify-between">
              <span className="text-[15px] font-bold text-ink">Performance</span>
              <div className="text-right">
                <p
                  className="text-[15px] font-bold tabular-nums"
                  style={{ color: data.performance >= 0 ? "#2db55d" : "var(--rausch)" }}
                >
                  {data.performance < 0 ? "– " : ""}{fmt(Math.abs(data.performance))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{perfLabel}</p>
              </div>
            </div>
            {/* Formula: E - S - D - G - C = D */}
            <div className="flex items-center gap-0.5 mt-3">
              <Dot cat="entrada" />
              <Operator>–</Operator>
              <Dot cat="saida" />
              <Operator>–</Operator>
              <Dot cat="diario" />
              <Operator>–</Operator>
              <Dot cat="economia" />
              <Operator>–</Operator>
              <Dot cat="cartao" />
              <Operator>=</Operator>
              <Dot cat="diario" size={18} />
            </div>
          </section>

          {/* ── Economizado ── */}
          <section className="px-4 py-4 border-b border-hairline-soft">
            <div className="flex items-start justify-between">
              <span className="text-[15px] font-bold text-ink">Economizado</span>
              <div className="text-right">
                <p className="text-[15px] font-bold tabular-nums text-ink">{economiaPct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">{econLabel}</p>
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
                    backgroundColor: "#2db55d",
                  }}
                />
              </div>
              <Dot cat="economia" />
            </div>
          </section>

          {/* ── Custo de vida ── */}
          <section className="px-4 py-4 border-b border-hairline-soft">
            <div className="flex items-start justify-between">
              <span className="text-[15px] font-bold text-ink">Custo de vida</span>
              <div className="text-right">
                <p className="text-[15px] font-bold tabular-nums text-ink">{fmt(data.custoVida)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{custoLabel}</p>
              </div>
            </div>
            {/* Formula: S + D + C + D */}
            <div className="flex items-center gap-0.5 mt-3">
              <Dot cat="saida" />
              <Operator>+</Operator>
              <Dot cat="diario" />
              <Operator>+</Operator>
              <Dot cat="cartao" />
              <Operator>+</Operator>
              <Dot cat="diario" size={18} />
            </div>
          </section>

          {/* ── Diário médio ── */}
          <section className="px-4 py-4 border-b border-hairline-soft">
            <div className="flex items-start justify-between">
              <span className="text-[15px] font-bold text-ink">Diário médio</span>
              <div className="text-right">
                <p className="text-[15px] font-bold tabular-nums text-ink">{fmt(data.diarioMedio)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-muted-foreground text-[8px] text-muted-foreground">⊙</span>
                  {fmt(data.diarioPrev)}
                </p>
              </div>
            </div>
            {/* Formula: D / 0 */}
            <div className="flex items-center gap-0.5 mt-3">
              <Dot cat="diario" />
              <Operator>/</Operator>
              <span className="text-xs text-muted-foreground font-medium">{data.daysElapsed}</span>
            </div>
          </section>

          {/* ═══ Movimentações do mês ═══ */}
          <p className="px-4 pt-5 pb-2 text-xs text-muted-foreground">
            Movimentações do mês
          </p>

          <MovimentacaoItem tipo="entrada" total={data.entradas} month={month} />
          <MovimentacaoItem tipo="saida" total={data.saidas} month={month} />
          <MovimentacaoItem tipo="diario" total={data.diarios} month={month} />
          <MovimentacaoItem tipo="economia" total={data.economia} month={month} />
        </>
      )}

      {!loading && !data && (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Sem dados para este mês.
        </div>
      )}
    </div>
  );
}
