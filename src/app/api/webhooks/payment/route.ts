import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { activateSubscription, verifyWebhookSignature } from '@/lib/payments';
import type { PlanCode } from '@/lib/plans';

/**
 * Webhook do gateway de pagamento (InfinitePay ou outro).
 * Nunca confia no corpo antes de validar a assinatura HMAC.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') ?? request.headers.get('x-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  let payload: { order_nsu?: string; status?: string; transaction_id?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const paymentId = payload.order_nsu;
  if (!paymentId) return NextResponse.json({ error: 'order_nsu ausente' }, { status: 400 });

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });

  const approved = ['paid', 'approved', 'success'].includes((payload.status ?? '').toLowerCase());

  if (approved) {
    await activateSubscription({
      businessId: payment.subscription.businessId,
      planCode: payment.subscription.plan.code as PlanCode,
      paymentId: payment.id,
      externalId: payload.transaction_id,
    });
  } else {
    await db.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
  }

  return NextResponse.json({ ok: true });
}
