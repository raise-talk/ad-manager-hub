import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MINUTES = 60;

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Não revelar usuários inexistentes
    return NextResponse.json({ ok: true });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await bcrypt.hash(rawToken, 10);
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  const resetLink = `${baseUrl}/auth/resetar-senha?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  // Aqui enviar email de verdade. Por enquanto, apenas logamos no server.
  console.log("Password reset link:", resetLink);

  return NextResponse.json({ ok: true });
}
