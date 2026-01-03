import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { alertConfigSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const config = await prisma.alertConfig.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = alertConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const config = await prisma.alertConfig.upsert({
    where: { userId: session?.user.id ?? "" },
    update: {
      budgetLowThreshold: parsed.data.budgetLowThreshold,
      enabled: parsed.data.enabled,
    },
    create: {
      userId: session?.user.id ?? "",
      budgetLowThreshold: parsed.data.budgetLowThreshold,
      enabled: parsed.data.enabled,
    },
  });

  return NextResponse.json(config);
}
