import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const alert = await prisma.alert.update({
    where: { id: params.id },
    data: { status: "READ" },
  });

  return NextResponse.json(alert);
}
