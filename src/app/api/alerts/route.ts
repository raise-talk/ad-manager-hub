import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const clientId = searchParams.get("clientId") ?? undefined;

  const alerts = await prisma.alert.findMany({
    where: {
      status: status ? (status.toUpperCase() as "NEW" | "READ" | "RESOLVED") : undefined,
      type: type ? (type.toUpperCase() as "BUDGET_LOW") : undefined,
      clientId: clientId ?? undefined,
    },
    include: {
      client: true,
      adAccount: true,
      campaign: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}
