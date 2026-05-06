import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";

const sugestaoSchema = z.object({
  message: z.string().trim().min(5, "Mensagem muito curta").max(2000, "Mensagem muito longa"),
  category: z.enum(["bug", "feature", "improvement", "other"]).default("other"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = sugestaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    const { message, category } = parsed.data;
    const userEmail = session.user.email ?? "sem-email";
    const userName = session.user.name ?? "Usuário";

    const payload = {
      userId: session.user.id,
      email: userEmail,
      name: userName,
      category,
      message,
      at: new Date().toISOString(),
    };

    console.log("[sugestao]", payload);

    const webhook = process.env.DISCORD_SUGESTOES_WEBHOOK;
    if (webhook) {
      const CATEGORY_LABEL: Record<string, string> = {
        feature: "💡 Nova ideia",
        improvement: "✨ Melhoria",
        bug: "🐞 Problema",
        other: "💬 Outro",
      };
      const COLORS: Record<string, number> = {
        feature: 0xff385c,
        improvement: 0x2db55d,
        bug: 0xc13515,
        other: 0x6a6a6a,
      };

      const discordBody = {
        embeds: [
          {
            title: CATEGORY_LABEL[category] ?? category,
            description: message,
            color: COLORS[category] ?? 0x222222,
            fields: [
              { name: "Usuário", value: `${userName} (${userEmail})`, inline: false },
            ],
            timestamp: payload.at,
          },
        ],
      };

      try {
        const r = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordBody),
        });
        if (!r.ok) {
          console.error("Discord webhook failed:", r.status, await r.text());
        }
      } catch (err) {
        console.error("Discord webhook error:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/sugestoes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
