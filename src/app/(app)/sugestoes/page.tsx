"use client";

import { useState } from "react";
import { Lightbulb, Bug, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/layout/back-header";

type Category = "feature" | "bug" | "improvement" | "other";

const CATEGORIES: { id: Category; label: string; icon: typeof Lightbulb }[] = [
  { id: "feature", label: "Nova ideia", icon: Lightbulb },
  { id: "improvement", label: "Melhoria", icon: Sparkles },
  { id: "bug", label: "Problema", icon: Bug },
  { id: "other", label: "Outro", icon: MessageCircle },
];

const MAX_LEN = 2000;

export default function SugestoesPage() {
  const [category, setCategory] = useState<Category>("feature");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const trimmed = message.trim();
  const canSubmit = trimmed.length >= 5 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sugestoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, category }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erro ao enviar sugestão");
      }

      toast.success("Sugestão enviada. Obrigado!");
      setMessage("");
      setCategory("feature");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar sugestão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-canvas pb-24">
      <BackHeader title="Sugestões" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 py-6">
        <div>
          <h2 className="text-xl font-semibold text-ink mb-1">Conte o que você acha</h2>
          <p className="text-sm text-body-text leading-relaxed">
            Sua opinião ajuda a evoluir o app. Compartilhe ideias, problemas ou melhorias.
          </p>
        </div>

        {/* Category selector */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-ink uppercase tracking-[0.32px] px-1">
            Categoria
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const active = category === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className={
                    "flex items-center gap-3 rounded-[14px] border p-3 text-left transition-colors " +
                    (active
                      ? "border-ink bg-canvas"
                      : "border-hairline-soft bg-canvas hover:border-hairline")
                  }
                  aria-pressed={active}
                >
                  <span
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-full shrink-0 " +
                      (active ? "bg-ink text-canvas" : "bg-surface-strong text-ink")
                    }
                  >
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label
            htmlFor="message"
            className="block text-[11px] font-semibold text-ink uppercase tracking-[0.32px] px-1"
          >
            Mensagem
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
            placeholder="Descreva sua sugestão com detalhes..."
            rows={6}
            className="w-full rounded-lg border border-hairline bg-canvas px-4 py-3 text-base text-ink placeholder:text-muted-soft outline-none focus:border-ink resize-none"
            required
            minLength={5}
            maxLength={MAX_LEN}
          />
          <div className="flex justify-end px-1">
            <span className="text-xs text-muted tabular-nums">
              {trimmed.length}/{MAX_LEN}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="h-12 rounded-lg bg-primary text-on-primary text-base font-medium hover:bg-rausch-active disabled:bg-rausch-disabled disabled:text-rausch-active disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Enviando..." : "Enviar sugestão"}
        </button>
      </form>
    </div>
  );
}
