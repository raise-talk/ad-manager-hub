import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adAccountLinkSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = adAccountLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { adAccountIds, primaryAdAccountId } = parsed.data;

  await prisma.clientAdAccount.createMany({
    data: adAccountIds.map((adAccountId) => ({
      clientId: params.id,
      adAccountId,
      isPrimary: primaryAdAccountId === adAccountId,
    })),
    skipDuplicates: true,
  });

  if (primaryAdAccountId) {
    await prisma.clientAdAccount.updateMany({
      where: { clientId: params.id },
      data: { isPrimary: false },
    });
    await prisma.clientAdAccount.update({
      where: {
        clientId_adAccountId: {
          clientId: params.id,
          adAccountId: primaryAdAccountId,
        },
      },
      data: { isPrimary: true },
    });
  }

  return NextResponse.json({ success: true });
}
