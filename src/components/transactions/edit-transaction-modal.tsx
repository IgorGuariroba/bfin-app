"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { X, Pencil, CalendarDays, ChevronDown, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CAT_COLORS, CAT_LABELS, CATEGORIES, type Category } from "@/lib/constants";
import type { Transaction } from "@/hooks/use-transactions";

const fmtDateDisplay = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-");
  return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
};

const CAT_INITIALS: Record<Category, string> = {
  entrada: "E",
  saida: "S",
  diario: "D",
  cartao: "C",
  economia: "G",
};

interface EditTransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditTransactionModal({ transaction, onClose, onUpdated }: EditTransactionModalProps) {
  const [centavos, setCentavos] = useState(0);
  const [type, setType] = useState<Category>("saida");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Sincroniza os campos com a transação selecionada — estado derivado da
      // prop, não loop de render.
      /* eslint-disable react-hooks/set-state-in-effect */
      setCentavos(Math.round(transaction.amount * 100));
      setType(transaction.type as Category);
      setDescription(transaction.description);
      const d =
        typeof transaction.date === "string"
          ? transaction.date.slice(0, 10)
          : new Date(transaction.date).toISOString().slice(0, 10);
      setDate(d);
      setTypeOpen(false);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [transaction]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = parseInt(raw || "0", 10);
    setCentavos(num > 99999999 ? centavos : num);
  };

  const displayValue = centavos === 0 ? "" : (centavos / 100).toFixed(2).replace(".", ",");

  const handleSave = useCallback(async () => {
    if (!transaction) return;
    if (centavos === 0) { toast.error("Informe um valor"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          description: description.trim() || CAT_LABELS[type],
          amount: centavos / 100,
          date,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao salvar");
      }
      toast.success("Transação atualizada!");
      window.dispatchEvent(new CustomEvent("bfin:transaction-created"));
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }, [transaction, centavos, type, description, date, onUpdated, onClose]);

  const handleDelete = useCallback(async () => {
    if (!transaction) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao excluir");
      }
      toast.success("Transação excluída!");
      window.dispatchEvent(new CustomEvent("bfin:transaction-created"));
      onUpdated();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setSubmitting(false);
    }
  }, [transaction, onUpdated, onClose]);

  const accent = CAT_COLORS[type];

  return (
    <Sheet open={!!transaction} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="p-0 !h-[100dvh] !max-h-[100dvh] flex flex-col gap-0"
      >
        <SheetTitle className="sr-only">Editar Transação</SheetTitle>

        {/* Value header */}
        <div className="flex items-center px-5 pt-5 pb-4">
          <span className="text-[28px] font-bold text-muted-foreground/60 mr-1 select-none">R$</span>
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleValueChange}
            placeholder="0,00"
            className="flex-1 text-[28px] font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 caret-ink"
            style={{ color: centavos > 0 ? "var(--ink)" : undefined }}
          />
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-surface-soft transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 min-h-0">
          <div className="border-t border-hairline-soft" />

          {/* Type */}
          <div className="relative">
            <button
              onClick={() => setTypeOpen(!typeOpen)}
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
            <span className="text-[15px] text-muted-foreground">{date ? fmtDateDisplay(date) : ""}</span>
            <ChevronDown size={14} className="text-muted-foreground ml-0.5" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => {
                try { (e.target as HTMLInputElement).showPicker?.(); } catch {}
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pt-3 pb-6 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={submitting}
            className="w-full py-4 rounded-full text-white font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {submitting ? "Salvando..." : "Salvar alterações"}
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="w-full py-3 rounded-full text-destructive font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Excluir lançamento
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
