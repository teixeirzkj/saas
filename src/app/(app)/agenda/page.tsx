import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { appUrl, endOfMonth, isoDate, startOfMonth } from '@/lib/utils';

import { AgendaView } from './agenda-view';

export const metadata: Metadata = { title: 'Agenda' };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; view?: string; novo?: string; cliente?: string }>;
}) {
  const { business } = await requireBusiness();
  const { data, view, novo, cliente } = await searchParams;

  const reference = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(`${data}T12:00:00`) : new Date();

  // Carrega uma janela generosa (mês anterior ao seguinte) para navegar sem recarregar
  const from = startOfMonth(new Date(reference.getFullYear(), reference.getMonth() - 1, 1));
  const to = endOfMonth(new Date(reference.getFullYear(), reference.getMonth() + 1, 1));

  const [appointments, services, customers, template] = await Promise.all([
    db.appointment.findMany({
      where: { businessId: business.id, startsAt: { gte: from, lte: to } },
      orderBy: { startsAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        service: { select: { id: true, name: true, color: true, durationMin: true } },
      },
    }),
    db.service.findMany({ where: { businessId: business.id }, orderBy: { name: 'asc' } }),
    db.customer.findMany({
      where: { businessId: business.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, phone: true },
    }),
    db.messageTemplate.findFirst({ where: { businessId: business.id, key: 'appointment_confirm' } }),
  ]);

  return (
    <AgendaView
      businessName={business.name}
      slug={business.slug}
      appUrl={appUrl()}
      bookingEnabled={business.bookingEnabled}
      template={template?.body ?? null}
      referenceDate={isoDate(reference)}
      initialView={(view as 'dia' | 'semana' | 'mes') ?? 'semana'}
      openNew={novo === '1'}
      presetCustomerId={cliente}
      appointments={appointments.map((a) => ({
        id: a.id,
        title: a.title,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        notes: a.notes,
        source: a.source,
        guestName: a.guestName,
        guestPhone: a.guestPhone,
        reminderSentAt: a.reminderSentAt,
        customer: a.customer,
        service: a.service,
        customerId: a.customerId,
        serviceId: a.serviceId,
      }))}
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMin: s.durationMin,
        price: s.price,
        color: s.color,
        active: s.active,
        description: s.description,
      }))}
      customers={customers}
    />
  );
}
