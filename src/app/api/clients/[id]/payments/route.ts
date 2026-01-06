import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { paymentSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAuth();
  if (response) return response;

  const payments = await prisma.payment.findMany({
    where: { clientId: params.id },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAuth();
  if (response) return response;

  const body = await request.json();
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: {
      clientId: params.id,
      amount: parsed.data.amount,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : new Date(),
    },
  });

  await prisma.client.update({
    where: { id: params.id },
    data: { lastPaymentAt: payment.paidAt },
  });

  return NextResponse.json(payment, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { response } = await requireAuth();
  if (response) return response;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const payment = await prisma.payment.findFirst({
    where: {
      clientId: params.id,
      paidAt: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { paidAt: "desc" },
  });

  if (payment) {
    await prisma.payment.delete({ where: { id: payment.id } });
  }

  // Recalcula o último pagamento para manter o status correto no dashboard
  const lastPayment = await prisma.payment.findFirst({
    where: { clientId: params.id },
    orderBy: { paidAt: "desc" },
  });

  await prisma.client.update({
    where: { id: params.id },
    data: { lastPaymentAt: lastPayment?.paidAt ?? null },
  });

  return NextResponse.json({ ok: true });
}
