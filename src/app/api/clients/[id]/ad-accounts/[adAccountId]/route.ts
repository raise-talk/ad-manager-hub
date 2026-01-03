import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; adAccountId: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  await prisma.clientAdAccount.delete({
    where: {
      clientId_adAccountId: {
        clientId: params.id,
        adAccountId: params.adAccountId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
