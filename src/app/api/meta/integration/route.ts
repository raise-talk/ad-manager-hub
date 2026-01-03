import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  return NextResponse.json(integration);
}

export async function DELETE() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const existing = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  if (!existing) {
    return NextResponse.json({ status: "DISCONNECTED" });
  }

  await prisma.metaIntegration.update({
    where: { userId: session?.user.id ?? "" },
    data: { status: "DISCONNECTED", accessTokenEncrypted: "", tokenExpiresAt: null },
  });

  return NextResponse.json({ status: "DISCONNECTED" });
}
