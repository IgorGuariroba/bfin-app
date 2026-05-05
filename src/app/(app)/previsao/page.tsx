"use client";

import { useEffect, useState, useMemo } from "react";
import { BackHeader } from "@/components/layout/back-header";
import { SwipeableItem } from "@/components/previsao/swipeable-item";
import { PrevisaoForm } from "@/components/previsao/previsao-form";
import { Plus, ChevronDown } from "lucide-react";
import { useMonth } from "@/hooks/use-month";
import { useTotais } from "@/hooks/use-totais";
import { fmt } from "@/lib/utils";
import { toast } from "sonner";

type PrevisaoItem = { id: string; name: string; amount: number };

export default function PrevisaoPage() {
  const [items, setItems] = useState<PrevisaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<PrevisaoItem | null>(null);
  const [days, setDays] = useState<number>(30); // Default to 30

  const { month } = useMonth();
  const { data: totaisData } = useTotais(month); // To get entradas if needed

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/previsao");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const totalPrevisao = useMemo(() => {
    return items.reduce((acc, item) => acc + item.amount, 0);
  }, [items]);

  const diarioDisponivel = useMemo(() => {
    const entradas = totaisData?.entradas ?? 0;
    const available = entradas - totalPrevisao;
    return available > 0 ? available / days : 0;
  }, [totaisData?.entradas, totalPrevisao, days]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/previsao/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (item: PrevisaoItem) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-surface-soft)] relative">
      <BackHeader title="Previsão de diário" action={<button className="text-xl px-2 text-[var(--color-muted)]" onClick={openNew}>+</button>} />

      <div className="flex-1 overflow-y-auto flex flex-col bg-[var(--color-surface-soft)]">
        {loading ? (
          <div className="p-6 text-center text-[var(--color-muted)] text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 px-8 gap-3.5 text-center min-h-[200px]">
            <button
              onClick={openNew}
              className="w-16 h-16 rounded-full bg-[#e8e6e2] flex items-center justify-center shrink-0 hover:bg-[#dfddda] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <line x1="12" y1="5" x2="12" y2="19" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="text-sm text-[var(--color-muted)] leading-relaxed max-w-[220px]">
              Adicione seus gastos mensais aproximados para calcular a previsão de diário.
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-canvas)] mb-2 flex flex-col">
            {items.map((item) => (
              <SwipeableItem
                key={item.id}
                id={item.id}
                name={item.name}
                amount={item.amount}
                onDelete={handleDelete}
                onEdit={() => openEdit(item)}
              />
            ))}
          </div>
        )}

        {/* Footer — always visible */}
        <div className="bg-[var(--color-canvas)] mt-auto">
          <div className="p-4 pt-4 px-4 pb-0">
            <div className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-[var(--color-ink)]">Total mensal</span>
              <span className="font-semibold text-[var(--color-ink)] tabular-nums">{fmt(totalPrevisao)}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 text-sm">
              <span className="text-[var(--color-ink)]">Dividido por</span>
              <div className="relative inline-flex items-center">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-soft)] text-sm font-medium text-[var(--color-ink)] pointer-events-none select-none">
                  <span>{days} dias</span>
                  <ChevronDown size={13} strokeWidth={2} className="text-[var(--color-muted)]" />
                </div>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 w-full cursor-pointer"
                >
                  <option value={28}>28 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={31}>31 dias</option>
                </select>
              </div>
            </div>
            <div className="h-[1px] bg-[var(--color-hairline-soft)] my-3" />
            <div className="flex justify-between items-center py-1 text-base font-bold">
              <span></span>
              <span className="text-[var(--color-ink)] tabular-nums">{fmt(diarioDisponivel)}</span>
            </div>
          </div>
          <div className="h-6 pb-safe" />
        </div>
      </div>

      {formOpen && (
        <PrevisaoForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={fetchItems}
          editItem={editItem}
        />
      )}
    </div>
  );
}
