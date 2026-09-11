'use server';

import { redirect } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { activateSubscription, createCheckoutSession } from '@/lib/payments';
import type { PlanCode } from '@/lib/plans';

/** Inicia o checkout para o plano escolhido. Redireciona para o próximo passo. */
export async function startCheckout(planCode: string) {
  const { business, user } = await requireBusiness();

  const code = (['free', 'pro', 'business'] as const).includes(planCode as PlanCode)
    ? (planCode as PlanCode)
    : 'free';

  const session = await createCheckoutSession({
    businessId: business.id,
    planCode: code,
    customerEmail: user.email,
    customerName: user.name,
  });

  redirect(session.checkoutUrl);
}

/** Sandbox local: simula a aprovação do gateway de pagamento (usado quando PAYMENT_PROVIDER=mock). */
export async function approveMockPayment(paymentId: string) {
  const { business } = await requireBusiness();

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment || payment.subscription.businessId !== business.id) {
    return { error: 'Pagamento não encontrado.' };
  }

  await activateSubscription({
    businessId: business.id,
    planCode: payment.subscription.plan.code as PlanCode,
    paymentId: payment.id,
    externalId: `mock_${payment.id}`,
  });

  redirect(`/checkout/retorno?payment=${payment.id}`);
}
