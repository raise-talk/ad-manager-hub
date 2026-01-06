import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  fetchCampaignAdSets,
  fetchCampaignDetails,
  fetchCampaignInsights,
  getStoredAccessToken,
} from "@/server/meta";

type TimelinePoint = { date: string; spendCents: number; results: number };

const normalizeBigInt = (value: bigint | null | undefined) =>
  typeof value === "bigint" ? Number(value) : value;

const pickResult = (actions: Array<{ action_type: string; value: string }> | undefined) => {
  if (!actions) return 0;
  const order = [
    "onsite_conversion.messaging_first_reply",
    "onsite_conversion.messaging_conversation_started_7d",
    "omni_chat_thread",
    "messaging_conversation_started",
    "profile_visits",
    "lead",
    "link_click",
  ];
  for (const key of order) {
    const found = actions.find((a) => a.action_type === key);
    if (found) return Number(found.value ?? 0);
  }
  return 0;
};

const getDateInTz = (date: Date, timeZone: string) =>
  new Date(date.toLocaleString("en-US", { timeZone }));

const formatDateTz = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);

const buildDateRange = (preset: string, to: Date, timeZone: string) => {
  const end = getDateInTz(to, timeZone);
  const start = getDateInTz(to, timeZone);

  const useYesterdayWindow = (days: number) => {
    // end = fim do dia de ontem (no fuso alvo)
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    // start = (dias - 1) antes do end, no inicio do dia
    start.setTime(end.getTime());
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
  };

  switch (preset) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      useYesterdayWindow(1);
      break;
    case "7d":
      useYesterdayWindow(7);
      break;
    case "30d":
      useYesterdayWindow(30);
      break;
    case "90d":
      useYesterdayWindow(90);
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return {
    since: formatDateTz(start, timeZone),
    until: formatDateTz(end, timeZone),
  };
};

export async function GET(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const adAccountId = searchParams.get("adAccountId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const adAccountIds = clientId
    ? (
        await prisma.clientAdAccount.findMany({
          where: { clientId },
          select: { adAccountId: true },
        })
      ).map((item) => item.adAccountId)
    : undefined;

  const range = searchParams.get("range") ?? "today";
  const toParam = searchParams.get("to");
  const to = toParam ? new Date(toParam) : new Date();
  const timeZone = searchParams.get("tz") ?? "America/Sao_Paulo";
  const dateRange = buildDateRange(range, to, timeZone);

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  const accessToken =
    integration && integration.status === "CONNECTED"
      ? getStoredAccessToken(integration.accessTokenEncrypted)
      : null;

  const campaigns = await prisma.campaign.findMany({
    where: {
      adAccountId: adAccountId ?? (adAccountIds ? { in: adAccountIds } : undefined),
      status: status ?? undefined,
      name: search
        ? {
            contains: search,
            mode: "insensitive",
          }
        : undefined,
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

  const data = await Promise.all(
    campaigns.map(async (campaign) => {
      const primaryClient = campaign.adAccount.clients.find((item) => item.isPrimary);
      let dailyBudget = Number(normalizeBigInt(campaign.dailyBudget) ?? 0);
      let lifetimeBudget = Number(normalizeBigInt(campaign.lifetimeBudget) ?? 0);
      let leads = 0;
      let spendCents = 0;
      let timeline: TimelinePoint[] = [];

      if (accessToken) {
        try {
          const [insightsRes, adSetsRes, detailsRes] = await Promise.allSettled([
            fetchCampaignInsights(accessToken, campaign.id, dateRange.since, dateRange.until, "1"),
            fetchCampaignAdSets(accessToken, campaign.id),
            fetchCampaignDetails(accessToken, campaign.id),
          ]);

          if (insightsRes.status === "fulfilled" && insightsRes.value.data) {
            const insights = insightsRes.value.data;
            spendCents = Math.round(
              insights.reduce((acc, item) => acc + Number(item.spend ?? "0"), 0) * 100,
            );
            leads = insights.reduce((acc, item) => acc + pickResult(item.actions), 0);
            timeline = insights.map((entry) => ({
              date: entry.date_start,
              spendCents: Math.round(Number(entry.spend ?? "0") * 100),
              results: pickResult(entry.actions),
            }));
          }

          if (detailsRes.status === "fulfilled" && detailsRes.value) {
            const details = detailsRes.value;
            const campaignDaily = Number(details.daily_budget ?? 0);
            const campaignLifetime = Number(details.lifetime_budget ?? 0);
            dailyBudget = Math.max(dailyBudget, campaignDaily);
            lifetimeBudget = Math.max(lifetimeBudget, campaignLifetime);
          }

          if (adSetsRes.status === "fulfilled" && adSetsRes.value) {
            const activeSum = adSetsRes.value.data
              .filter((a) => {
                const raw = `${a.status ?? ""} ${a.effective_status ?? ""}`.toLowerCase();
                return raw.includes("active");
              })
              .reduce(
                (acc, a) =>
                  acc +
                  Number(
                    a.daily_budget ??
                      a.budget_remaining ??
                      0,
                  ),
                0,
              );
            const allSum = adSetsRes.value.data.reduce(
              (acc, a) =>
                acc +
                Number(
                  a.daily_budget ??
                    a.budget_remaining ??
                    0,
                ),
              0,
            );
            const adSetDaily = activeSum || allSum || 0;
            dailyBudget = Math.max(dailyBudget, Number(adSetDaily ?? 0));

            const lifeSum = adSetsRes.value.data.reduce(
              (acc, a) => acc + Number(a.lifetime_budget ?? 0),
              0,
            );
            lifetimeBudget = Math.max(lifetimeBudget, Number(lifeSum ?? 0));
          }
        } catch (err) {
          console.error("campaign enrichment error", err);
        }
      }

      return {
        ...campaign,
        dailyBudget,
        lifetimeBudget,
        spendCents,
        leads,
        timeline,
        adAccount: {
          ...campaign.adAccount,
          spendCap: normalizeBigInt(campaign.adAccount.spendCap),
        },
        clientId: primaryClient?.clientId ?? campaign.adAccount.clients[0]?.clientId ?? null,
      };
    }),
  );

  return NextResponse.json(data);
}

