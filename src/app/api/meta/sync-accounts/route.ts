import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { fetchAdAccounts, getStoredAccessToken } from "@/server/meta";

export async function POST() {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  if (!integration || integration.status !== "CONNECTED") {
    return NextResponse.json({ error: "Integração Meta não conectada." }, { status: 400 });
  }

  const accessToken = getStoredAccessToken(integration.accessTokenEncrypted);
  const { data } = await fetchAdAccounts(accessToken);

  await Promise.all(
    data.map((account) =>
      prisma.adAccount.upsert({
        where: { id: account.id },
        update: {
          name: account.name,
          currency: account.currency,
          timezone: account.timezone_name,
          status: String(account.account_status),
          spendCap: account.spend_cap ? BigInt(account.spend_cap) : undefined,
        },
        create: {
          id: account.id,
          name: account.name,
          currency: account.currency,
          timezone: account.timezone_name,
          status: String(account.account_status),
          spendCap: account.spend_cap ? BigInt(account.spend_cap) : undefined,
        },
      }),
    ),
  );

  await prisma.metaIntegration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ synced: data.length });
}
