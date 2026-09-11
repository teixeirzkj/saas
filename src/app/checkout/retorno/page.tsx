import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { brlCents } from '@/lib/utils';

import { ReturnView } from './return-view';

export const metadata: Metadata = { title: 'Assinatura confirmada' };

export default async function CheckoutReturnPage({
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

  return (
    <ReturnView
      success={payment.status === 'paid'}
      planName={payment.subscription.plan.name}
      amountLabel={brlCents(payment.amountCents)}
    />
  );
}
