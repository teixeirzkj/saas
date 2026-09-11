import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { CustomerDetail } from './customer-detail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ctx = await requireBusiness();
  const customer = await db.customer.findFirst({
    where: { id, businessId: ctx.business.id },
    select: { name: true },
  });
  return { title: customer?.name ?? 'Cliente' };
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();

  // O filtro por businessId é o que impede acessar cliente de outra empresa pela URL
  const customer = await db.customer.findFirst({
    where: { id, businessId: business.id },
    include: {
      quotes: { orderBy: { createdAt: 'desc' }, take: 20 },
      orders: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } },
      appointments: {
        orderBy: { startsAt: 'desc' },
        take: 20,
        include: { service: { select: { name: true } } },
      },
      deals: { orderBy: { updatedAt: 'desc' } },
      tasks: { orderBy: [{ done: 'asc' }, { dueAt: 'asc' }] },
      notesList: { orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } },
    },
  });

  if (!customer) notFound();

  return (
    <CustomerDetail
      businessName={business.name}
      customer={{
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        company: customer.company,
        document: customer.document,
        address: customer.address,
        notes: customer.notes,
        source: customer.source,
        status: customer.status,
        totalValue: customer.totalValue,
        createdAt: customer.createdAt,
        lastActivityAt: customer.lastActivityAt,
      }}
      quotes={customer.quotes.map((q) => ({
        id: q.id,
        number: q.number,
        title: q.title,
        status: q.status,
        total: q.total,
        createdAt: q.createdAt,
      }))}
      orders={customer.orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemCount: o.items.length,
      }))}
      appointments={customer.appointments.map((a) => ({
        id: a.id,
        title: a.title,
        serviceName: a.service?.name ?? null,
        startsAt: a.startsAt,
        status: a.status,
      }))}
      deals={customer.deals.map((d) => ({ id: d.id, title: d.title, stage: d.stage, value: d.value }))}
      tasks={customer.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        done: t.done,
        dueAt: t.dueAt,
        priority: t.priority,
      }))}
      notes={customer.notesList.map((n) => ({
        id: n.id,
        content: n.content,
        createdAt: n.createdAt,
        authorName: n.user?.name ?? null,
      }))}
    />
  );
}
