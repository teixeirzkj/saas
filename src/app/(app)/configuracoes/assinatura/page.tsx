import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { SubscriptionView } from './subscription-view';

export const metadata: Metadata = { title: 'Assinatura' };

export default async function SubscriptionPage() {
  const { business, plan, subscription } = await requireBusiness();

  const payments = subscription
    ? await db.payment.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        take: 12,
      })
    : [];

  return (
    <SubscriptionView
      planCode={plan.code}
      planName={plan.name}
      priceCents={
        plan.code === 'free' ? 0 : plan.code === 'pro' ? 3990 : 7990
      }
      status={subscription?.status ?? 'active'}
      currentPeriodEnd={subscription?.currentPeriodEnd ?? null}
      cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
      limits={plan.limits}
      payments={payments.map((p) => ({
        id: p.id,
        amountCents: p.amountCents,
        status: p.status,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      }))}
    />
  );
}
