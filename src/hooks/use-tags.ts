"use client";

import { useState, useEffect, useCallback } from "react";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type TagInput = {
  name: string;
  color: string;
};

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error(await res.text());
      setTags(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const create = useCallback(
    async (input: TagInput): Promise<Tag> => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao criar tag");
      }
      const created: Tag = await res.json();
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    },
    []
  );

  const update = useCallback(
    async (id: string, input: Partial<TagInput>): Promise<Tag> => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? "Erro ao atualizar tag");
      }
      const updated: Tag = await res.json();
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)).sort((a, b) => a.name.localeCompare(b.name)));
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error ?? "Erro ao excluir tag");
    }
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tags, loading, error, refetch: fetch_, create, update, remove };
}
