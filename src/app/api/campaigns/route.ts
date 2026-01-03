import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const normalizeBigInt = (value: bigint | null | undefined) =>
  typeof value === "bigint" ? Number(value) : value;

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const adAccountId = searchParams.get("adAccountId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const adAccountIds = clientId
    ? (
        await prisma.clientAdAccount.findMany({
          where: { clientId },
          select: { adAccountId: true },
        })
      ).map((item) => item.adAccountId)
    : undefined;

  const campaigns = await prisma.campaign.findMany({
    where: {
      adAccountId: adAccountId ?? (adAccountIds ? { in: adAccountIds } : undefined),
      status: status ?? undefined,
    },
    include: {
      adAccount: {
        include: {
          clients: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = campaigns.map((campaign) => {
    const primaryClient = campaign.adAccount.clients.find((item) => item.isPrimary);
    return {
      ...campaign,
      dailyBudget: normalizeBigInt(campaign.dailyBudget),
      lifetimeBudget: normalizeBigInt(campaign.lifetimeBudget),
      adAccount: {
        ...campaign.adAccount,
        spendCap: normalizeBigInt(campaign.adAccount.spendCap),
      },
      clientId: primaryClient?.clientId ?? campaign.adAccount.clients[0]?.clientId ?? null,
    };
  });

  return NextResponse.json(data);
}
