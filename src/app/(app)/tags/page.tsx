"use client";

import { useState } from "react";
import { BackHeader } from "@/components/layout/back-header";
import { Tag, TagInput, useTags } from "@/hooks/use-tags";
import { TagFormModal } from "@/components/tags/tag-form-modal";
import { Plus, Lock } from "lucide-react";

export default function TagsPage() {
  const { tags, loading, create, update, remove } = useTags();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleOpenAdd = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    // Não permite editar tags do sistema
    if (tag.isSystem) return;
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleSave = async (data: TagInput) => {
    if (editingTag) {
      await update(editingTag.id, data);
    } else {
      await create(data);
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  const systemTags = tags.filter((t) => t.isSystem);
  const userTags = tags.filter((t) => !t.isSystem);

  return (
    <div className="flex flex-col min-h-full bg-canvas pb-24">
      <BackHeader
        title="Tags"
        action={
          <button
            onClick={handleOpenAdd}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-strong text-ink hover:bg-surface-strong/80 transition-colors"
            aria-label="Adicionar tag"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-6">
        {loading && tags.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-full rounded-xl bg-surface-soft animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Tags do sistema ── */}
            {systemTags.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] font-bold text-ink uppercase tracking-[0.32px] mb-3 px-1">
                  Padrão do sistema
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {systemTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-4 bg-canvas p-4 rounded-xl border border-hairline-soft opacity-90"
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
                      <span className="flex-1 text-base font-semibold text-ink truncate">
                        {tag.name}
                      </span>
                      <Lock size={14} className="text-muted-soft shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tags do usuário ── */}
            {userTags.length > 0 && (
              <div>
                {systemTags.length > 0 && (
                  <p className="text-[11px] font-bold text-ink uppercase tracking-[0.32px] mb-3 px-1">
                    Minhas tags
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleOpenEdit(tag)}
                      className="flex items-center gap-4 bg-canvas p-4 rounded-xl border border-hairline-soft text-left active:scale-95 transition-transform hover:border-hairline"
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
                      <span className="flex-1 text-base font-semibold text-ink truncate">
                        {tag.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Empty state (só para tags do usuário) ── */}
            {userTags.length === 0 && systemTags.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <p className="text-sm text-ink mb-4">
                  Crie suas próprias tags para organizar melhor.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="h-12 px-5 rounded-full bg-primary text-on-primary text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                  Criar Tag
                </button>
              </div>
            )}

            {/* ── Empty state total ── */}
            {tags.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                <div className="w-16 h-16 rounded-full bg-surface-strong flex items-center justify-center text-ink mb-4">
                  <Plus size={32} />
                </div>
                <h2 className="text-xl font-semibold text-ink mb-2">Nenhuma tag</h2>
                <p className="text-sm text-muted mb-6">
                  Crie tags para organizar e classificar melhor suas movimentações.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="h-12 px-5 rounded-full bg-primary text-on-primary text-sm font-medium flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Plus size={20} />
                  Criar Tag
                </button>
              </div>
            )}
          </>
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
