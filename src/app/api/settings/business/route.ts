import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id ?? "" },
    select: {
      serviceName: true,
      defaultGoal: true,
    },
  });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const user = await prisma.user.update({
    where: { id: session?.user.id ?? "" },
    data: {
      serviceName: body.serviceName ?? "TrafegoAds",
      defaultGoal: Number(body.defaultGoal ?? 0),
    },
  });

  return NextResponse.json({ serviceName: user.serviceName, defaultGoal: user.defaultGoal });
}
