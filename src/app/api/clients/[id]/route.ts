import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/require-auth";

const normalizeBigInt = (value: bigint | null | undefined) =>
  typeof value === "bigint" ? Number(value) : value;

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
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }

  const normalizedClient = {
    ...client,
    dueDay: client.dueDay,
    lastPaymentAt: client.lastPaymentAt,
    adAccounts:
      client.adAccounts?.map((item) => ({
        ...item,
        adAccount: item.adAccount
          ? {
              ...item.adAccount,
              spendCap: normalizeBigInt(item.adAccount.spendCap),
            }
          : null,
      })) ?? [],
  };

  return NextResponse.json(normalizedClient);
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
