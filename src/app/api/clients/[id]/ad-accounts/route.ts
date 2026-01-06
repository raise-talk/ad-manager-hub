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
  if (primaryAdAccountId && !adAccountIds.includes(primaryAdAccountId)) {
    return NextResponse.json(
      { error: "primaryAdAccountId deve estar na lista de adAccountIds" },
      { status: 400 },
    );
  }

  const existingAccounts = await prisma.adAccount.findMany({
    where: { id: { in: adAccountIds } },
    select: { id: true },
  });

  if (existingAccounts.length !== adAccountIds.length) {
    return NextResponse.json(
      { error: "Uma ou mais contas de anuncio nao foram encontradas" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.clientAdAccount.createMany({
      data: adAccountIds.map((adAccountId) => ({
        clientId: params.id,
        adAccountId,
        isPrimary: primaryAdAccountId === adAccountId,
      })),
      skipDuplicates: true,
    });

    if (primaryAdAccountId) {
      await tx.clientAdAccount.updateMany({
        where: { clientId: params.id },
        data: { isPrimary: false },
      });
      await tx.clientAdAccount.update({
        where: {
          clientId_adAccountId: {
            clientId: params.id,
            adAccountId: primaryAdAccountId,
          },
        },
        data: { isPrimary: true },
      });
    }
  });

  return NextResponse.json({ success: true });
}
