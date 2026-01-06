import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { fetchAllInsights, getStoredAccessToken } from "@/server/meta";
import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const clientId = searchParams.get("clientId");

  const buildDateRange = () => {
    const defaultTo = new Date();
    defaultTo.setUTCHours(0, 0, 0, 0);
    defaultTo.setUTCDate(defaultTo.getUTCDate() - 1); // ontem em UTC

    const rawTo = toParam ? new Date(toParam) : defaultTo;
    const to = new Date(rawTo);
    to.setUTCHours(23, 59, 59, 999); // fim do dia UTC

    const rawFrom = fromParam
      ? new Date(fromParam)
      : (() => {
          const f = new Date(to);
          f.setUTCDate(f.getUTCDate() - 30);
          return f;
        })();
    const from = new Date(rawFrom);
    from.setUTCHours(0, 0, 0, 0); // início do dia UTC

    return { from, to };
  };

  const { from, to } = buildDateRange();
  const monthFrom = new Date();
  monthFrom.setUTCDate(1);
  monthFrom.setUTCHours(0, 0, 0, 0);
  const monthTo = new Date();
  monthTo.setUTCHours(23, 59, 59, 999);

  const adAccountIds = clientId
    ? (
        await prisma.clientAdAccount.findMany({
          where: { clientId },
          select: { adAccountId: true },
        })
      ).map((item) => item.adAccountId)
    : undefined;

  const adAccounts = await prisma.adAccount.findMany({
    where: { id: adAccountIds ? { in: adAccountIds } : undefined },
    include: {
      clients: { include: { client: true } },
    },
  });

  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      scopeType: "AD_ACCOUNT",
      date: {
        gte: from,
        lte: to,
      },
      scopeId: adAccountIds ? { in: adAccountIds } : undefined,
    },
    orderBy: { date: "asc" },
  });

  let totalSpend = snapshots.reduce((sum, item) => sum + item.spend / 100, 0);
  let totalLeads = snapshots.reduce((sum, item) => sum + item.leads, 0);
  let totalClicks = snapshots.reduce((sum, item) => sum + item.clicks, 0);

  let timeline: Record<string, number> = snapshots.reduce<
    Record<string, number>
  >((acc, snap) => {
    const dateKey = snap.date.toISOString().slice(0, 10);
    acc[dateKey] = (acc[dateKey] ?? 0) + snap.spend / 100;
    return acc;
  }, {});

  let highlightData: Array<{
    id: string;
    nome: string;
    cliente: string;
    status: string;
    gastoMensal: number;
    orcamento: number;
    ultimaAtualizacao: Date;
  }> = [];

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });
  const accessToken =
    integration && integration.status === "CONNECTED"
      ? getStoredAccessToken(integration.accessTokenEncrypted)
      : null;

  if (accessToken) {
    const liveTimeline: Record<string, number> = {};
    let liveTotalSpend = 0;
    let liveTotalLeads = 0;
    let liveTotalClicks = 0;
    const liveHighlight: typeof highlightData = [];

    const fromIso = from.toISOString().split("T")[0];
    const toIso = to.toISOString().split("T")[0];
    const monthFromIso = monthFrom.toISOString().split("T")[0];
    const monthToIso = monthTo.toISOString().split("T")[0];

    const results = await Promise.all(
      adAccounts.map(async (account) => {
        const accountId = account.id.startsWith("act_")
          ? account.id
          : `act_${account.id}`;

        const [rangeRes, monthRes] = await Promise.all([
          fetchAllInsights(accessToken, accountId, fromIso, toIso),
          fetchAllInsights(accessToken, accountId, monthFromIso, monthToIso),
        ]);

        let accountSpendRange = 0;
        let accountLeadsRange = 0;
        let accountClicksRange = 0;

        rangeRes.data.forEach((entry) => {
          const spend = Number(entry.spend ?? "0");
          accountSpendRange += spend;
          accountLeadsRange += pickPrimaryResult(entry.actions);
          accountClicksRange += Number(entry.clicks ?? "0");

          const dateKey = entry.date_start;
          liveTimeline[dateKey] = (liveTimeline[dateKey] ?? 0) + spend;
        });

        const monthSpend = monthRes.data.reduce(
          (sum, entry) => sum + Number(entry.spend ?? "0"),
          0
        );

        const primaryClient = account.clients.find(
          (item) => item.isPrimary
        )?.client;

        return {
          accountSpendRange,
          accountLeadsRange,
          accountClicksRange,
          monthSpend,
          highlight: {
            id: account.id,
            nome: account.name,
            cliente:
              primaryClient?.name ?? account.clients[0]?.client.name ?? "-",
            status: account.status,
            gastoMensal: monthSpend,
            orcamento: Number(account.spendCap ?? 0) / 100,
            ultimaAtualizacao: new Date(),
          },
        };
      })
    );

    results.forEach((res) => {
      liveTotalSpend += res.accountSpendRange;
      liveTotalLeads += res.accountLeadsRange;
      liveTotalClicks += res.accountClicksRange;
      liveHighlight.push(res.highlight);
    });

    // Prioriza métricas ao vivo quando há integração conectada
    totalSpend = liveTotalSpend;
    totalLeads = liveTotalLeads;
    totalClicks = liveTotalClicks;
    timeline = liveTimeline;
    highlightData = liveHighlight;
  }

  console.log({ totalSpend, totalLeads, totalClicks });

  if (highlightData.length === 0) {
    highlightData = await Promise.all(
      adAccounts.map(async (account) => {
        const accountSnapshots = snapshots.filter(
          (snap) =>
            snap.scopeId === account.id &&
            snap.date >= monthFrom &&
            snap.date <= monthTo
        );
        const spend = accountSnapshots.reduce(
          (sum, snap) => sum + snap.spend / 100,
          0
        );
        const lastSync = accountSnapshots.at(-1)?.date ?? account.updatedAt;
        const primaryClient = account.clients.find(
          (item) => item.isPrimary
        )?.client;
        return {
          id: account.id,
          nome: account.name,
          cliente:
            primaryClient?.name ?? account.clients[0]?.client.name ?? "-",
          status: account.status,
          gastoMensal: spend,
          orcamento: Number(account.spendCap ?? 0) / 100,
          ultimaAtualizacao: lastSync,
        };
      })
    );
  }

  const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const responseRate =
    totalClicks > 0 ? Number(((totalLeads / totalClicks) * 100).toFixed(1)) : 0;

  const timelineData = Object.entries(timeline).map(([date, value]) => ({
    date,
    value,
  }));

  const activeClientsCount = clientId
    ? 1
    : await prisma.client.count({
        where: { status: "ACTIVE" },
      });

  return NextResponse.json({
    kpis: {
      gastoMes: totalSpend,
      leadsMes: totalLeads,
      cpl,
      taxaResposta: responseRate,
      clientesAtivos: activeClientsCount,
    },
    timeline: timelineData,
    highlights: highlightData,
  });
}
