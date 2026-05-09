"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlan } from "@/hooks/use-plan";
import { ChevronLeft, Zap, Check, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fmt = (amount: number) =>
  amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type SubscriptionData = {
  plan: string;
  planExpiresAt: string | null;
  mpSubscriptionId: string | null;
};

type PlanPrices = {
  monthly: number;
  annual: number;
};

export default function AssinarPage() {
  const { plan } = usePlan();
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get("success") === "true";

  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [prices, setPrices] = useState<PlanPrices | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<"monthly" | "annual" | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/plan-prices")
      .then((r) => r.json())
      .then(setPrices);
  }, []);

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

  const annualMonthlyEquiv = prices ? fmt(prices.annual / 12) : null;

  return (
    <div className="flex flex-col min-h-full bg-canvas px-4 pt-12 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="secondary" size="icon" className="rounded-full shrink-0" asChild>
          <Link href="/menu">
            <ChevronLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-[20px] font-semibold leading-[1.20] tracking-[-0.18px] text-ink">Plano Pro</h1>
      </div>

      {/* Success banner */}
      {success && (
        <Card className="flex-row items-center gap-3 rounded-[14px] mb-6 py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <Check size={20} className="text-rausch shrink-0" />
            <p className="text-[14px] text-ink font-medium">
              Assinatura em processamento. Seu plano será ativado em instantes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error banner */}
      {error && (
        <Card className="flex-row items-center gap-3 rounded-[14px] mb-6 py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle size={20} className="text-error shrink-0" />
            <p className="text-[14px] text-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {plan === "pro" ? (
        /* ── Pro state ── */
        <Card className="rounded-[14px] py-0">
          <CardHeader className="flex-row items-center gap-3 pb-0 pt-6">
            <Button variant="default" size="icon" className="rounded-full shrink-0 pointer-events-none">
              <Zap size={20} />
            </Button>
            <div>
              <CardTitle className="text-[16px] font-semibold text-ink">Plano Pro ativo</CardTitle>
              {formattedExpiry && (
                <p className="text-[13px] text-muted">Renova em {formattedExpiry}</p>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 pb-6">
            <ul className="flex flex-col gap-2 mb-6">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-ink">
                  <Check size={14} className="text-rausch shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {cancelConfirm ? (
              <div className="rounded-[8px] bg-surface-soft border border-hairline p-4">
                <p className="text-[14px] text-error font-medium mb-3">
                  Cancelar assinatura? Você perderá o acesso Pro ao fim do período atual.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 h-12 rounded-[8px] bg-error text-on-primary hover:bg-error/90 text-[14px]"
                  >
                    {cancelling ? <Loader2 size={16} className="animate-spin" /> : null}
                    Confirmar cancelamento
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setCancelConfirm(false)}
                    className="flex-1 h-12 rounded-[8px] text-[14px]"
                  >
                    Manter assinatura
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setCancelConfirm(true)}
                className="w-full h-12 rounded-[8px] text-muted text-[14px]"
              >
                Cancelar assinatura
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ── Free state — pricing cards ── */
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-muted mb-2">
            Desbloqueie o histórico completo e o compartilhamento de conta.
          </p>

          <ul className="flex flex-col gap-2 mb-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[14px] text-ink">
                <Check size={14} className="text-rausch shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Annual card — highlighted */}
          <Card className="rounded-[14px] border-2 border-rausch relative py-0 overflow-visible mt-2">
            <Badge className="absolute -top-3 left-4 rounded-full px-3 py-1 text-[11px]">
              33% off
            </Badge>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-1">
                <CardTitle className="text-[16px] font-semibold text-ink">Anual</CardTitle>
                <p className="text-[20px] font-semibold text-ink">
                  {prices ? fmt(prices.annual) : "—"}
                  <span className="text-[13px] font-normal text-muted">/ano</span>
                </p>
              </div>
              <p className="text-[13px] text-muted mb-4">
                {annualMonthlyEquiv ? <>equivale a {annualMonthlyEquiv}/mês</> : " "}
              </p>
              <Button
                variant="default"
                onClick={() => handleSubscribe("annual")}
                disabled={loadingCheckout !== null || !prices}
                className="w-full h-12 rounded-[8px] text-[16px] gap-2"
              >
                {loadingCheckout === "annual" ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                Assinar anual
              </Button>
            </CardContent>
          </Card>

          {/* Monthly card */}
          <Card className="rounded-[14px] py-0">
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between mb-1">
                <CardTitle className="text-[16px] font-semibold text-ink">Mensal</CardTitle>
                <p className="text-[20px] font-semibold text-ink">
                  {prices ? fmt(prices.monthly) : "—"}
                  <span className="text-[13px] font-normal text-muted">/mês</span>
                </p>
              </div>
              <p className="text-[13px] text-muted mb-4">cancele quando quiser</p>
              <Button
                variant="outline"
                onClick={() => handleSubscribe("monthly")}
                disabled={loadingCheckout !== null || !prices}
                className="w-full h-12 rounded-[8px] text-[16px] gap-2"
              >
                {loadingCheckout === "monthly" ? <Loader2 size={18} className="animate-spin" /> : null}
                Assinar mensal
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-[13px] text-muted mt-2">
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
