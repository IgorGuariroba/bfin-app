"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function AdminPrecosPage() {
  const [monthly, setMonthly] = useState("");
  const [annual, setAnnual] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/plan-config")
      .then((r) => r.json())
      .then((d) => {
        setMonthly(String(d.monthlyAmount));
        setAnnual(String(d.annualAmount));
        if (d.updatedAt) setUpdatedAt(d.updatedAt);
      })
      .catch(() => toast.error("Erro ao carregar preços"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/plan-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyAmount: parseFloat(monthly),
          annualAmount: parseFloat(annual),
        }),
      });
      if (res.ok) {
        const d = await res.json().catch(() => null);
        if (d?.updatedAt) setUpdatedAt(d.updatedAt);
        toast.success("Preços atualizados");
      } else {
        toast.error("Erro ao salvar preços");
      }
    } catch {
      toast.error("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const monthlyNum = parseFloat(monthly) || 0;
  const annualNum = parseFloat(annual) || 0;
  const discount = monthlyNum > 0 ? Math.round((1 - annualNum / (monthlyNum * 12)) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">Preços</h1>
        <p className="mt-1 text-[14px] text-muted">Valores cobrados pelo plano Pro.</p>
      </div>

      <Card className="rounded-[14px]">
        <CardHeader>
          <CardTitle>Plano Pro</CardTitle>
          <CardDescription>
            {updatedAt ? `Última atualização: ${dateFmt.format(new Date(updatedAt))}` : "Configure os valores cobrados."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly">Mensal (R$)</Label>
                <Input
                  id="monthly"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual">Anual (R$)</Label>
                <Input
                  id="annual"
                  type="number"
                  step="0.01"
                  min="0"
                  value={annual}
                  onChange={(e) => setAnnual(e.target.value)}
                  disabled={loading}
                  required
                />
                {discount > 0 && (
                  <p className="text-xs text-muted">
                    Desconto de <strong>{discount}%</strong> vs. {(monthlyNum * 12).toFixed(2).replace(".", ",")}/ano
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
              <Button type="submit" disabled={saving || loading}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
