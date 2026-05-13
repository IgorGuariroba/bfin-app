import "server-only";
import { NextRequest } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { processBatch, type IncomingMessage } from "@/lib/whatsapp/bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("forbidden", { status: 403 });
}

type MetaTextMessage = { from: string; id: string; type: "text"; text: { body: string } };
type MetaListReply = {
  from: string;
  id: string;
  type: "interactive";
  interactive: {
    type: "list_reply" | "button_reply";
    list_reply?: { id: string; title: string };
    button_reply?: { id: string; title: string };
  };
};
type MetaAnyMessage = (MetaTextMessage | MetaListReply | { from: string; id: string; type: string }) & {
  from: string;
  id: string;
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: MetaAnyMessage[];
      };
    }>;
  }>;
};

function parseIncoming(msg: MetaAnyMessage, profileName?: string): IncomingMessage {
  const base = { wamid: msg.id, from: msg.from, profileName };
  if (msg.type === "text" && "text" in msg) {
    return { ...base, kind: "text", text: msg.text.body };
  }
  if (msg.type === "interactive" && "interactive" in msg) {
    if (msg.interactive.type === "list_reply" && msg.interactive.list_reply) {
      return {
        ...base,
        kind: "list_reply",
        replyId: msg.interactive.list_reply.id,
        text: msg.interactive.list_reply.title,
      };
    }
    if (msg.interactive.type === "button_reply" && msg.interactive.button_reply) {
      return {
        ...base,
        kind: "button_reply",
        replyId: msg.interactive.button_reply.id,
        text: msg.interactive.button_reply.title,
      };
    }
  }
  return { ...base, kind: "unknown" };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signature)) {
    return new Response("invalid signature", { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("ok", { status: 200 });
  }

  const incoming: IncomingMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue;
      const profileName = value.contacts?.[0]?.profile?.name;
      for (const msg of value.messages) {
        incoming.push(parseIncoming(msg, profileName));
      }
    }
  }

  if (incoming.length > 0) {
    void processBatch(incoming).catch((err) => {
      console.error("[whatsapp webhook] erro no processBatch", err);
    });
  }

  return new Response("ok", { status: 200 });
}
