import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(searchParams.get("year")) || new Date().getFullYear();

  const goal = await prisma.goal.findUnique({
    where: {
      month_year_userId: {
        month,
        year,
        userId: session?.user.id ?? "",
      },
    },
  });

  return NextResponse.json(goal);
}

export async function POST(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const goal = await prisma.goal.upsert({
    where: {
      month_year_userId: {
        month: parsed.data.month,
        year: parsed.data.year,
        userId: session?.user.id ?? "",
      },
    },
    update: {
      targetClients: parsed.data.targetClients,
      targetRevenue: parsed.data.targetRevenue,
    },
    create: {
      ...parsed.data,
      userId: session?.user.id ?? "",
    },
  });

  return NextResponse.json(goal);
}
