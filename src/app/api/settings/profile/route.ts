import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { profileSchema } from "@/lib/validators";

export async function PUT(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : undefined;

  const user = await prisma.user.update({
    where: { id: session?.user.id ?? "" },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: passwordHash ?? undefined,
    },
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
