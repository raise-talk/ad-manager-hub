import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const clients = await prisma.client.findMany({
    where: {
      status: status ? status.toUpperCase() as "ACTIVE" | "PAUSED" | "ARCHIVED" : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const client = await prisma.client.create({
    data: parsed.data,
  });

  return NextResponse.json(client, { status: 201 });
}
