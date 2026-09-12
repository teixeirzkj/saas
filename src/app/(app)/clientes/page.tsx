import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { CustomersView } from './customers-view';

export const metadata: Metadata = { title: 'Clientes' };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; novo?: string }>;
}) {
  const { business, plan } = await requireBusiness();
  const { q, status, novo } = await searchParams;

  const where = {
    businessId: business.id,
    ...(status && status !== 'todos' ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { company: { contains: q } },
          ],
        }
      : {}),
  };

  const [customers, counts, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
      take: 200,
      include: {
        _count: { select: { quotes: true, orders: true, appointments: true } },
      },
    }),
    db.customer.groupBy({ by: ['status'], where: { businessId: business.id }, _count: true }),
    db.customer.count({ where: { businessId: business.id } }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;

  return (
    <CustomersView
      customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        company: c.company,
        status: c.status,
        source: c.source,
        totalValue: c.totalValue,
        lastActivityAt: c.lastActivityAt,
        counts: c._count,
      }))}
      total={total}
      statusCounts={statusCounts}
      query={q ?? ''}
      status={status ?? 'todos'}
      openNew={novo === '1'}
      limit={plan.limits.maxCustomers}
      planName={plan.name}
      planCode={plan.code}
      businessName={business.name}
    />
  );
}
