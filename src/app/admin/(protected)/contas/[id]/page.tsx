import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { db } from '@/lib/db';

import { AccountDetail } from './account-detail';

export const metadata: Metadata = { title: 'Admin · Conta', robots: { index: false, follow: false } };

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const business = await db.business.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true, payments: { orderBy: { createdAt: 'desc' }, take: 10 } } },
      users: { orderBy: { createdAt: 'asc' } },
      _count: { select: { customers: true, quotes: true, orders: true, appointments: true } },
    },
  });

  if (!business) notFound();

  return (
    <AccountDetail
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        segment: business.segment,
        email: business.email,
        phone: business.phone,
        whatsapp: business.whatsapp,
        blocked: business.blocked,
        blockedReason: business.blockedReason,
        blockedAt: business.blockedAt,
        adminNotes: business.adminNotes,
        createdAt: business.createdAt,
        counts: business._count,
      }}
      users={business.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      }))}
      subscription={
        business.subscription
          ? {
              planCode: business.subscription.plan.code,
              status: business.subscription.status,
              currentPeriodEnd: business.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: business.subscription.cancelAtPeriodEnd,
            }
          : null
      }
      payments={
        business.subscription?.payments.map((p) => ({
          id: p.id,
          amountCents: p.amountCents,
          status: p.status,
          provider: p.provider,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })) ?? []
      }
    />
  );
}
