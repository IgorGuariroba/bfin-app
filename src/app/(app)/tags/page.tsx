"use client";

import { useState } from "react";
import { BackHeader } from "@/components/layout/back-header";
import { Tag, useTags } from "@/hooks/use-tags";
import { TagFormModal } from "@/components/tags/tag-form-modal";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TagsPage() {
  const { tags, loading, create, update, remove } = useTags();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleOpenAdd = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingTag) {
      await update(editingTag.id, data);
    } else {
      await create(data);
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <div className="flex flex-col min-h-full bg-canvas pb-24">
      <BackHeader 
        title="Tags" 
        action={
          <button 
            onClick={handleOpenAdd}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-6">
        {loading && tags.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full rounded-2xl bg-surface-soft animate-pulse" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
            <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center text-muted-foreground mb-4">
              <Plus size={32} />
            </div>
            <h2 className="text-xl font-bold text-ink mb-2">Nenhuma tag</h2>
            <p className="text-muted-foreground mb-6">
              Crie tags para organizar e classificar melhor suas movimentações.
            </p>
            <button
              onClick={handleOpenAdd}
              className="h-12 px-6 rounded-full bg-primary text-white font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            >
              <Plus size={20} />
              Criar Tag
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleOpenEdit(tag)}
                className="flex items-center gap-4 bg-surface p-4 rounded-2xl shadow-sm text-left active:scale-95 transition-transform"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }} 
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                </div>
                <span className="flex-1 font-semibold text-ink text-base truncate">
                  {tag.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <TagFormModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        tag={editingTag}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
