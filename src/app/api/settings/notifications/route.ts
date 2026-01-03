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
      notifyAlerts: true,
      notifyReports: true,
      notifyMarketing: true,
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
      notifyAlerts: Boolean(body.notifyAlerts),
      notifyReports: Boolean(body.notifyReports),
      notifyMarketing: Boolean(body.notifyMarketing),
    },
  });

  return NextResponse.json({
    notifyAlerts: user.notifyAlerts,
    notifyReports: user.notifyReports,
    notifyMarketing: user.notifyMarketing,
  });
}
