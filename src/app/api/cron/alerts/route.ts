import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const verifyCron = (request: Request) => {
  const secret = request.headers.get("x-cron-secret");
  return secret && secret === process.env.CRON_SECRET;
};

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.alertConfig.findFirst();
  if (!config || !config.enabled) {
    return NextResponse.json({ created: 0 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      dailyBudget: { not: null },
    },
    include: {
      adAccount: {
        include: { clients: { include: { client: true } } },
      },
    },
  });

  let created = 0;

  for (const campaign of campaigns) {
    if (!campaign.dailyBudget) continue;
    const budgetCents = Number(campaign.dailyBudget);
    if (budgetCents >= config.budgetLowThreshold) continue;

    const existing = await prisma.alert.findFirst({
      where: {
        type: "BUDGET_LOW",
        campaignId: campaign.id,
        status: { in: ["NEW", "READ"] },
      },
    });

    if (existing) continue;

    const primaryClient = campaign.adAccount.clients.find((item) => item.isPrimary)?.client;

    await prisma.alert.create({
      data: {
        type: "BUDGET_LOW",
        severity: "LOW",
        status: "NEW",
        clientId: primaryClient?.id ?? null,
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        title: "Orçamento diário baixo",
        message: `A campanha ${campaign.name} está com orçamento diário abaixo do limite configurado.`,
        payload: {
          dailyBudget: budgetCents,
          threshold: config.budgetLowThreshold,
        },
      },
    });
    created += 1;
  }

  return NextResponse.json({ created });
}
