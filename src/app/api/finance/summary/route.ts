import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const [activeClients, payments, goal] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, monthlyFee: true },
    }),
    prisma.payment.findMany({
      where: {
        paidAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
    prisma.goal.findUnique({
      where: {
        month_year_userId: {
          month,
          year,
          userId: session?.user.id ?? "",
        },
      },
    }),
  ]);

  const clientesAtivos = activeClients.length;
  const mrr = payments.reduce((sum, p) => sum + p.amount, 0);
  const ticketMedio = clientesAtivos > 0 ? Math.round(mrr / clientesAtivos) : 0;

  const progressClients = goal?.targetClients
    ? Math.min(clientesAtivos / goal.targetClients, 1)
    : 0;
  const progressRevenue = goal?.targetRevenue
    ? Math.min(mrr / goal.targetRevenue, 1)
    : 0;

  return NextResponse.json({
    mrr,
    clientesAtivos,
    ticketMedio,
    goal,
    progressClients,
    progressRevenue,
  });
}
