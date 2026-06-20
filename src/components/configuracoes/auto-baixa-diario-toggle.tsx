"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";
import { Switch } from "@/components/ui/switch";

/**
 * Toggle da "Baixa automática do gasto diário" (ADR-0005). Exclusiva do plano
 * pro; para free mostra o lock de upsell. Estado vem do GET /api/user e é
 * persistido via PATCH /api/user — a regra de plano é validada no servidor.
 */
export function AutoBaixaDiarioToggle() {
  const { plan } = usePlan();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setEnabled(Boolean(d.autoBaixaDiario));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleToggle(next: boolean) {
    setSaving(true);
    setEnabled(next); // otimista
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoBaixaDiario: next }),
    });
    if (!res.ok) setEnabled(!next); // reverte em erro (ex.: 403 se não for pro)
    setSaving(false);
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Gasto diário
      </h2>
      <div className="rounded-3xl bg-surface p-5 shadow-sm">
        {plan === "free" ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft">
              <Lock size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-ink">Disponível no plano Pro</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Apague o gasto diário de hoje automaticamente, todo dia, com o plano Pro.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-ink">Baixa automática</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Todo dia apagamos o gasto diário (a projeção) do dia atual — você lança só o
                que de fato gastou.
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading || saving}
              aria-label="Baixa automática do gasto diário"
            />
          </div>
        )}
      </div>
    </section>
  );
}
