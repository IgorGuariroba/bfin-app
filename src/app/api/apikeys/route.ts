import { auth } from "@/lib/auth";
import { apiKeysService } from "@/adapters";
import { ProRequiredError } from "@/core/identity";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await apiKeysService.listApiKeys(session.user.id);

  return Response.json(keys);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // plain é devolvido apenas aqui — nunca mais é recuperável.
    const issued = await apiKeysService.issueApiKey(session.user.id);
    return Response.json(issued, { status: 201 });
  } catch (error) {
    if (error instanceof ProRequiredError) {
      return Response.json({ error: "plan_required", upgrade: true }, { status: 403 });
    }
    throw error;
  }
}
