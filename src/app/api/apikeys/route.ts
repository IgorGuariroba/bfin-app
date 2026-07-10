import { auth } from "@/lib/auth";
import { apikeysClient } from "@/lib/apikeys-client";
import { BackendError, backendErrorResponseOrRethrow } from "@/lib/backend-client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const keys = await apikeysClient.list(session.user.id);
    return Response.json(keys);
  } catch (error) {
    return backendErrorResponseOrRethrow(error);
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // plain é devolvido apenas aqui — nunca mais é recuperável.
    const issued = await apikeysClient.issue(session.user.id);
    return Response.json(issued, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError && error.status === 403) {
      return Response.json({ error: "plan_required", upgrade: true }, { status: 403 });
    }
    return backendErrorResponseOrRethrow(error);
  }
}
