"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PrevisaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editItem?: { id: string; name: string; amount: number } | null;
}

export function PrevisaoForm({ open, onOpenChange, onSuccess, editItem }: PrevisaoFormProps) {
  const [name, setName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editItem) {
        setName(editItem.name);
        setAmountStr(editItem.amount.toFixed(2).replace(".", ","));
      } else {
        setName("");
        setAmountStr("");
      }
      // Focus amount on open
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [open, editItem]);

  if (!open) return null;

  const handleSubmit = async () => {
    const amount = parseFloat(amountStr.replace(",", "."));
    if (!name.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Preencha nome e valor válidos");
      return;
    }

    setSubmitting(true);
    try {
      const url = editItem ? `/api/previsao/${editItem.id}` : "/api/previsao";
      const method = editItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), amount }),
      });

      if (!res.ok) throw new Error(await res.text());

      toast.success(editItem ? "Atualizado!" : "Adicionado!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9,]/g, "");
    setAmountStr(val);
  };

  return (
    <div className="absolute inset-0 z-[100] bg-[var(--color-canvas)] flex flex-col animate-in slide-in-from-bottom-4 duration-200">
      {/* Amount row */}
      <div className="flex items-center justify-between p-5 pb-4 border-b border-[var(--color-hairline-soft)] relative">
        <div className="flex items-baseline gap-1.5 flex-1 relative">
          <span className="text-[28px] font-extrabold text-[var(--color-ink)]">R$</span>
          
          <input
            ref={amountInputRef}
            type="text"
            inputMode="decimal"
            value={amountStr}
            onChange={handleAmountChange}
            placeholder="0,00"
            className="text-[28px] font-extrabold tracking-[-0.5px] bg-transparent border-none outline-none text-[var(--color-ink)] placeholder:text-[#c8c8c8] flex-1 min-w-0"
          />
        </div>
        
        <button 
          onClick={() => onOpenChange(false)}
          className="bg-transparent border-none text-[22px] text-[var(--color-muted)] cursor-pointer px-1 leading-none self-start mt-2"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Description row */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-hairline-soft)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M11 2L14 5L4.5 14.5H1.5V11.5L11 2Z" stroke="#bbb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <input
          type="text"
          placeholder="Descrição"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border-none outline-none text-[15px] font-[Inter,-apple-system,system-ui,sans-serif] text-[var(--color-ink)] bg-transparent placeholder:text-[var(--color-muted-soft)]"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Submit button */}
      <div className="p-4 pb-8 border-t border-[var(--color-hairline-soft)]">
        <button 
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full p-4 bg-[var(--color-ink)] text-white border-none rounded-full text-base font-bold cursor-pointer font-[Inter,-apple-system,system-ui,sans-serif] tracking-[0.1px] active:scale-[0.98] transition-transform disabled:opacity-70 disabled:active:scale-100"
        >
          {submitting ? "Salvando..." : editItem ? "Salvar gasto" : "Adicionar gasto mensal"}
        </button>
      </div>
    </div>
  );
}
