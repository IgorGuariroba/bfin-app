import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setAutoBaixaDiario, ProRequiredError } from "@/lib/user-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, plan: true, autoBaixaDiario: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, currentPassword, newPassword, autoBaixaDiario } = body;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Toggle da baixa automática: regra de plano vive no serviço (ADR-0005).
  if (autoBaixaDiario !== undefined) {
    if (typeof autoBaixaDiario !== "boolean") {
      return NextResponse.json({ error: "autoBaixaDiario deve ser booleano" }, { status: 400 });
    }
    try {
      await setAutoBaixaDiario(session.user.id, autoBaixaDiario);
    } catch (e) {
      if (e instanceof ProRequiredError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
  }

  const data: { name?: string; password?: string } = {};

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) return NextResponse.json({ error: "Nome não pode ser vazio" }, { status: 400 });
    data.name = trimmed;
  }

  if (newPassword !== undefined) {
    if (!user.password) {
      return NextResponse.json({ error: "Conta vinculada a provedor externo" }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ error: "Senha atual obrigatória" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }
    data.password = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(data).length === 0 && autoBaixaDiario === undefined) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: session.user.id }, data });
  }

  const updated = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, autoBaixaDiario: true },
  });

  return NextResponse.json(updated);
}
