"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 3) return;
    setSubmitting(true);
    setMsg(null);
    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, body }),
    });
    setSubmitting(false);
    if (res.ok) {
      setBody("");
      setMsg("Comentário enviado. Aparecerá após moderação.");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? "Erro ao enviar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="text-sm font-medium text-ink">Deixe seu comentário</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        required
        className="w-full rounded-lg border border-hairline bg-canvas px-3 py-3 text-[16px] text-ink placeholder:text-muted focus:outline-none focus:border-ink focus:border-2"
        placeholder="Compartilhe sua opinião..."
      />
      <button
        type="submit"
        disabled={submitting || body.trim().length < 3}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-rausch px-6 text-[16px] font-medium text-on-primary hover:bg-rausch-active disabled:bg-rausch-disabled disabled:cursor-not-allowed"
      >
        {submitting ? "Enviando..." : "Enviar comentário"}
      </button>
      {msg && <p className="text-sm text-body-text">{msg}</p>}
    </form>
  );
}
