import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { preferencesSchema } from "@/lib/validators";

export async function GET() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id ?? "" },
    select: { timezone: true, currency: true },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session?.user.id ?? "" },
    data: {
      timezone: parsed.data.timezone,
      currency: parsed.data.currency,
    },
  });

  return NextResponse.json({ timezone: user.timezone, currency: user.currency });
}
