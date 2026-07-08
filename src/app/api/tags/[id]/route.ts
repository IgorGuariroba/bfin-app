import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { z } from "zod";
import { tagsClient } from "@/lib/tags-client";
import { BackendError } from "@/lib/backend-client";

const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo").optional(),
  color: z.string().min(4, "Cor inválida").max(30, "Cor inválida").optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);

    const { id } = await params;

    const body = await req.json();
    const data = tagSchema.parse(body);

    const tag = await tagsClient.update(userId, id, data);

    return NextResponse.json(tag);
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);

    const { id } = await params;

    await tagsClient.remove(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
