import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { z } from "zod";
import { tagsService } from "@/adapters";
import { TagValidationError } from "@/core/tags";

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

    const tags = await tagsService.listTags(userId);

    return NextResponse.json(tags);
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const tag = await tagsService.createTag({ userId, ...data });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    if (error instanceof TagValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/tags error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
