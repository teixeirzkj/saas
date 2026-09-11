import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { appUrl } from '@/lib/utils';

import { QuotesView } from './quotes-view';

export const metadata: Metadata = { title: 'Orçamentos' };

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { business, plan } = await requireBusiness();
  const { status, q } = await searchParams;

  const where = {
    businessId: business.id,
    ...(status && status !== 'todos' ? { status } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { customer: { name: { contains: q } } }] } : {}),
  };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [quotes, counts, total, monthCount, template] = await Promise.all([
    db.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        _count: { select: { items: true } },
      },
    }),
    db.quote.groupBy({ by: ['status'], where: { businessId: business.id }, _count: true }),
    db.quote.count({ where: { businessId: business.id } }),
    db.quote.count({ where: { businessId: business.id, createdAt: { gte: monthStart } } }),
    db.messageTemplate.findFirst({ where: { businessId: business.id, key: 'quote_send' } }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const approved = quotes.filter((q) => q.status === 'aprovado');
  const approvedValue = approved.reduce((sum, q) => sum + q.total, 0);
  const pendingValue = quotes.filter((q) => q.status === 'enviado').reduce((sum, q) => sum + q.total, 0);

  return (
    <QuotesView
      businessName={business.name}
      appUrl={appUrl()}
      template={template?.body ?? null}
      quotes={quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        title: quote.title,
        status: quote.status,
        total: quote.total,
        createdAt: quote.createdAt,
        validUntil: quote.validUntil,
        publicToken: quote.publicToken,
        itemCount: quote._count.items,
        customer: quote.customer,
      }))}
      statusCounts={statusCounts}
      total={total}
      approvedValue={approvedValue}
      pendingValue={pendingValue}
      status={status ?? 'todos'}
      query={q ?? ''}
      monthCount={monthCount}
      monthLimit={plan.limits.maxQuotes}
      planName={plan.name}
    />
  );
}
