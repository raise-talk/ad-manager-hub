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

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
  });

  const mrr = clients.reduce((sum, client) => sum + client.monthlyFee, 0);
  const clientesAtivos = clients.length;
  const ticketMedio = clientesAtivos > 0 ? Math.round(mrr / clientesAtivos) : 0;

  const goal = await prisma.goal.findUnique({
    where: {
      month_year_userId: {
        month,
        year,
        userId: session?.user.id ?? "",
      },
    },
  });

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
