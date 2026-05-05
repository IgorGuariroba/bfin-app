"use client";

import { MonthHeader } from "@/components/layout/month-header";
import { MetricRow } from "@/components/totais/metric-row";
import { MovimentacaoItem } from "@/components/totais/movimentacao-item";
import { useMonth } from "@/hooks/use-month";
import { useTotais } from "@/hooks/use-totais";
import { Progress } from "@/components/ui/progress";
import { fmt } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/constants";
import Link from "next/link";

const OUTFLOW: Category[] = ["saida", "diario", "cartao", "economia"];

export default function TotaisPage() {
  const { month, prev, next, label } = useMonth();
  const { data, loading } = useTotais(month);

  const economiaPct =
    data && data.entradas > 0
      ? Math.min(100, Math.round((data.economia / data.entradas) * 100))
      : 0;

  return (
    <div className="flex flex-col">
      <MonthHeader month={label} onPrev={prev} onNext={next} />

      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-muted)]">
          Carregando...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Performance */}
          <section className="px-4 pt-4 pb-2 border-b border-[var(--color-hairline-soft)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1">
              Performance
            </p>
            <MetricRow
              label="Entradas"
              value={data.entradas}
              valueColor="text-[#2db55d]"
              large
            />
            <MetricRow
              label="Custo de vida"
              value={-data.custoVida}
              valueColor="text-[var(--color-rausch)]"
              large
            />
            <div className="flex items-center justify-between py-3 border-t border-[var(--color-hairline-soft)] mt-1">
              <span className="text-sm font-bold text-[var(--color-ink)]">Resultado</span>
              <span
                className={`text-base font-bold tabular-nums ${
                  data.performance >= 0
                    ? "text-[#2db55d]"
                    : "text-[var(--color-rausch)]"
                }`}
              >
                {fmt(data.performance)}
              </span>
            </div>
          </section>

          {/* Economizado */}
          <section className="px-4 py-3 border-b border-[var(--color-hairline-soft)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Economizado
              </p>
              <span className="text-xs text-[var(--color-muted)]">{economiaPct}%</span>
            </div>
            <Progress value={economiaPct} className="h-2 mb-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-body-text)]">Guardado</span>
              <span className="text-sm font-semibold tabular-nums text-[#2db55d]">
                {fmt(data.economia)}
              </span>
            </div>
          </section>

          {/* Custo de vida breakdown */}
          <section className="px-4 py-3 border-b border-[var(--color-hairline-soft)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1">
              Custo de vida
            </p>
            <MetricRow label="Saídas" value={data.saidas} />
            <MetricRow label="Cartão" value={data.cartao} />
            <MetricRow label="Diário" value={data.diarios} />
            <div className="flex items-center justify-between py-2 border-t border-[var(--color-hairline-soft)] mt-1">
              <span className="text-sm font-semibold text-[var(--color-ink)]">Total</span>
              <span className="text-sm font-bold tabular-nums text-[var(--color-ink)]">
                {fmt(data.custoVida)}
              </span>
            </div>
          </section>

          {/* Diário médio */}
          <section className="px-4 py-3 border-b border-[var(--color-hairline-soft)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1">
              Diário médio
            </p>
            <MetricRow
              label="Realizado"
              value={data.diarioMedio}
              sublabel={`${data.daysElapsed} dias`}
            />
            <MetricRow
              label="Previsto"
              value={data.diarioPrev}
              sublabel={`${data.daysInMonth} dias`}
              valueColor={
                data.diarioPrev > 0 && data.diarioMedio > data.diarioPrev
                  ? "text-[var(--color-rausch)]"
                  : undefined
              }
            />
          </section>

          {/* Movimentações */}
          <section className="pt-3">
            <p className="px-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-1">
              Movimentações
            </p>
            <MovimentacaoItem tipo="entrada" total={data.entradas} month={month} />
            {OUTFLOW.map((tipo) => {
              const val =
                tipo === "saida"
                  ? data.saidas
                  : tipo === "diario"
                  ? data.diarios
                  : tipo === "cartao"
                  ? data.cartao
                  : data.economia;
              return (
                <MovimentacaoItem key={tipo} tipo={tipo} total={val} month={month} />
              );
            })}
            <Link
              href={`/movimentacoes/all?month=${month}`}
              className="flex items-center justify-center py-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Ver todas
            </Link>
          </section>
        </>
      )}

      {!loading && !data && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--color-muted)]">
          Sem dados para este mês.
        </div>
      )}
    </div>
  );
}
