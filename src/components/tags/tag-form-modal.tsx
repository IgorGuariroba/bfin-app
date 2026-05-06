"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TagInput, Tag } from "@/hooks/use-tags";

interface TagFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  onSave: (data: TagInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  "#ff385c", // Rausch
  "#2db55d", // Green
  "#008a00", // Dark green
  "#1d70b8", // Blue
  "#460479", // Luxe
  "#92174d", // Plus
  "#ffb400", // Yellow
  "#e85d2f", // Orange
  "#6e6e6e", // Gray
];

export function TagFormModal({ open, onOpenChange, tag, onSave, onDelete }: TagFormModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (tag) {
        setName(tag.name);
        setColor(tag.color);
      } else {
        setName("");
        setColor(PRESET_COLORS[0]);
      }
    }
  }, [open, tag]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({ name, color });
      toast.success(tag ? "Tag atualizada" : "Tag criada");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar tag");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tag || !onDelete) return;
    
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      setLoading(true);
      try {
        await onDelete(tag.id);
        toast.success("Tag excluída");
        onOpenChange(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao excluir tag");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[auto] max-h-[90vh] rounded-t-3xl pt-8 px-4 pb-safe bg-canvas border-t-0">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-semibold text-ink">
            {tag ? "Editar Tag" : "Nova Tag"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-ink">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem, Mercado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 rounded-lg bg-canvas border border-hairline px-4 text-base focus-visible:border-ink focus-visible:ring-0"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-ink">Cor</Label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
                  style={{ backgroundColor: c }}
                  aria-label={`Cor ${c}`}
                >
                  {color === c && (
                    <div className="w-4 h-4 rounded-full bg-on-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-hairline">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-12 rounded-lg bg-primary text-on-primary text-base font-medium hover:bg-rausch-active"
            >
              {loading ? "Salvando..." : "Salvar Tag"}
            </Button>

            {tag && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={loading}
                className="h-12 rounded-lg text-error hover:bg-error/10 text-base font-medium"
              >
                Excluir Tag
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
