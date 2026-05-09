"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "1g0r.guari@gmail.com";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [monthly, setMonthly] = useState("");
  const [annual, setAnnual] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.email !== ADMIN_EMAIL) {
      router.replace("/saldos");
      return;
    }
    fetch("/api/admin/plan-config")
      .then((r) => r.json())
      .then((d) => {
        setMonthly(String(d.monthlyAmount));
        setAnnual(String(d.annualAmount));
      });
  }, [session, status, router]);

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

  if (status === "loading" || session?.user?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="max-w-md mx-auto mt-12 p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin — Preços do plano Pro</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Anual (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={annual}
            onChange={(e) => setAnnual(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {message && <p className="text-sm text-center">{message}</p>}
      </form>
    </div>
  );
}
