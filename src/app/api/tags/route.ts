import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ensureSystemTags } from "@/lib/seed-system-tags";

const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  color: z.string().min(4, "Cor inválida").max(30, "Cor inválida"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Garante que as tags de sistema existam (self-healing para usuários antigos)
    await ensureSystemTags(session.user.id);

    const tags = await prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

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

    const body = await req.json();
    const data = tagSchema.parse(body);

    // Check if tag with same name already exists for this user
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: data.name,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag com este nome já existe" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        ...data,
        userId: session.user.id,
        isSystem: false,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
