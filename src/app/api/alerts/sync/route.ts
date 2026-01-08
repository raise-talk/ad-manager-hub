import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { fetchCampaignDetails, getStoredAccessToken } from "@/server/meta";

type MetricGroup = {
  spend: number;
  leads: number;
  impressions: number;
  clicks: number;
  date?: Date;
};

const cents = (value: number | bigint | null | undefined) =>
  Number(typeof value === "bigint" ? value : value ?? 0);

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export async function POST() {
  const { response, session } = await requireAuth();
  if (response) return response;

  const userId = session?.user.id ?? "";

  const config =
    (await prisma.alertConfig.findUnique({
      where: { userId },
    })) ?? {
      budgetLowThreshold: 10_00, // R$10
      enabled: true,
    };

  if (!config.enabled) {
    return NextResponse.json({ created: 0, skipped: "alerts disabled" });
  }

  const to = new Date();
  const yesterday = new Date();
  yesterday.setDate(to.getDate() - 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(to.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(to.getDate() - 14);

  // Usa uma transação única para evitar abrir várias conexões em paralelo (mitiga "too many connections")
  const [integration, campaigns, snapshots, existingAlertsRaw] = await prisma.$transaction([
    prisma.metaIntegration.findUnique({ where: { userId } }),
    prisma.campaign.findMany({
      include: {
        adAccount: {
          include: { clients: true },
        },
      },
    }),
    prisma.metricSnapshot.findMany({
      where: {
        scopeType: "CAMPAIGN",
        date: { gte: fourteenDaysAgo },
      },
    }),
    prisma.alert.findMany(),
  ]);

  const existingAlerts = Array.isArray(existingAlertsRaw) ? existingAlertsRaw : [];
  const existingMap = new Map<string, { status: string }>();
  const makeKey = (alert: { campaignId?: string | null; adAccountId?: string | null; title: string; message: string }) =>
    `${alert.campaignId ?? ""}|${alert.adAccountId ?? ""}|${alert.title}|${alert.message}`;
  existingAlerts.forEach((alert) => {
    existingMap.set(makeKey(alert as any), { status: (alert as any).status });
  });

  const snapshotByCampaign = snapshots.reduce<Record<string, Array<MetricGroup & { date: Date }>>>(
    (acc, snap) => {
      if (!acc[snap.scopeId]) acc[snap.scopeId] = [];
      acc[snap.scopeId].push({
        spend: snap.spend,
        leads: snap.leads,
        impressions: snap.impressions,
        clicks: snap.clicks,
        date: snap.date,
      });
      return acc;
    },
    {},
  );

  const alerts: Array<{
    severity: "LOW" | "MEDIUM" | "HIGH";
    status: "NEW" | "READ" | "RESOLVED";
    clientId?: string | null;
    adAccountId?: string | null;
    campaignId?: string | null;
    title: string;
    message: string;
    payload?: any;
  }> = [];

  const addAlert = (alert: (typeof alerts)[number]) => {
    const key = makeKey(alert);
    const exists = alerts.some((a) => makeKey(a) === key);
    if (exists) return;
    const previous = existingMap.get(key);
    const status = previous?.status ?? alert.status;
    alerts.push({ ...alert, status: status as any });
  };

  const accessToken =
    integration && integration.status === "CONNECTED"
      ? getStoredAccessToken(integration.accessTokenEncrypted)
      : null;
  const MAX_DETAIL_CALLS = 15;
  let detailCalls = 0;
  let rateLimited = false;

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const priority = (c: any) => {
      const status = `${c.status ?? ""} ${c.effectiveStatus ?? ""}`.toLowerCase();
      return status.includes("issues") || status.includes("inactive") || status.includes("pause") ? 0 : 1;
    };
    return priority(a) - priority(b);
  });

  for (const campaign of sortedCampaigns) {
    if (rateLimited) break;
    const primaryClient = campaign.adAccount.clients.find((c) => c.isPrimary)?.clientId;
    const metrics = (snapshotByCampaign[campaign.id] ?? []).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const spendLast7 = metrics.slice(-7).reduce((acc, m) => acc + m.spend, 0);
    const leadsLast7 = metrics.slice(-7).reduce((acc, m) => acc + m.leads, 0);

    const yesterdaySpend = metrics.length > 0 ? metrics[metrics.length - 1].spend : 0;
    const yesterdayLeads = metrics.length > 0 ? metrics[metrics.length - 1].leads : 0;
    const avg7 = spendLast7 > 0 ? spendLast7 / 7 : 0;

    let currentStatus = campaign.status ?? "";
    let currentEffectiveStatus = campaign.effectiveStatus ?? "";
    let issueInfoText = JSON.stringify((campaign as any).issues_info ?? "");

    const shouldFetchDetails = accessToken && detailCalls < MAX_DETAIL_CALLS;

    if (shouldFetchDetails) {
      try {
        const details = await fetchCampaignDetails(accessToken, campaign.id);
        currentStatus = details.status ?? currentStatus;
        currentEffectiveStatus = (details as any).effective_status ?? currentEffectiveStatus;
        issueInfoText = JSON.stringify((details as any).issues_info ?? issueInfoText);
        detailCalls += 1;
        // persist to keep DB aligned
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: currentStatus,
            effectiveStatus: currentEffectiveStatus,
          },
        });
      } catch (err: any) {
        console.error("alert sync: fetchCampaignDetails failed", err);
        const message = typeof err?.message === "string" ? err.message : "";
        const isRateLimit =
          message.includes("rate-limiting") ||
          message.includes("too many calls") ||
          (err?.error?.code === 80004 || err?.code === 80004);
        if (isRateLimit) {
          addAlert({
            severity: "MEDIUM",
            status: "NEW",
            clientId: null,
            adAccountId: campaign.adAccountId,
            campaignId: campaign.id,
            title: "Limite de chamadas atingido",
            message: "A Meta limitou chamadas desta conta. Tente novamente em alguns minutos.",
            payload: { code: err?.error?.code ?? err?.code, fbtrace_id: err?.error?.fbtrace_id },
          });
          rateLimited = true;
          // não interrompe sincronização dos demais alertas já calculados, mas para de chamar a API
          continue;
        }
      }
    }

    const issueText = issueInfoText.toLowerCase();
    const dailyBudget = cents(campaign.dailyBudget);

    const rawStatus = `${currentStatus ?? ""} ${currentEffectiveStatus ?? ""} ${issueText}`.toLowerCase();
    const hasPaymentError =
      rawStatus.includes("payment") ||
      rawStatus.includes("billing") ||
      rawStatus.includes("pagamento") ||
      rawStatus.includes("fatur") ||
      rawStatus.includes("hold") ||
      rawStatus.includes("risk") ||
      rawStatus.includes("erro") ||
      rawStatus.includes("error") ||
      rawStatus.includes("issue_payment") ||
      rawStatus.includes("issue_billing");
    const hasIssues = rawStatus.includes("with issues");
    const isPaused =
      rawStatus.includes("pause") ||
      rawStatus.includes("inactive") ||
      rawStatus.includes("stopped") ||
      hasPaymentError ||
      hasIssues;
    const isDelivering =
      !isPaused &&
      (rawStatus.includes("active") ||
        rawStatus.includes("delivery") ||
        rawStatus.includes("delivering") ||
        rawStatus.includes("eligible") ||
        rawStatus.includes("running"));

    // 0) Erro de pagamento
    if (hasPaymentError) {
      addAlert({
        severity: "HIGH",
        status: "NEW",
        clientId: primaryClient,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Erro de pagamento",
        message: "Campanha com erro de pagamento. Verifique o faturamento na Meta.",
        payload: { status: campaign.status, effectiveStatus: campaign.effectiveStatus },
      });
    }

    // 1) Pico/quebra de gasto (apenas se não estiver pausada/erro)
    if (isDelivering && avg7 > 0 && yesterdaySpend > avg7 * 2 && yesterdaySpend > 2000) {
      addAlert({
        severity: "HIGH",
        status: "NEW",
        clientId: primaryClient,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Gasto acima do normal",
        message: `Gasto de ontem R$ ${(yesterdaySpend / 100).toFixed(2)} está >2x a média dos últimos 7 dias (R$ ${(avg7 / 100).toFixed(2)}).`,
        payload: { yesterdaySpend, avg7 },
      });
    } else if (isDelivering && avg7 > 0 && yesterdaySpend < avg7 * 0.3 && avg7 > 2000) {
      addAlert({
        severity: "MEDIUM",
        status: "NEW",
        clientId: primaryClient,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Gasto abaixo do normal",
        message: `Gasto de ontem R$ ${(yesterdaySpend / 100).toFixed(2)} está bem abaixo da média (R$ ${(avg7 / 100).toFixed(2)}).`,
        payload: { yesterdaySpend, avg7 },
      });
    }

    // 2) Leads/resultados zerados
    if (isDelivering && yesterdaySpend > 0 && yesterdayLeads === 0) {
      addAlert({
        severity: "MEDIUM",
        status: "NEW",
        clientId: primaryClient,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Resultados zerados",
        message: "Campanha ativa sem resultados no último dia.",
        payload: { yesterdaySpend, yesterdayLeads },
      });
    }

    // 4) Budget baixo
    if (config.budgetLowThreshold > 0 && dailyBudget > 0 && dailyBudget < config.budgetLowThreshold) {
      addAlert({
        severity: "LOW",
        status: "NEW",
        clientId: primaryClient,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Orçamento baixo",
        message: `Orçamento diário abaixo do limite configurado (R$ ${(config.budgetLowThreshold / 100).toFixed(2)}).`,
        payload: { dailyBudget },
      });
    }

    // 5) (removido) alerta de campanha pausada — não mais necessário
  }

  // 6) Integração desatualizada
  if (integration?.lastSyncAt) {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
    if (integration.lastSyncAt < twelveHoursAgo) {
      addAlert({
        severity: "MEDIUM",
        status: "NEW",
        clientId: null,
        adAccountId: null,
        campaignId: null,
        title: "Sincronização desatualizada",
        message: "A integração com a Meta não sincroniza há mais de 12h.",
        payload: { lastSyncAt: integration.lastSyncAt },
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.alert.deleteMany({});

    if (alerts.length > 0) {
      await tx.alert.createMany({
        data: alerts.map((a) => ({
          ...a,
          type: "BUDGET_LOW", // enum limitado, reutilizado para todos os alertas
        })),
      });
    }
  });

  return NextResponse.json({ created: alerts.length });
}
