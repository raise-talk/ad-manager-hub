import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { businessSchema } from "@/lib/validators";

export async function GET() {
  const { response, session } = await requireAuth();
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id ?? "" },
    select: { businessName: true, businessLogo: true },
  });

  return NextResponse.json({
    businessName: user?.businessName ?? "",
    businessLogo: user?.businessLogo ?? null,
  });
}

export async function PUT(request: Request) {
  const { response, session } = await requireAuth();
  if (response) return response;

  const body = await request.json();
  const parsed = businessSchema.safeParse({
    name: body.name,
    logo: body.logo,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session?.user.id ?? "" },
    data: {
      businessName: parsed.data.name,
      businessLogo: parsed.data.logo,
    },
    select: { businessName: true, businessLogo: true },
  });

  return NextResponse.json({
    businessName: user.businessName ?? "",
    businessLogo: user.businessLogo ?? null,
  });
}
