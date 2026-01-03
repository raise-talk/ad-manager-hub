import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@example.com",
      passwordHash,
      timezone: "America/Sao_Paulo",
      currency: "BRL",
      alertConfig: {
        create: {
          budgetLowThreshold: 5000,
          enabled: true,
        },
      },
    },
  });

  const clientOne = await prisma.client.create({
    data: {
      type: "BROKER",
      name: "Imobiliária Horizonte",
      city: "São Paulo",
      state: "SP",
      whatsapp: "+55 11 98888-0000",
      instagram: "@horizonteimoveis",
      website: "https://horizonteimoveis.com.br",
      monthlyFee: 350000,
      status: "ACTIVE",
      notes: "Cliente com foco em lançamentos.",
    },
  });

  const clientTwo = await prisma.client.create({
    data: {
      type: "REAL_ESTATE",
      name: "Corretora Vila Nova",
      city: "Campinas",
      state: "SP",
      whatsapp: "+55 19 97777-0000",
      instagram: "@vilanovaimoveis",
      website: "https://vilanovaimoveis.com.br",
      monthlyFee: 220000,
      status: "ACTIVE",
      notes: "Operação de médio porte.",
    },
  });

  const adAccountOne = await prisma.adAccount.create({
    data: {
      id: "act_1001",
      name: "Conta Imobiliária Horizonte",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      spendCap: BigInt(15000000),
    },
  });

  const adAccountTwo = await prisma.adAccount.create({
    data: {
      id: "act_1002",
      name: "Conta Vila Nova",
      currency: "BRL",
      timezone: "America/Sao_Paulo",
      status: "ACTIVE",
      spendCap: BigInt(9000000),
    },
  });

  await prisma.clientAdAccount.createMany({
    data: [
      {
        clientId: clientOne.id,
        adAccountId: adAccountOne.id,
        isPrimary: true,
      },
      {
        clientId: clientTwo.id,
        adAccountId: adAccountTwo.id,
        isPrimary: true,
      },
    ],
  });

  const campaignOne = await prisma.campaign.create({
    data: {
      id: "cmp_2001",
      adAccountId: adAccountOne.id,
      name: "Lançamento Jardim",
      objective: "LEAD_GENERATION",
      status: "ACTIVE",
      effectiveStatus: "ACTIVE",
      dailyBudget: BigInt(200000),
      lifetimeBudget: BigInt(10000000),
      updatedTime: new Date(),
    },
  });

  await prisma.campaign.create({
    data: {
      id: "cmp_2002",
      adAccountId: adAccountTwo.id,
      name: "Feirão Vila Nova",
      objective: "CONVERSIONS",
      status: "ACTIVE",
      effectiveStatus: "ACTIVE",
      dailyBudget: BigInt(120000),
      lifetimeBudget: BigInt(6500000),
      updatedTime: new Date(),
    },
  });

  const today = new Date();
  const snapshots = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return {
      scopeType: "AD_ACCOUNT" as const,
      scopeId: adAccountOne.id,
      date,
      spend: 45000 + index * 1200,
      impressions: 12000 + index * 250,
      clicks: 640 + index * 20,
      leads: 32 + index * 2,
      cpl: 1400 + index * 30,
      source: "META" as const,
    };
  });

  await prisma.metricSnapshot.createMany({ data: snapshots });

  await prisma.metricSnapshot.create({
    data: {
      scopeType: "CAMPAIGN",
      scopeId: campaignOne.id,
      date: today,
      spend: 18000,
      impressions: 5200,
      clicks: 280,
      leads: 14,
      cpl: 1285,
      source: "META",
    },
  });

  await prisma.goal.create({
    data: {
      userId: admin.id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      targetClients: 12,
      targetRevenue: 1200000,
    },
  });

  await prisma.alert.create({
    data: {
      type: "BUDGET_LOW",
      severity: "MEDIUM",
      status: "NEW",
      clientId: clientOne.id,
      adAccountId: adAccountOne.id,
      campaignId: campaignOne.id,
      title: "Orçamento diário baixo",
      message: "A campanha Lançamento Jardim está próxima do limite diário.",
      payload: {
        dailyBudget: 200000,
        spendToday: 185000,
      },
    },
  });
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
