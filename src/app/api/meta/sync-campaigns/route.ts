import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { fetchCampaigns, getStoredAccessToken } from "@/server/meta";

const mapStatus = (status?: string | null) => {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("active")) return "ACTIVE";
  if (normalized.includes("paused") || normalized.includes("disabled")) return "PAUSED";
  if (normalized.includes("archived") || normalized.includes("completed")) return "ARCHIVED";
  return "UNKNOWN";
};

export async function POST() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  if (!integration || integration.status !== "CONNECTED") {
    return NextResponse.json({ error: "Integração Meta não conectada." }, { status: 400 });
  }

  const accessToken = getStoredAccessToken(integration.accessTokenEncrypted);

  const adAccounts = await prisma.adAccount.findMany({
    select: { id: true },
  });

  let synced = 0;

  for (const account of adAccounts) {
    const { data } = await fetchCampaigns(accessToken, account.id);
    for (const campaign of data) {
      await prisma.campaign.upsert({
        where: { id: campaign.id },
        update: {
          adAccountId: account.id,
          name: campaign.name,
          objective: campaign.objective ?? null,
          status: mapStatus(campaign.status),
          effectiveStatus: campaign.effective_status ?? null,
          dailyBudget: campaign.daily_budget ? BigInt(campaign.daily_budget) : null,
          lifetimeBudget: campaign.lifetime_budget ? BigInt(campaign.lifetime_budget) : null,
          updatedTime: campaign.updated_time ? new Date(campaign.updated_time) : null,
        },
        create: {
          id: campaign.id,
          adAccountId: account.id,
          name: campaign.name,
          objective: campaign.objective ?? null,
          status: mapStatus(campaign.status),
          effectiveStatus: campaign.effective_status ?? null,
          dailyBudget: campaign.daily_budget ? BigInt(campaign.daily_budget) : null,
          lifetimeBudget: campaign.lifetime_budget ? BigInt(campaign.lifetime_budget) : null,
          updatedTime: campaign.updated_time ? new Date(campaign.updated_time) : null,
        },
      });
      synced += 1;
    }
  }

  await prisma.metaIntegration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ synced });
}
