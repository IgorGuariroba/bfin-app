"use client";

import { useEffect, useState } from "react";
import { Loader2, Copy, Check, Trash2, Plus, Sparkles, Bot } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";

type ApiKeyView = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssistentePanel() {
  const { plan } = usePlan();
  const [keys, setKeys] = useState<ApiKeyView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [plain, setPlain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const mcpUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "";

  async function load() {
    try {
      const res = await fetch("/api/apikeys");
      if (res.ok) setKeys(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (plan === "pro") void load();
  }, [plan]);

  async function gerar() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/apikeys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar token");
        return;
      }
      setPlain(data.plain);
      setCopied(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revogar(id: string) {
    setError("");
    const res = await fetch(`/api/apikeys/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else setError("Erro ao revogar token");
  }

  async function copiar() {
    if (!plain) return;
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (plan !== "pro") {
    return (
      <div className="rounded-[14px] bg-surface-card p-4 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-ink" />
          <p className="text-[14px] font-semibold text-ink">Assistente (MCP)</p>
        </div>
        <p className="text-[14px] text-[#6a6a6a] mb-3">
          Conecte um agente (Claude, ChatGPT) para registrar e consultar seus
          gastos por conversa. Recurso do plano Pro.
        </p>
        <a
          href="/assinar"
          className="inline-flex items-center justify-center rounded-[8px] bg-primary px-4 py-[12px] text-[14px] font-medium text-white transition-transform active:scale-95"
        >
          Assinar plano Pro
        </a>
      </div>
    );
  }

  const ativa = keys.find((k) => !k.revokedAt);

  return (
    <div className="rounded-[14px] bg-surface-card p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <Bot size={18} className="text-ink" />
        <p className="text-[14px] font-semibold text-ink">Assistente (MCP)</p>
      </div>

      <p className="text-[14px] text-[#6a6a6a] mb-3">
        Cole no seu client (Claude, ChatGPT) a URL abaixo e o token.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-[#6a6a6a]">URL do servidor</label>
          <code className="rounded-[8px] border border-[#dddddd] bg-surface-soft px-3 py-[12px] text-[13px] text-ink break-all">
            {mcpUrl}
          </code>
        </div>

        {plain ? (
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-[#6a6a6a]">
              Token (mostrado apenas esta vez)
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[12px] text-[13px] text-ink break-all">
                {plain}
              </code>
              <button
                onClick={copiar}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[8px] bg-primary text-white transition-transform active:scale-95"
                aria-label="Copiar token"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={gerar}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-[8px] bg-primary py-[12px] text-[14px] font-medium text-white h-[44px] disabled:opacity-60 transition-transform active:scale-95"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : ativa ? (
              <>
                <Plus size={16} /> Gerar novo (revoga o atual)
              </>
            ) : (
              <>
                <Plus size={16} /> Gerar token
              </>
            )}
          </button>
        )}

        {error && <p className="text-[13px] text-[#c13515]">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 size={16} className="animate-spin text-[#929292]" />
          </div>
        ) : (
          keys.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-[8px] border border-[#dddddd] bg-canvas px-3 py-[10px]"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] text-ink">
                      {k.prefix}
                      {k.revokedAt && (
                        <span className="ml-2 text-[12px] text-[#929292]">(revogado)</span>
                      )}
                    </span>
                    <span className="text-[12px] text-[#929292]">
                      usado {fmtDate(k.lastUsedAt)} · criado {fmtDate(k.createdAt)}
                    </span>
                  </div>
                  {!k.revokedAt && (
                    <button
                      onClick={() => revogar(k.id)}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-[6px] text-[#929292] hover:text-[#c13515] transition-colors"
                      aria-label="Revogar token"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
