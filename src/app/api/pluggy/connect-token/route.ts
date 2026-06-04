import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { getUserPlan } from "@/lib/plan";
import { createConnectToken } from "@/lib/pluggy/client";
import { SITE_URL } from "@/lib/site-url";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Conexão bancária é feature Pro.
  const plan = await getUserPlan(session.user.id);
  if (plan !== "pro") {
    return Response.json({ error: "plan_required", upgrade: true }, { status: 403 });
  }

  // Escopa o connect token ao usuário dono (respeita delegação).
  const userId = await getEffectiveUserId(session.user.id);

  try {
    const accessToken = await createConnectToken({
      clientUserId: userId,
      webhookUrl: `${SITE_URL}/api/pluggy/webhook`,
    });
    return Response.json({ accessToken });
  } catch (err) {
    console.error("[pluggy] connect-token error:", err);
    return Response.json({ error: "Falha ao iniciar conexão" }, { status: 500 });
  }
}
