"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { POST_CATEGORIES, type PostCategory, type PostStatus } from "@/lib/blog";
import "@uiw/react-md-editor/markdown-editor.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Topic = { id: string; name: string };

export type PostEditorInitial = {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: PostCategory;
  status: PostStatus;
  metaTitle: string;
  metaDescription: string;
  topicIds: string[];
};

export function PostEditor({
  initial,
  allTopics,
  mode,
}: {
  initial: PostEditorInitial;
  allTopics: Topic[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof PostEditorInitial>(key: K, value: PostEditorInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTopic(id: string) {
    setForm((f) => ({
      ...f,
      topicIds: f.topicIds.includes(id) ? f.topicIds.filter((x) => x !== id) : [...f.topicIds, id],
    }));
  }

  async function save(nextStatus?: PostStatus) {
    setSaving(true);
    setMsg(null);
    const payload = { ...form, ...(nextStatus ? { status: nextStatus } : {}) };

    let res: Response;
    if (mode === "create") {
      res = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        router.push(`/admin/blog/${created.id}/editar`);
        return;
      }
    } else {
      res = await fetch(`/api/admin/blog/posts/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    if (res.ok) {
      setMsg("Salvo.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Erro ao salvar.");
    }
  }

  async function remove() {
    if (!form.id) return;
    if (!confirm("Excluir este post permanentemente?")) return;
    const res = await fetch(`/api/admin/blog/posts/${form.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/blog");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr,300px]">
        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Título do post"
            className="w-full rounded-lg border border-hairline bg-canvas px-4 py-3 text-[22px] font-semibold tracking-tight text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
            placeholder="Resumo (aparece na listagem e meta description)"
            rows={2}
            className="w-full rounded-lg border border-hairline bg-canvas px-4 py-3 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
          />
          <div data-color-mode="light" className="rounded-md overflow-hidden border border-hairline">
            <MDEditor
              value={form.content}
              onChange={(v) => update("content", v ?? "")}
              height={520}
              preview="live"
              textareaProps={{ placeholder: "Conteúdo em Markdown..." }}
            />
          </div>
        </div>

        <aside className="space-y-4 text-sm">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Status</label>
            <div className="flex items-center justify-between rounded-lg bg-surface-soft px-3 py-2.5 text-sm text-ink">
              <span className="font-medium">{form.status}</span>
              {mode === "edit" && form.status === "draft" && (
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="font-medium text-rausch hover:underline"
                >
                  publicar
                </button>
              )}
              {mode === "edit" && form.status === "published" && (
                <button
                  type="button"
                  onClick={() => save("archived")}
                  className="font-medium text-rausch hover:underline"
                >
                  arquivar
                </button>
              )}
              {mode === "edit" && form.status === "archived" && (
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="font-medium text-rausch hover:underline"
                >
                  republicar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as PostCategory)}
              className="h-12 w-full rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink focus:outline-none focus:border-ink focus:border-2"
            >
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Imagem de capa (URL)</label>
            <input
              value={form.coverImageUrl}
              onChange={(e) => update("coverImageUrl", e.target.value)}
              placeholder="https://..."
              className="h-12 w-full rounded-lg border border-hairline bg-canvas px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">Tópicos</label>
            <div className="flex flex-wrap gap-2">
              {allTopics.length === 0 && (
                <p className="text-xs text-body-text">
                  Sem tópicos cadastrados. Crie em <a href="/admin/blog/topicos" className="underline">/admin/blog/topicos</a>.
                </p>
              )}
              {allTopics.map((t) => {
                const active = form.topicIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTopic(t.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${active ? "border-ink bg-ink text-canvas" : "border-hairline text-ink"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <details className="rounded-lg border border-hairline p-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">SEO custom</summary>
            <div className="mt-3 space-y-3">
              <input
                value={form.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
                placeholder="Meta title"
                className="h-11 w-full rounded-lg border border-hairline bg-canvas px-3 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
              />
              <textarea
                value={form.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
                placeholder="Meta description"
                rows={3}
                className="w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
              />
            </div>
          </details>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-ink bg-canvas px-6 text-sm font-medium text-ink hover:bg-surface-soft disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            {mode === "create" && (
              <button
                type="button"
                onClick={() => save("published")}
                disabled={saving}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-sm font-medium text-on-primary hover:bg-rausch-active disabled:bg-rausch-disabled disabled:cursor-not-allowed"
              >
                Salvar e publicar
              </button>
            )}
            {mode === "edit" && (
              <button
                type="button"
                onClick={remove}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-hairline px-6 text-sm font-medium text-error hover:bg-surface-soft"
              >
                Excluir
              </button>
            )}
            {msg && <p className="text-xs text-body-text">{msg}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
