import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (!email || !token || !password) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      expires: { gt: new Date() },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(token, record.token);
  if (!isValid) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({
    where: { token: record.token },
  });

  return NextResponse.json({ ok: true });
}
