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
          className="h-12 flex-1 rounded-lg border border-hairline bg-canvas px-3 text-[16px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="h-12 rounded-lg bg-rausch px-6 text-[14px] font-medium text-on-primary hover:bg-rausch-active disabled:bg-rausch-disabled disabled:cursor-not-allowed"
        >
          Criar
        </button>
      </form>

      {initial.length === 0 ? (
        <p className="text-body-text text-sm">Sem tópicos.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
              <th className="py-3">Nome</th>
              <th>Slug</th>
              <th>Posts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initial.map((t) => (
              <tr key={t.id} className="border-b border-hairline-soft text-ink">
                <td className="py-3 font-medium">{t.name}</td>
                <td className="text-body-text">{t.slug}</td>
                <td>{t.postCount}</td>
                <td className="text-right">
                  <button onClick={() => remove(t.id, t.postCount)} className="text-error hover:text-error font-medium hover:underline">
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
