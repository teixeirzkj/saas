import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { CrmBoard } from './crm-board';

export const metadata: Metadata = { title: 'CRM' };

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string; cliente?: string; negociacao?: string }>;
}) {
  const { business } = await requireBusiness();
  const { novo, cliente, negociacao } = await searchParams;

  const [deals, customers] = await Promise.all([
    db.deal.findMany({
      where: { businessId: business.id },
      orderBy: [{ stage: 'asc' }, { order: 'asc' }],
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        tasks: { orderBy: [{ done: 'asc' }, { dueAt: 'asc' }] },
        notesList: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
      },
    }),
    db.customer.findMany({
      where: { businessId: business.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, phone: true },
    }),
  ]);

  return (
    <CrmBoard
      businessName={business.name}
      customers={customers}
      openNew={novo === '1'}
      presetCustomerId={cliente}
      openDealId={negociacao}
      deals={deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        value: deal.value,
        probability: deal.probability,
        source: deal.source,
        notes: deal.notes,
        lastInteractionAt: deal.lastInteractionAt,
        customer: deal.customer,
        tasks: deal.tasks.map((t) => ({ id: t.id, title: t.title, done: t.done, dueAt: t.dueAt })),
        notesList: deal.notesList.map((n) => ({
          id: n.id,
          content: n.content,
          createdAt: n.createdAt,
          authorName: n.user?.name ?? null,
        })),
      }))}
    />
  );
}
