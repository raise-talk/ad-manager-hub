import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const adAccounts = await prisma.adAccount.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(adAccounts);
}
