import type { Metadata } from 'next';

import { db } from '@/lib/db';

import { AdminDashboard } from './admin-dashboard';

export const metadata: Metadata = { title: 'Admin · Contas', robots: { index: false, follow: false } };

export default async function AdminHomePage() {
  const businesses = await db.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: { include: { plan: true } },
      users: { where: { role: 'owner' }, take: 1, select: { name: true, email: true, lastLoginAt: true } },
      _count: { select: { customers: true } },
    },
  });

  const now = new Date();
  const totalMrr = businesses.reduce((sum, b) => {
    if (b.blocked || b.subscription?.status !== 'active') return sum;
    return sum + (b.subscription?.plan.priceCents ?? 0);
  }, 0);
  const overdueCount = businesses.filter(
    (b) => !b.blocked && b.subscription && b.subscription.currentPeriodEnd < now && b.subscription.status !== 'canceled',
  ).length;
  const blockedCount = businesses.filter((b) => b.blocked).length;

  return (
    <AdminDashboard
      totalMrr={totalMrr}
      overdueCount={overdueCount}
      blockedCount={blockedCount}
      accounts={businesses.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        segment: b.segment,
        blocked: b.blocked,
        createdAt: b.createdAt,
        owner: b.users[0] ?? null,
        customerCount: b._count.customers,
        plan: b.subscription
          ? {
              code: b.subscription.plan.code,
              name: b.subscription.plan.name,
              priceCents: b.subscription.plan.priceCents,
              status: b.subscription.status,
              currentPeriodEnd: b.subscription.currentPeriodEnd,
            }
          : null,
      }))}
    />
  );
}
