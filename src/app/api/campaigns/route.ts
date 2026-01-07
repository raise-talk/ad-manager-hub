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

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const parseBudget = (value: string | number | null | undefined) => Number(value ?? 0);

const buildDateRange = (preset: string, to: Date, timeZone: string) => {
  const end = getDateInTz(to, timeZone);
  const start = getDateInTz(to, timeZone);

  const setYesterdayWindow = (days: number) => {
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
      setYesterdayWindow(1);
      break;
    case "7d":
      setYesterdayWindow(7);
      break;
    case "30d":
      setYesterdayWindow(30);
      break;
    case "90d":
      setYesterdayWindow(90);
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / MS_IN_DAY) + 1;

  return {
    since: formatDateTz(start, timeZone),
    until: formatDateTz(end, timeZone),
    days: Math.max(1, diffDays),
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
            const campaignDaily = parseBudget(details.daily_budget);
            const campaignLifetime = parseBudget(details.lifetime_budget);
            dailyBudget = Math.max(dailyBudget, campaignDaily);
            lifetimeBudget = Math.max(lifetimeBudget, campaignLifetime);
          }

          if (adSetsRes.status === "fulfilled" && adSetsRes.value) {
            const adSets = adSetsRes.value.data;
            const isActive = (a: { status?: string | null; effective_status?: string | null }) => {
              const raw = `${a.status ?? ""} ${a.effective_status ?? ""}`.toLowerCase();
              return raw.includes("active");
            };
            const sumBudget = (items: typeof adSets) =>
              items.reduce((acc, a) => {
                const daily = parseBudget(a.daily_budget);
                const remaining = parseBudget(a.budget_remaining);
                const val = daily || remaining || 0;
                return acc + val;
              }, 0);

            const activeSum = sumBudget(adSets.filter(isActive));
            const allSum = sumBudget(adSets);
            let adSetDaily = activeSum || allSum || 0;

            // Proteção: se a API devolver em unidade maior (R$) e não centavos, corrige.
            if (adSetDaily > 0 && adSetDaily < 100 && spendCents > 0) {
              adSetDaily = Math.round(adSetDaily * 100);
            }

            dailyBudget = Math.max(dailyBudget, adSetDaily);

            const lifeSum = adSetsRes.value.data.reduce(
              (acc, a) => acc + parseBudget(a.lifetime_budget),
              0,
            );
            lifetimeBudget = Math.max(lifetimeBudget, Number(lifeSum ?? 0));
          }

          // Se não encontramos budget diário explícito, podemos derivar de lifetime
          if (dailyBudget === 0 && lifetimeBudget > 0) {
            const estimated = Math.floor(lifetimeBudget / Math.max(1, dateRange.days));
            dailyBudget = Math.max(dailyBudget, estimated);
          }

          // Último recurso: se ainda zerado mas houve gasto, usar gasto médio diário
          if (dailyBudget === 0 && spendCents > 0 && dateRange.days > 0) {
            dailyBudget = Math.round(spendCents / dateRange.days);
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

