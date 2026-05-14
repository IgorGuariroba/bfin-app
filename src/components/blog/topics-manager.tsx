"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Topic = { id: string; name: string; slug: string; postCount: number };

export function TopicsManager({ initial }: { initial: Topic[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/blog/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSubmitting(false);
    if (res.ok) {
      setName("");
      router.refresh();
    }
  }

  async function remove(id: string, postCount: number) {
    if (postCount > 0) {
      if (!confirm(`Esse tópico tem ${postCount} post(s). Excluir mesmo assim?`)) return;
    } else if (!confirm("Excluir tópico?")) {
      return;
    }
    const res = await fetch(`/api/admin/blog/topics/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do tópico (ex: investimentos)"
          className="flex-1 border border-hairline rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-md bg-ink text-canvas px-4 py-2 text-sm disabled:opacity-50"
        >
          Criar
        </button>
      </form>

      {initial.length === 0 ? (
        <p className="text-body-text text-sm">Sem tópicos.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs uppercase text-body-text">
              <th className="py-2">Nome</th>
              <th>Slug</th>
              <th>Posts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((t) => (
              <tr key={t.id} className="border-b border-hairline-soft">
                <td className="py-3">{t.name}</td>
                <td className="text-body-text">{t.slug}</td>
                <td>{t.postCount}</td>
                <td className="text-right">
                  <button onClick={() => remove(t.id, t.postCount)} className="text-rausch hover:underline">
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
