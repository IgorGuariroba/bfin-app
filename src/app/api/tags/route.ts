import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { z } from "zod";
import { tagsClient } from "@/lib/tags-client";
import { BackendError } from "@/lib/backend-client";

const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  color: z.string().min(4, "Cor inválida").max(30, "Cor inválida"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);

    const tags = await tagsClient.list(userId);

    return NextResponse.json(tags);
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getEffectiveUserId(session.user.id);

    const body = await req.json();
    const data = tagSchema.parse(body);

    const tag = await tagsClient.create({ userId, ...data });

    return NextResponse.json(tag, { status: 201 });
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
