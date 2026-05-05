"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Delete, Check, Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAddModal } from "@/lib/add-modal-context";
import { CAT_COLORS, CAT_LABELS, CATEGORIES, type Category } from "@/lib/constants";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtCentavos = (c: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100);

const REPEAT_OPTS = [
  { value: "none", label: "Não" },
  { value: "monthly", label: "Todo mês" },
  { value: "weekly", label: "Toda semana" },
  { value: "daily", label: "Todo dia" },
] as const;

const NUMPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"] as const;

type Tag = { id: string; name: string; color: string };

export function QuickAddModal() {
  const { open, setOpen } = useAddModal();

  const [centavos, setCentavos] = useState(0);
  const [type, setType] = useState<Category>("saida");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());
  const [repeat, setRepeat] = useState("none");
  const [repeatEnd, setRepeatEnd] = useState("forever");
  const [repeatCount, setRepeatCount] = useState(2);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/tags")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTags(Array.isArray(d) ? d : []))
      .catch(() => setTags([]));
  }, [open]);

  const reset = useCallback(() => {
    setCentavos(0);
    setType("saida");
    setDescription("");
    setDate(todayStr());
    setRepeat("none");
    setRepeatEnd("forever");
    setRepeatCount(2);
    setSelectedTagIds([]);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [setOpen, reset]);

  const handleSubmit = useCallback(async () => {
    if (centavos === 0) { toast.error("Informe um valor"); return; }
    if (!description.trim()) { toast.error("Informe uma descrição"); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        description: description.trim(),
        amount: centavos / 100,
        date,
        tagIds: selectedTagIds,
      };
      if (repeat !== "none") {
        body.repeat = repeat;
        body.repeatEnd = repeatEnd;
        if (repeatEnd === "count") body.repeatCount = repeatCount;
      }
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao salvar");
      }
      toast.success("Transação adicionada!");
      window.dispatchEvent(new CustomEvent("bfin:transaction-created"));
      handleClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }, [centavos, description, type, date, repeat, repeatEnd, repeatCount, selectedTagIds, handleClose]);

  const handleNumpad = useCallback(
    (key: string) => {
      if (key === "⌫") {
        setCentavos((c) => Math.floor(c / 10));
      } else if (key === "✓") {
        handleSubmit();
      } else {
        setCentavos((c) => {
          const next = c * 10 + parseInt(key, 10);
          return next > 99999999 ? c : next;
        });
      }
    },
    [handleSubmit]
  );

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const accent = CAT_COLORS[type];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="p-0 rounded-t-2xl max-h-[92dvh] flex flex-col gap-0"
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-hairline" />
        </div>

        {/* type pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto flex-shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setType(cat)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                type === cat ? "text-white" : "text-muted-foreground bg-surface-soft"
              )}
              style={type === cat ? { backgroundColor: accent } : undefined}
            >
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* scrollable middle */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-3 min-h-0">
          {/* value */}
          <div className="text-4xl font-bold text-center py-3" style={{ color: accent }}>
            {fmtCentavos(centavos)}
          </div>

          {/* description */}
          <input
            type="text"
            placeholder="Descrição..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-soft rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
          />

          {/* date */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-16 flex-shrink-0">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-surface-soft rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* repeat */}
          <div className="flex items-start gap-3">
            <span className="text-sm text-muted-foreground w-16 flex-shrink-0 pt-1.5">Repetir</span>
            <div className="flex gap-1.5 flex-wrap">
              {REPEAT_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRepeat(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    repeat === opt.value ? "bg-ink text-white" : "bg-surface-soft text-muted-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* until when */}
          {repeat !== "none" && (
            <div className="flex items-start gap-3">
              <span className="text-sm text-muted-foreground w-16 flex-shrink-0 pt-1.5">Até</span>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setRepeatEnd("forever")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                      repeatEnd === "forever" ? "bg-ink text-white" : "bg-surface-soft text-muted-foreground"
                    )}
                  >
                    A perder de vista
                  </button>
                  <button
                    onClick={() => setRepeatEnd("count")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                      repeatEnd === "count" ? "bg-ink text-white" : "bg-surface-soft text-muted-foreground"
                    )}
                  >
                    Nº de vezes
                  </button>
                </div>
                {repeatEnd === "count" && (
                  <div className="flex items-center justify-center gap-5 bg-surface-soft rounded-lg py-2.5">
                    <button
                      onClick={() => setRepeatCount((n) => Math.max(2, n - 1))}
                      className="p-1 text-muted-foreground active:text-ink"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-sm font-semibold w-10 text-center">{repeatCount}×</span>
                    <button
                      onClick={() => setRepeatCount((n) => Math.min(60, n + 1))}
                      className="p-1 text-muted-foreground active:text-ink"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* tags */}
          {tags.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-sm text-muted-foreground w-16 flex-shrink-0 pt-1.5">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      selectedTagIds.includes(tag.id)
                        ? "text-white"
                        : "bg-surface-soft text-muted-foreground"
                    )}
                    style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* numpad */}
        <div className="grid grid-cols-3 border-t border-hairline flex-shrink-0 pb-safe">
          {NUMPAD.map((key) => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              disabled={submitting && key === "✓"}
              className={cn(
                "h-14 flex items-center justify-center text-xl font-medium select-none transition-colors",
                "active:bg-surface-strong",
                key === "✓" ? "text-white" : key === "⌫" ? "text-muted-foreground" : "text-ink"
              )}
              style={key === "✓" ? { backgroundColor: accent } : undefined}
            >
              {key === "⌫" ? (
                <Delete size={20} />
              ) : key === "✓" ? (
                submitting ? (
                  <span className="text-sm">...</span>
                ) : (
                  <Check size={20} />
                )
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
