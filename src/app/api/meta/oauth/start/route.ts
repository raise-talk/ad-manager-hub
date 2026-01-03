import { NextResponse } from "next/server";
import crypto from "crypto";
import { getOAuthUrl } from "@/server/meta";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const state = crypto.randomUUID();
  const oauthUrl = getOAuthUrl(state);

  const redirectResponse = NextResponse.redirect(oauthUrl);
  redirectResponse.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return redirectResponse;
}
