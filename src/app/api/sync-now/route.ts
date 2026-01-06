import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { fetchAllInsights, getStoredAccessToken } from "@/server/meta";

const LOOKBACK_DAYS = 90; // keep in sync with cron

const pickPrimaryResult = (
  actions: Array<{ action_type: string; value: string }> | undefined
) => {
  if (!actions) return 0;
  const order = [
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.messaging_conversation_started_7d",
    "messaging_conversation_started",
  ];
  for (const key of order) {
    const found = actions.find((a) => a.action_type === key);
    if (found) return Number(found.value ?? 0);
  }
  return 0;
};

export async function POST() {
  const { response } = await requireAuth();
  if (response) return response;

  const integration = await prisma.metaIntegration.findFirst({
    where: { status: "CONNECTED" },
  });

  if (!integration) {
    return NextResponse.json({ error: "No Meta integration" }, { status: 400 });
  }

  const accessToken = getStoredAccessToken(integration.accessTokenEncrypted);
  const linkedAccounts = await prisma.clientAdAccount.findMany({
    select: { adAccountId: true },
    distinct: ["adAccountId"],
  });

  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - LOOKBACK_DAYS);

  const since = from.toISOString().slice(0, 10);
  const until = to.toISOString().slice(0, 10);

  let created = 0;

  for (const { adAccountId } of linkedAccounts) {
    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const insights = await fetchAllInsights(accessToken, accountId, since, until);

    for (const entry of insights.data) {
      const leads = pickPrimaryResult(entry.actions);
      const spendCents = Math.round(Number(entry.spend) * 100);
      const cpl = leads > 0 ? Math.round(spendCents / leads) : null;
      await prisma.metricSnapshot.upsert({
        where: {
          scopeType_scopeId_date: {
            scopeType: "AD_ACCOUNT",
            scopeId: adAccountId,
            date: new Date(entry.date_start),
          },
        },
        update: {
          spend: spendCents,
          impressions: Number(entry.impressions),
          clicks: Number(entry.clicks),
          leads,
          cpl,
          source: "META",
        },
        create: {
          scopeType: "AD_ACCOUNT",
          scopeId: adAccountId,
          date: new Date(entry.date_start),
          spend: spendCents,
          impressions: Number(entry.impressions),
          clicks: Number(entry.clicks),
          leads,
          cpl,
          source: "META",
        },
      });
      created += 1;
    }
  }

  await prisma.metaIntegration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ created });
}
