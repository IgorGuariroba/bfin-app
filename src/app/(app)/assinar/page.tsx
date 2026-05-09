"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlan } from "@/hooks/use-plan";
import { ChevronLeft, Zap, Check, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const MONTHLY_PRICE = "R$ 14,90";
const ANNUAL_PRICE = "R$ 119,90";
const ANNUAL_MONTHLY_EQUIV = "R$ 9,99";

type SubscriptionData = {
  plan: string;
  planExpiresAt: string | null;
  mpSubscriptionId: string | null;
};

export default function AssinarPage() {
  const { plan } = usePlan();
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";

  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<"monthly" | "annual" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (plan === "pro") {
      fetch("/api/subscription")
        .then((r) => r.json())
        .then(setSub);
    }
  }, [plan]);

  async function handleSubscribe(cycle: "monthly" | "annual") {
    setLoadingCheckout(cycle);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar assinatura");
      window.location.href = data.init_point;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
      setLoadingCheckout(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError("");
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao cancelar");
      setCancelConfirm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCancelling(false);
    }
  }

  const expiresAt = sub?.planExpiresAt ? new Date(sub.planExpiresAt) : null;
  const formattedExpiry = expiresAt
    ? expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[20px] font-semibold leading-[1.20] tracking-[-0.18px] text-ink">Plano Pro</h1>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 rounded-[14px] bg-green-50 border border-green-200 p-4 mb-6">
          <Check size={20} className="text-green-600 shrink-0" />
          <p className="text-[14px] text-green-700 font-medium">
            Assinatura em processamento. Seu plano será ativado em instantes.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-[14px] bg-red-50 border border-red-200 p-4 mb-6">
          <AlertTriangle size={20} className="text-red-600 shrink-0" />
          <p className="text-[14px] text-red-700">{error}</p>
        </div>
      )}

      {plan === "pro" ? (
        /* ── Pro state ── */
        <div
          className="rounded-[14px] bg-surface-card p-6"
          style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[16px] font-semibold text-ink">Plano Pro ativo</p>
              {formattedExpiry && (
                <p className="text-[13px] text-[#6a6a6a]">Renova em {formattedExpiry}</p>
              )}
            </div>
          </div>

          <ul className="flex flex-col gap-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[14px] text-ink">
                <Check size={14} className="text-green-600 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {cancelConfirm ? (
            <div className="rounded-[10px] bg-red-50 border border-red-200 p-4">
              <p className="text-[14px] text-red-700 font-medium mb-3">
                Cancelar assinatura? Você perderá o acesso Pro ao fim do período atual.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 rounded-[10px] bg-red-600 text-white text-[14px] font-semibold py-2.5 disabled:opacity-60"
                >
                  {cancelling ? <Loader2 size={16} className="animate-spin" /> : null}
                  Confirmar cancelamento
                </button>
                <button
                  onClick={() => setCancelConfirm(false)}
                  className="flex-1 rounded-[10px] bg-surface-strong text-ink text-[14px] font-semibold py-2.5"
                >
                  Manter assinatura
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCancelConfirm(true)}
              className="w-full rounded-[10px] bg-surface-strong text-[#6a6a6a] text-[14px] font-medium py-2.5"
            >
              Cancelar assinatura
            </button>
          )}
        </div>
      ) : (
        /* ── Free state — pricing cards ── */
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-[#6a6a6a] mb-2">
            Desbloqueie o histórico completo e o compartilhamento de conta.
          </p>

          <ul className="flex flex-col gap-2 mb-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[14px] text-ink">
                <Check size={14} className="text-green-600 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Annual card — highlighted */}
          <div
            className="rounded-[14px] bg-surface-card p-5 border-2 border-green-500 relative"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
          >
            <span className="absolute -top-3 left-4 rounded-full bg-green-500 text-white text-[11px] font-semibold px-3 py-1">
              33% off
            </span>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[16px] font-semibold text-ink">Anual</p>
              <p className="text-[20px] font-bold text-ink">{ANNUAL_PRICE}<span className="text-[13px] font-normal text-[#6a6a6a]">/ano</span></p>
            </div>
            <p className="text-[13px] text-[#6a6a6a] mb-4">equivale a {ANNUAL_MONTHLY_EQUIV}/mês</p>
            <button
              onClick={() => handleSubscribe("annual")}
              disabled={loadingCheckout !== null}
              className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-green-600 text-white text-[15px] font-semibold py-3 disabled:opacity-60"
            >
              {loadingCheckout === "annual" ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Assinar anual
            </button>
          </div>

          {/* Monthly card */}
          <div
            className="rounded-[14px] bg-surface-card p-5"
            style={{ boxShadow: "rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px, rgba(0,0,0,0.1) 0 4px 8px" }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-[16px] font-semibold text-ink">Mensal</p>
              <p className="text-[20px] font-bold text-ink">{MONTHLY_PRICE}<span className="text-[13px] font-normal text-[#6a6a6a]">/mês</span></p>
            </div>
            <p className="text-[13px] text-[#6a6a6a] mb-4">cancele quando quiser</p>
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loadingCheckout !== null}
              className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-surface-strong text-ink text-[15px] font-semibold py-3 disabled:opacity-60"
            >
              {loadingCheckout === "monthly" ? <Loader2 size={18} className="animate-spin" /> : null}
              Assinar mensal
            </button>
          </div>

          <p className="text-center text-[12px] text-[#6a6a6a] mt-2">
            Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
          </p>
        </div>
      )}
    </div>
  );
}

const PRO_FEATURES = [
  "Histórico completo sem limite de meses",
  "Compartilhar conta com outra pessoa",
];
