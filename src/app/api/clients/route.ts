import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const clients = await prisma.client.findMany({
    where: {
      status: status ? status.toUpperCase() as "ACTIVE" | "PAUSED" | "ARCHIVED" : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        where: { paidAt: { gte: monthStart, lte: monthEnd } },
        orderBy: { paidAt: "desc" },
        select: { id: true, paidAt: true },
      },
    },
  });

  const enriched = clients.map(({ payments, ...client }) => ({
    ...client,
    lastPaymentAt: payments[0]?.paidAt ?? client.lastPaymentAt,
    paidThisMonth: payments.length > 0,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const client = await prisma.client.create({
    data: parsed.data,
  });

  return NextResponse.json(client, { status: 201 });
}
