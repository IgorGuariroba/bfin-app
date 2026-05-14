"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminBackLink } from "@/components/admin/admin-back-link";

export default function AdminPrecosPage() {
  const [monthly, setMonthly] = useState("");
  const [annual, setAnnual] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/plan-config")
      .then((r) => r.json())
      .then((d) => {
        setMonthly(String(d.monthlyAmount));
        setAnnual(String(d.annualAmount));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/plan-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyAmount: parseFloat(monthly),
        annualAmount: parseFloat(annual),
      }),
    });
    setSaving(false);
    setMessage(res.ok ? "Salvo com sucesso!" : "Erro ao salvar.");
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <AdminBackLink />

      <Card className="rounded-[14px]">
        <CardHeader>
          <CardTitle>Preços do plano Pro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
            </div>
            <Button type="submit" disabled={saving || loading} className="w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            {message && <p className="text-center text-sm text-muted">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
