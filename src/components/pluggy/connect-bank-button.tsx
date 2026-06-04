"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PluggyConnect } from "react-pluggy-connect";
import { Landmark, Loader2, Trash2 } from "lucide-react";

type BankItem = {
  id: string;
  connector: string;
  status: string;
  lastSyncedAt: string | null;
  connectedBy: { id: string; name: string };
};

const STATUS_LABEL: Record<string, string> = {
  UPDATED: "Sincronizado",
  UPDATING: "Sincronizando…",
  LOGIN_ERROR: "Reconectar",
  OUTDATED: "Desatualizado",
  WAITING_USER_INPUT: "Ação necessária",
};

/**
 * Seção de conexão bancária (Open Finance / Pluggy).
 * Lista bancos conectados ao pool da conta e permite conectar/desconectar.
 * Numa conta compartilhada, cada gestor pode conectar o próprio banco — os dados
 * caem no mesmo pool, com atribuição de quem conectou.
 */
export function ConnectBankButton({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<BankItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/pluggy/items");
      if (!res.ok) return;
      const data: BankItem[] = await res.json();
      setItems(data);
    } catch {
      // silencioso — lista vazia é estado válido
    }
  }, []);

  useEffect(() => {
    // loadItems só altera estado após o await do fetch (fonte externa), não de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isPro) loadItems();
  }, [isPro, loadItems]);

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

  async function disconnect(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/pluggy/items/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadItems();
        router.refresh();
      } else {
        setError("Falha ao desconectar.");
      }
    } catch {
      setError("Falha ao desconectar.");
    } finally {
      setRemovingId(null);
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
      {items.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-canvas p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Landmark size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.connector}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {STATUS_LABEL[item.status] ?? item.status} · por {item.connectedBy.name}
                </p>
              </div>
              <button
                onClick={() => disconnect(item.id)}
                disabled={removingId === item.id}
                title="Desconectar"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-red-500 disabled:opacity-50"
              >
                {removingId === item.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={startConnect}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-60 transition-transform active:scale-95"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Landmark size={18} />}
        {items.length > 0 ? "Conectar outro banco" : "Conectar banco"}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {token && (
        <PluggyConnect
          connectToken={token}
          onSuccess={() => {
            setToken(null);
            loadItems();
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
