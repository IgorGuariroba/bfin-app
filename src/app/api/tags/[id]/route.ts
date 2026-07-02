import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEffectiveUserId } from "@/lib/effective-user";
import { z } from "zod";
import { tagsService } from "@/adapters";
import {
  SystemTagImmutableError,
  TagNotFoundError,
  TagValidationError,
} from "@/core/tags";

const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo").optional(),
  color: z.string().min(4, "Cor inválida").max(30, "Cor inválida").optional(),
});

// Mapeia erros de domínio do core para HTTP; retorna null se o erro não é de domínio.
function domainErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof TagNotFoundError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error instanceof SystemTagImmutableError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof TagValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return null;
}

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

    const tag = await tagsService.updateTag(userId, id, data);

    return NextResponse.json(tag);
  } catch (error) {
    const domainResponse = domainErrorResponse(error);
    if (domainResponse) return domainResponse;
    console.error("PUT /api/tags/[id] error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    await tagsService.deleteTag(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const domainResponse = domainErrorResponse(error);
    if (domainResponse) return domainResponse;
    console.error("DELETE /api/tags/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
