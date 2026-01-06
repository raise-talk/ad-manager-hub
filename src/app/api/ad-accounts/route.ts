import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const normalizeBigInt = (value: bigint | null | undefined) =>
  typeof value === "bigint" ? Number(value) : value;

const mapStatus = (status: string | null | undefined) => {
  const raw = String(status ?? "").toUpperCase();
  if (raw === "1" || raw.includes("ACTIVE")) return "ACTIVE";
  if (raw.includes("PAUSED") || raw.includes("DISABLED") || raw === "2") return "PAUSED";
  return raw || "UNKNOWN";
};

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
    status: mapStatus(account.status),
    spendCap: normalizeBigInt(account.spendCap),
  }));

  return NextResponse.json(normalizedAccounts);
}
