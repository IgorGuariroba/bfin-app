"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ConversationListItem = {
  id: string;
  status: string;
  lastMessageAt: string;
  contact: { id: string; phone: string; name: string | null };
  lastMessage: { body: string; direction: string; createdAt: string } | null;
};

type Message = {
  id: string;
  direction: string;
  sender: string;
  body: string;
  createdAt: string;
};

type ConversationDetail = {
  id: string;
  status: string;
  lastMessageAt: string;
  contact: { id: string; phone: string; name: string | null; createdAt: string };
  messages: Message[];
};

const STATUS_LABEL: Record<string, string> = {
  bot: "Bot",
  waiting_human: "Aguardando humano",
  human: "Em atendimento",
  closed: "Encerrada",
  rate_limited: "Limite excedido",
};

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  bot: "secondary",
  waiting_human: "destructive",
  human: "default",
  closed: "outline",
  rate_limited: "destructive",
};

const POLL_MS = 10_000;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_TONE[status] ?? "secondary"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export default function AdminWhatsappPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchList = useCallback(async () => {
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/whatsapp/conversations${qs}`);
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }, [filter]);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/whatsapp/conversations/${id}`);
    if (!res.ok) return;
    const data = (await res.json()) as ConversationDetail;
    setDetail(data);
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.isAdmin) {
      router.replace("/saldos");
    }
  }, [session, sessionStatus, router]);

  useEffect(() => {
    if (!session?.user?.isAdmin) return;
    fetchList();
    const intv = setInterval(fetchList, POLL_MS);
    return () => clearInterval(intv);
  }, [session, fetchList]);

  useEffect(() => {
    if (!selectedId) return;
    fetchDetail(selectedId);
    const intv = setInterval(() => fetchDetail(selectedId), POLL_MS);
    return () => clearInterval(intv);
  }, [selectedId, fetchDetail]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const c of conversations) acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, [conversations]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Erro ao enviar");
      } else {
        setReply("");
        fetchDetail(selectedId);
        fetchList();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleStatus(newStatus: string) {
    if (!selectedId) return;
    setError("");
    const res = await fetch(`/api/admin/whatsapp/conversations/${selectedId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setError("Erro ao atualizar status");
    } else {
      fetchDetail(selectedId);
      fetchList();
    }
  }

  async function handleDeleteContact() {
    if (!detail?.contact.id) return;
    if (!confirm(`Apagar contato ${detail.contact.phone} e todas as conversas? Ação irreversível (LGPD).`)) return;
    const res = await fetch(`/api/admin/whatsapp/contacts/${detail.contact.id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedId(null);
      setDetail(null);
      fetchList();
    } else {
      setError("Erro ao apagar contato");
    }
  }

  if (sessionStatus === "loading" || !session?.user?.isAdmin) return null;

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col gap-3 p-4 md:flex-row">
      <aside className="flex w-full flex-col gap-2 border rounded-lg p-3 md:w-80 md:shrink-0">
        <h1 className="text-lg font-semibold">WhatsApp</h1>

        <div className="flex flex-wrap gap-1 text-xs">
          {(["", "waiting_human", "bot", "human", "closed", "rate_limited"] as const).map((s) => {
            const label = s === "" ? `Todas (${conversations.length})` : `${STATUS_LABEL[s]} (${counts[s] ?? 0})`;
            return (
              <button
                key={s || "all"}
                onClick={() => setFilter(s)}
                className={`rounded-full px-2 py-1 ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <ul className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <li className="text-sm text-muted-foreground p-3">Nenhuma conversa.</li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-2 rounded-md border-b ${selectedId === c.id ? "bg-muted" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{c.contact.name ?? c.contact.phone}</span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.lastMessage ? c.lastMessage.body : "—"}
                </div>
                <div className="text-[10px] text-muted-foreground">{fmtTime(c.lastMessageAt)}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex flex-1 flex-col border rounded-lg p-3 overflow-hidden">
        {!detail ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Selecione uma conversa.
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-2 pb-2 border-b">
              <div>
                <div className="font-medium">{detail.contact.name ?? detail.contact.phone}</div>
                <div className="text-xs text-muted-foreground">{detail.contact.phone}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                {detail.status !== "closed" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus("closed")}>Encerrar</Button>
                )}
                {detail.status === "closed" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus("bot")}>Reabrir</Button>
                )}
                {detail.status === "rate_limited" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus("bot")}>Liberar bot</Button>
                )}
                <Button size="sm" variant="destructive" onClick={handleDeleteContact}>Apagar (LGPD)</Button>
              </div>
            </header>

            <MessageList messages={detail.messages} />

            <form onSubmit={handleReply} className="flex flex-col gap-2 pt-2 border-t">
              {error && <div className="text-xs text-destructive">{error}</div>}
              <div className="flex gap-2">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Responder como humano…"
                  maxLength={4096}
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !reply.trim()}>
                  {sending ? "Enviando…" : "Enviar"}
                </Button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function MessageList({ messages }: { messages: Message[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [messages.length]);

  return (
    <div ref={ref} className="flex-1 overflow-y-auto py-2 space-y-2">
      {messages.map((m) => {
        const isOutbound = m.direction === "outbound";
        const senderLabel = m.sender === "admin" ? "Você" : m.sender === "bot" ? "Bot" : "Contato";
        return (
          <div key={m.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isOutbound ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <div className="text-[10px] opacity-70 mb-0.5">{senderLabel} · {fmtTime(m.createdAt)}</div>
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
            </div>
          </div>
        );
      })}
      {messages.length === 0 && (
        <div className="text-center text-xs text-muted-foreground">Sem mensagens ainda.</div>
      )}
    </div>
  );
}
