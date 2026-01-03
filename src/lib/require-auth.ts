import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const requireAuth = async () => {
  const session = await getSession();
  if (!session?.user?.id) {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
};
