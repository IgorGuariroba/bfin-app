import { NextResponse } from "next/response";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
    
    const { id } = await params;

    const body = await req.json();
    const data = tagSchema.parse(body);

    // Verify ownership
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If changing name, check uniqueness
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.tag.findUnique({
        where: {
          userId_name: {
            userId: session.user.id,
            name: data.name,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json({ error: "Tag com este nome já existe" }, { status: 400 });
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data,
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("PUT /api/tags/[id] error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
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

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tags/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
