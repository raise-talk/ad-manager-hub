import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const clientId = searchParams.get("clientId");

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(new Date().setDate(to.getDate() - 30));

  const adAccountIds = clientId
    ? (
        await prisma.clientAdAccount.findMany({
          where: { clientId },
          select: { adAccountId: true },
        })
      ).map((item) => item.adAccountId)
    : undefined;

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

  const totalSpend = snapshots.reduce((sum, item) => sum + item.spend, 0);
  const totalLeads = snapshots.reduce((sum, item) => sum + item.leads, 0);
  const totalClicks = snapshots.reduce((sum, item) => sum + item.clicks, 0);
  const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;
  const roas = totalClicks > 0 ? Number((totalLeads / totalClicks).toFixed(2)) : 0;

  const timeline = snapshots.reduce<Record<string, number>>((acc, snap) => {
    const dateKey = snap.date.toISOString().slice(0, 10);
    acc[dateKey] = (acc[dateKey] ?? 0) + snap.spend;
    return acc;
  }, {});

  const timelineData = Object.entries(timeline).map(([date, value]) => ({
    date,
    value,
  }));

  const highlightAccounts = await prisma.adAccount.findMany({
    where: {
      id: adAccountIds ? { in: adAccountIds } : undefined,
    },
    include: {
      clients: {
        include: { client: true },
      },
      campaigns: true,
    },
  });

  const highlightData = await Promise.all(
    highlightAccounts.map(async (account) => {
      const accountSnapshots = snapshots.filter((snap) => snap.scopeId === account.id);
      const spend = accountSnapshots.reduce((sum, snap) => sum + snap.spend, 0);
      const lastSync = accountSnapshots.at(-1)?.date ?? account.updatedAt;
      const primaryClient = account.clients.find((item) => item.isPrimary)?.client;
      return {
        id: account.id,
        nome: account.name,
        cliente: primaryClient?.name ?? account.clients[0]?.client.name ?? "-",
        status: account.status,
        gastoMensal: spend,
        orcamento: Number(account.spendCap ?? 0),
        ultimaAtualizacao: lastSync,
      };
    }),
  );

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
      roas,
      clientesAtivos: activeClientsCount,
    },
    timeline: timelineData,
    highlights: highlightData,
  });
}
