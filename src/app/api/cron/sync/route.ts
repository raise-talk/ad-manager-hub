import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchInsights, getStoredAccessToken } from "@/server/meta";

const verifyCron = (request: Request) => {
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
};

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  from.setDate(to.getDate() - 30);

  const since = from.toISOString().slice(0, 10);
  const until = to.toISOString().slice(0, 10);

  let created = 0;

  for (const { adAccountId } of linkedAccounts) {
    const insights = await fetchInsights(accessToken, adAccountId, since, until);

    for (const entry of insights.data) {
      const leads =
        entry.actions?.find((action) => action.action_type.includes("lead"))?.value ?? "0";
      const spendCents = Math.round(Number(entry.spend) * 100);
      const leadsInt = Number(leads);
      const cpl = leadsInt > 0 ? Math.round(spendCents / leadsInt) : null;
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
          leads: leadsInt,
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
          leads: leadsInt,
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
