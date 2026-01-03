import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      adAccounts: {
        include: { adAccount: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const body = await request.json();
  const parsed = clientSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(client);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { response } = await requireAuth();
  if (response) {
    return response;
  }

  const client = await prisma.client.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json(client);
}
