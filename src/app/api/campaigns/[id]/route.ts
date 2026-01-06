import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { getStoredAccessToken, updateCampaignStatus } from "@/server/meta";

type StatusPayload = { status: "ACTIVE" | "PAUSED" };

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const body = (await request.json()) as Partial<StatusPayload>;
  const nextStatus = body.status;

  if (!nextStatus || !["ACTIVE", "PAUSED"].includes(nextStatus)) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  const integration = await prisma.metaIntegration.findUnique({
    where: { userId: session?.user.id ?? "" },
  });

  if (!integration || integration.status !== "CONNECTED") {
    return NextResponse.json(
      { error: "Integracao Meta nao conectada." },
      { status: 400 },
    );
  }

  try {
    const accessToken = getStoredAccessToken(integration.accessTokenEncrypted);
    await updateCampaignStatus(accessToken, params.id, nextStatus);

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: nextStatus },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("update campaign failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao atualizar campanha na Meta." },
      { status: 500 },
    );
  }
}
