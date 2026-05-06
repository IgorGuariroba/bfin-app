"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  X,
  Pencil,
  CalendarDays,
  CalendarClock,
  RefreshCw,
  Tag,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAddModal } from "@/lib/add-modal-context";
import { CAT_COLORS, CAT_LABELS, CATEGORIES, type Category } from "@/lib/constants";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val / 100);

const fmtDateDisplay = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
};

const REPEAT_OPTS = [
  { value: "none", label: "Não repete" },
  { value: "monthly", label: "Repete todo mês" },
  { value: "weekly", label: "Repete toda semana" },
  { value: "daily", label: "Repete todo dia" },
] as const;

type TagItem = { id: string; name: string; color: string; isSystem: boolean };

/* ── Category initial circle ─────────────────── */
const CAT_INITIALS: Record<Category, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

export function QuickAddModal() {
  const { open, setOpen } = useAddModal();

  const [centavos, setCentavos] = useState(0);
  const [type, setType] = useState<Category>("saida");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());
  const [repeat, setRepeat] = useState("none");
  const [repeatEnd, setRepeatEnd] = useState<"count" | "forever">("count");
  const [repeatCount, setRepeatCount] = useState(6);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /* dropdowns */
  const [typeOpen, setTypeOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [repeatEndOpen, setRepeatEndOpen] = useState(false);

  const valueRef = useRef<HTMLInputElement>(null);

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
    setRepeatEnd("count");
    setRepeatCount(6);
    setSelectedTagIds([]);
    setTypeOpen(false);
    setRepeatOpen(false);
    setRepeatEndOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    reset();
  }, [setOpen, reset]);

  const handleSubmit = useCallback(async () => {
    if (centavos === 0) { toast.error("Informe um valor"); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        type,
        description: description.trim() || CAT_LABELS[type],
        amount: centavos / 100,
        date,
        tagIds: selectedTagIds,
      };
      if (repeat !== "none") {
        body.repeat = repeat;
        body.repeatEnd = repeatEnd;
        if (repeatEnd === "count") {
          body.repeatCount = repeatCount;
        }
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

  /* Handle raw value input – user types digits, we track centavos */
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = parseInt(raw || "0", 10);
    setCentavos(num > 99999999 ? centavos : num);
  };

  /* Display value for the input */
  const displayValue = centavos === 0 ? "" : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(centavos / 100);

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const accent = CAT_COLORS[type];
  const repeatLabel = REPEAT_OPTS.find((o) => o.value === repeat)?.label ?? "Não repete";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="p-0 !h-[100dvh] !max-h-[100dvh] flex flex-col gap-0"
      >
        <SheetTitle className="sr-only">Adicionar Transação</SheetTitle>

        {/* ─── Value header ─── */}
        <div className="flex items-center px-5 pt-5 pb-4">
          <span className="text-[28px] font-bold text-muted-foreground/60 mr-1 select-none">R$</span>
          <input
            ref={valueRef}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleValueChange}
            placeholder="0,00"
            className="flex-1 text-[28px] font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 caret-ink"
            style={{ color: centavos > 0 ? "var(--ink)" : undefined }}
            autoFocus
          />
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-surface-soft transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Form rows ─── */}
        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          {/* separator */}
          <div className="border-t border-hairline-soft" />

          {/* Type */}
          <div className="relative">
            <button
              onClick={() => { setTypeOpen(!typeOpen); setRepeatOpen(false); }}
              className="flex items-center gap-3.5 w-full py-4 text-left"
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                style={{ backgroundColor: accent }}
              >
                {CAT_INITIALS[type]}
              </span>
              <span className="flex-1 text-[15px] text-ink font-medium">{CAT_LABELS[type]}</span>
              <ChevronDown size={16} className="text-muted-foreground" />
            </button>
            {typeOpen && (
              <div className="absolute left-0 right-0 top-full z-10 bg-white rounded-xl shadow-lg border border-hairline-soft overflow-hidden -mt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setType(cat); setTypeOpen(false); }}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-soft transition-colors",
                      type === cat && "bg-surface-soft"
                    )}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: CAT_COLORS[cat] }}
                    >
                      {CAT_INITIALS[cat]}
                    </span>
                    <span className="text-sm text-ink">{CAT_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-hairline-soft" />

          {/* Description */}
          <div className="flex items-center gap-3.5 py-4">
            <Pencil size={18} className="text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1 text-[15px] bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="border-t border-hairline-soft" />

          {/* Date */}
          <div className="relative flex items-center gap-3.5 w-full py-4 text-left">
            <CalendarDays size={18} className="text-muted-foreground flex-shrink-0" />
            <span className="flex-1 text-[15px] text-ink">Data</span>
            <span className="text-[15px] text-muted-foreground">{fmtDateDisplay(date)}</span>
            <ChevronDown size={14} className="text-muted-foreground ml-0.5" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => {
                try {
                  (e.target as HTMLInputElement).showPicker?.();
                } catch (err) {}
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="border-t border-hairline-soft" />

          {/* Repeat */}
          <div className="relative">
            <button
              onClick={() => { setRepeatOpen(!repeatOpen); setTypeOpen(false); setRepeatEndOpen(false); }}
              className="flex items-center gap-3.5 w-full py-4 text-left"
            >
              <CalendarClock size={18} className="text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-[15px] text-ink">{repeatLabel}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            {repeatOpen && (
              <div className="absolute left-0 right-0 top-full z-10 bg-white rounded-xl shadow-lg border border-hairline-soft overflow-hidden -mt-1">
                {REPEAT_OPTS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setRepeat(opt.value); setRepeatOpen(false); }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-left text-sm hover:bg-surface-soft transition-colors",
                      repeat === opt.value && "bg-surface-soft font-medium"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Repetitions (only when repeat != none) */}
          {repeat !== "none" && (
            <div className="relative">
              <div className="border-t border-hairline-soft" />
              <div className="flex items-center gap-3.5 py-4">
                <RefreshCw size={18} className="text-muted-foreground flex-shrink-0" />
                <button
                  onClick={() => { setRepeatEndOpen(!repeatEndOpen); setTypeOpen(false); setRepeatOpen(false); }}
                  className="flex-1 text-left flex items-center gap-1 text-[15px] text-ink"
                >
                  {repeatEnd === "count" ? "Número de vezes" : "A perder de vista"}
                  <ChevronDown size={12} className="text-muted-foreground" />
                </button>
                {repeatEnd === "count" && (
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => setRepeatCount((n) => Math.max(2, n - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-hairline text-muted-foreground active:bg-surface-soft transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-[15px] font-semibold text-ink">{repeatCount}</span>
                    <button
                      onClick={() => setRepeatCount((n) => Math.min(60, n + 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-hairline text-muted-foreground active:bg-surface-soft transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
              {repeatEndOpen && (
                <div className="absolute left-0 right-0 top-full z-10 bg-white rounded-xl shadow-lg border border-hairline-soft overflow-hidden -mt-1">
                  <button
                    onClick={() => { setRepeatEnd("count"); setRepeatEndOpen(false); }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-left text-sm hover:bg-surface-soft transition-colors",
                      repeatEnd === "count" && "bg-surface-soft font-medium"
                    )}
                  >
                    Número de vezes
                  </button>
                  <button
                    onClick={() => { setRepeatEnd("forever"); setRepeatEndOpen(false); }}
                    className={cn(
                      "flex items-center w-full px-4 py-3 text-left text-sm hover:bg-surface-soft transition-colors",
                      repeatEnd === "forever" && "bg-surface-soft font-medium"
                    )}
                  >
                    A perder de vista
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-hairline-soft" />

          {/* Tags */}
          <div className="py-4">
            <div className="flex items-center gap-3.5">
              <Tag size={18} className="text-muted-foreground flex-shrink-0" />
              <span className="text-[15px] text-muted-foreground/60">Tags</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pl-[30px]">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      selectedTagIds.includes(tag.id)
                        ? "text-white shadow-sm"
                        : "bg-surface-soft text-muted-foreground"
                    )}
                    style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit button ─── */}
        <div className="px-5 pt-3 pb-6 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-full text-white font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {submitting
              ? "Salvando..."
              : `Adicionar ${CAT_LABELS[type].toLowerCase()}`}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
