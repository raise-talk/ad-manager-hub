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
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const clientId = searchParams.get("clientId") ?? undefined;

  const alerts = await prisma.alert.findMany({
    where: {
      status: status ? (status.toUpperCase() as "NEW" | "READ" | "RESOLVED") : undefined,
      type: type ? (type.toUpperCase() as "BUDGET_LOW") : undefined,
      clientId: clientId ?? undefined,
    },
    include: {
      client: true,
      adAccount: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const normalizedAlerts = alerts.map((alert) => ({
    ...alert,
    adAccount: alert.adAccount
      ? {
          ...alert.adAccount,
          spendCap: normalizeBigInt(alert.adAccount.spendCap),
        }
      : null,
    campaign: alert.campaign
      ? {
          ...alert.campaign,
          dailyBudget: normalizeBigInt(alert.campaign.dailyBudget),
          lifetimeBudget: normalizeBigInt(alert.campaign.lifetimeBudget),
        }
      : null,
  }));

  return NextResponse.json(normalizedAlerts);
}
