import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const normalizeBigInt = (value: bigint | null | undefined) =>
  typeof value === "bigint" ? Number(value) : value;

export async function GET() {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const adAccounts = await prisma.adAccount.findMany({
    orderBy: { name: "asc" },
  });

  const normalizedAccounts = adAccounts.map((account) => ({
    ...account,
    spendCap: normalizeBigInt(account.spendCap),
  }));

  return NextResponse.json(normalizedAccounts);
}
