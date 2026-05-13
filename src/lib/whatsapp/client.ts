import "server-only";

const GRAPH_VERSION = "v21.0";

type ListRow = { id: string; title: string; description?: string };

function endpoint(): string {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) throw new Error("WHATSAPP_PHONE_NUMBER_ID não configurado");
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`;
}

async function post(body: unknown): Promise<{ wamid?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN não configurado");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Meta API erro ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  return { wamid: data.messages?.[0]?.id };
}

export async function sendText(to: string, body: string): Promise<{ wamid?: string }> {
  return post({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body, preview_url: true },
  });
}

export async function sendListMenu(params: {
  to: string;
  bodyText: string;
  buttonText: string;
  sectionTitle: string;
  rows: ListRow[];
}): Promise<{ wamid?: string }> {
  return post({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: params.to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: params.bodyText },
      action: {
        button: params.buttonText,
        sections: [
          {
            title: params.sectionTitle,
            rows: params.rows.map((r) => ({
              id: r.id,
              title: r.title,
              ...(r.description ? { description: r.description } : {}),
            })),
          },
        ],
      },
    },
  });
}

export async function markRead(messageId: string): Promise<void> {
  await post({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
