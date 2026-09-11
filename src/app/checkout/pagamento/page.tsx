import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { brlCents } from '@/lib/utils';

import { MockPaymentView } from './mock-payment-view';

export const metadata: Metadata = { title: 'Pagamento' };

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment: paymentId } = await searchParams;
  const { business } = await requireBusiness();

  if (!paymentId) notFound();

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment || payment.subscription.businessId !== business.id) notFound();
  if (payment.status === 'paid') redirect(`/checkout/retorno?payment=${payment.id}`);

  return (
    <MockPaymentView
      paymentId={payment.id}
      planName={payment.subscription.plan.name}
      amountLabel={brlCents(payment.amountCents)}
    />
  );
}
