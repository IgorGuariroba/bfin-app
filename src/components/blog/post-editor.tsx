"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { POST_CATEGORIES, POST_STATUSES, type PostCategory, type PostStatus } from "@/lib/blog";
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
            className="w-full border border-hairline rounded-md px-3 py-2 text-lg font-semibold"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
            placeholder="Resumo (aparece na listagem e meta description)"
            rows={2}
            className="w-full border border-hairline rounded-md px-3 py-2 text-sm"
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
            <label className="block font-medium mb-1">Status</label>
            <div className="rounded-md bg-surface-soft px-3 py-2">
              {form.status}
              {mode === "edit" && form.status === "draft" && (
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="ml-3 text-rausch hover:underline"
                >
                  publicar
                </button>
              )}
              {mode === "edit" && form.status === "published" && (
                <button
                  type="button"
                  onClick={() => save("archived")}
                  className="ml-3 text-rausch hover:underline"
                >
                  arquivar
                </button>
              )}
              {mode === "edit" && form.status === "archived" && (
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="ml-3 text-rausch hover:underline"
                >
                  republicar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as PostCategory)}
              className="w-full border border-hairline rounded-md px-3 py-2"
            >
              {POST_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Imagem de capa (URL)</label>
            <input
              value={form.coverImageUrl}
              onChange={(e) => update("coverImageUrl", e.target.value)}
              placeholder="https://..."
              className="w-full border border-hairline rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Tópicos</label>
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

          <details className="rounded-md border border-hairline p-3">
            <summary className="cursor-pointer font-medium">SEO custom</summary>
            <div className="mt-3 space-y-3">
              <input
                value={form.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
                placeholder="Meta title"
                className="w-full border border-hairline rounded-md px-3 py-2 text-xs"
              />
              <textarea
                value={form.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
                placeholder="Meta description"
                rows={3}
                className="w-full border border-hairline rounded-md px-3 py-2 text-xs"
              />
            </div>
          </details>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="rounded-md bg-ink text-canvas px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            {mode === "create" && (
              <button
                type="button"
                onClick={() => save("published")}
                disabled={saving}
                className="rounded-md bg-rausch text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Salvar e publicar
              </button>
            )}
            {mode === "edit" && (
              <button
                type="button"
                onClick={remove}
                className="rounded-md border border-hairline text-rausch px-4 py-2 text-sm"
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
