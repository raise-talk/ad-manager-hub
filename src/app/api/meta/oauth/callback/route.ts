import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchMetaUser,
} from "@/server/meta";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { response, session } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = cookies().get("meta_oauth_state")?.value;
  console.log({ code, state, storedState });
  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/integracoes?status=error", request.url)
    );
  }

  try {
    const shortToken = await exchangeCodeForToken(code);
    const longToken = await exchangeForLongLivedToken(shortToken.access_token);
    const metaUser = await fetchMetaUser(longToken.access_token);

    const expiresIn = Number(longToken.expires_in);
    const tokenExpiresAt = Number.isFinite(expiresIn)
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    await prisma.metaIntegration.upsert({
      where: { userId: session?.user.id ?? "" },
      update: {
        accessTokenEncrypted: encrypt(longToken.access_token),
        tokenExpiresAt: tokenExpiresAt ?? undefined,
        scopes: "ads_read,business_management,read_insights",
        status: "CONNECTED",
        connectedAt: new Date(),
        metaUserId: metaUser.id,
        metaUserName: metaUser.name,
      },
      create: {
        userId: session?.user.id ?? "",
        accessTokenEncrypted: encrypt(longToken.access_token),
        tokenExpiresAt: tokenExpiresAt ?? undefined,
        scopes: "ads_read,business_management,read_insights",
        status: "CONNECTED",
        connectedAt: new Date(),
        metaUserId: metaUser.id,
        metaUserName: metaUser.name,
      },
    });

    const redirectUrl = new URL("/integracoes?status=connected", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.delete("meta_oauth_state");
    return redirectResponse;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/integracoes?status=error", request.url)
    );
  }
}
