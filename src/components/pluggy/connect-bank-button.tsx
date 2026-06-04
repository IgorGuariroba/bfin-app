"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PluggyConnect } from "react-pluggy-connect";
import { Landmark, Loader2 } from "lucide-react";

/**
 * Botão que inicia a conexão bancária via Open Finance (Pluggy).
 * Busca um connect token no backend (Pro-only) e abre o widget Pluggy Connect.
 * As movimentações entram automaticamente via webhook — sem lançamento manual.
 */
export function ConnectBankButton({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startConnect() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/pluggy/connect-token", { method: "POST" });
      const data: { accessToken?: string; error?: string } = await res.json();
      if (!res.ok || !data.accessToken) {
        setError(data.error === "plan_required" ? "Disponível no plano Pro." : "Falha ao conectar.");
        return;
      }
      setToken(data.accessToken);
    } catch {
      setError("Falha ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <p className="text-sm text-muted-foreground">
        Conecte seu banco e deixe as movimentações entrarem sozinhas — disponível no plano Pro.
      </p>
    );
  }

  return (
    <>
      <button
        onClick={startConnect}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60 transition-transform active:scale-95"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Landmark size={18} />}
        Conectar banco
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {token && (
        <PluggyConnect
          connectToken={token}
          onSuccess={() => {
            setToken(null);
            router.refresh();
          }}
          onError={() => {
            setToken(null);
            setError("Conexão não concluída.");
          }}
          onClose={() => setToken(null)}
        />
      )}
    </>
  );
}
