"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

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
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

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
    fetchList();
    const intv = setInterval(fetchList, POLL_MS);
    return () => clearInterval(intv);
  }, [fetchList]);

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
    try {
      const res = await fetch(`/api/admin/whatsapp/conversations/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erro ao enviar");
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
    const res = await fetch(`/api/admin/whatsapp/conversations/${selectedId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      toast.error("Erro ao atualizar status");
    } else {
      fetchDetail(selectedId);
      fetchList();
    }
  }

  async function handleDeleteContact() {
    if (!detail?.contact.id) return;
    const res = await fetch(`/api/admin/whatsapp/contacts/${detail.contact.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Contato apagado");
      setSelectedId(null);
      setDetail(null);
      fetchList();
    } else {
      toast.error("Erro ao apagar contato");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.2px] text-ink">WhatsApp</h1>
        <p className="mt-1 text-[14px] text-muted">Atendimento de conversas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", "waiting_human", "bot", "human", "closed", "rate_limited"] as const).map((s) => {
          const label = s === "" ? `Todas (${conversations.length})` : `${STATUS_LABEL[s]} (${counts[s] ?? 0})`;
          return (
            <Button
              key={s || "all"}
              type="button"
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <div className="grid h-[calc(100vh-14rem)] gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="rounded-[14px] overflow-hidden py-0">
          <ul className="h-full overflow-y-auto">
            {conversations.length === 0 && (
              <li className="p-6 text-center text-sm text-muted">Nenhuma conversa.</li>
            )}
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full border-b border-hairline-soft p-3 text-left transition-colors ${
                    selectedId === c.id ? "bg-surface-strong" : "hover:bg-surface-soft"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{c.contact.name ?? c.contact.phone}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-1 truncate text-xs text-muted">
                    {c.lastMessage ? c.lastMessage.body : "—"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted">{fmtTime(c.lastMessageAt)}</div>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col overflow-hidden rounded-[14px] py-0">
          {!detail ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted">
              Selecione uma conversa.
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline p-4">
                <div>
                  <div className="font-medium text-ink">{detail.contact.name ?? detail.contact.phone}</div>
                  <div className="text-xs text-muted">{detail.contact.phone}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="destructive">
                        <Trash2 size={14} />
                        Apagar
                      </Button>
                    }
                    title="Apagar contato (LGPD)"
                    description={`Apagar contato ${detail.contact.phone} e todas as conversas? Ação irreversível.`}
                    confirmLabel="Apagar definitivamente"
                    onConfirm={handleDeleteContact}
                  />
                </div>
              </header>

              <MessageList messages={detail.messages} />

              <form onSubmit={handleReply} className="flex gap-2 border-t border-hairline p-3">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Responder como humano…"
                  maxLength={4096}
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !reply.trim()}>
                  <Send size={14} />
                  {sending ? "Enviando…" : "Enviar"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function MessageList({ messages }: { messages: Message[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [messages.length]);

  return (
    <div ref={ref} className="flex-1 space-y-2 overflow-y-auto p-4">
      {messages.map((m) => {
        const isOutbound = m.direction === "outbound";
        const senderLabel = m.sender === "admin" ? "Você" : m.sender === "bot" ? "Bot" : "Contato";
        return (
          <div key={m.id} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                isOutbound ? "bg-primary text-primary-foreground" : "bg-surface-strong text-ink"
              }`}
            >
              <div className="mb-0.5 text-[10px] opacity-70">{senderLabel} · {fmtTime(m.createdAt)}</div>
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
            </div>
          </div>
        );
      })}
      {messages.length === 0 && (
        <div className="text-center text-xs text-muted">Sem mensagens ainda.</div>
      )}
    </div>
  );
}
