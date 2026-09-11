'use server';

import { revalidatePath } from 'next/cache';

import { upsertCustomerByPhone } from '@/lib/customers';
import { db } from '@/lib/db';
import { addMinutes, dateTimeFromParts, formatDateTime, timeToMinutes } from '@/lib/utils';
import { fieldErrors, publicBookingSchema } from '@/lib/validation';

export type BookingResult = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  appointment?: { id: string; startsAt: string; serviceName: string };
};

/**
 * Agendamento feito pelo cliente final na página pública.
 * O businessId é resolvido pelo slug no servidor — nunca vem do formulário.
 */
export async function createPublicBooking(formData: FormData): Promise<BookingResult> {
  const parsed = publicBookingSchema.safeParse({
    slug: formData.get('slug'),
    serviceId: formData.get('serviceId'),
    date: formData.get('date'),
    time: formData.get('time'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const business = await db.business.findUnique({ where: { slug: parsed.data.slug } });
  if (!business || !business.bookingEnabled) return { error: 'Esta página de agendamento não está disponível.' };

  const service = await db.service.findFirst({
    where: { id: parsed.data.serviceId, businessId: business.id, active: true },
  });
  if (!service) return { error: 'Serviço indisponível. Escolha outro.' };

  const startsAt = dateTimeFromParts(parsed.data.date, parsed.data.time);
  const endsAt = addMinutes(startsAt, service.durationMin);

  if (startsAt.getTime() < Date.now()) {
    return { error: 'Esse horário já passou. Escolha um horário futuro.' };
  }

  // Respeita a janela de trabalho configurada pela empresa
  const workdays = safeParse<number[]>(business.workdays, [1, 2, 3, 4, 5]);
  if (!workdays.includes(startsAt.getDay())) {
    return { error: 'Não atendemos nesse dia da semana. Escolha outra data.' };
  }

  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();
  if (
    startMinutes < timeToMinutes(business.workdayStart) ||
    endMinutes > timeToMinutes(business.workdayEnd)
  ) {
    return { error: 'Esse horário está fora do nosso atendimento. Escolha outro.' };
  }

  // Revalida o conflito no servidor (o cliente pode ter a lista desatualizada)
  const conflict = await db.appointment.findFirst({
    where: {
      businessId: business.id,
      status: { notIn: ['cancelado'] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });

  if (conflict) return { error: 'Esse horário acabou de ser ocupado. Escolha outro, por favor.' };

  const customer = await upsertCustomerByPhone(business.id, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    source: 'site',
  });

  const appointment = await db.appointment.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      serviceId: service.id,
      title: `${service.name} - ${parsed.data.name.split(' ')[0]}`,
      startsAt,
      endsAt,
      status: 'agendado',
      notes: parsed.data.notes,
      guestName: parsed.data.name,
      guestPhone: parsed.data.phone,
      source: 'publico',
    },
  });

  await db.activity.create({
    data: {
      businessId: business.id,
      type: 'appointment.created',
      title: 'Agendamento pela página pública',
      description: `${parsed.data.name} · ${service.name} · ${formatDateTime(startsAt)}`,
      entityType: 'appointment',
      entityId: appointment.id,
    },
  });

  await db.notification.create({
    data: {
      businessId: business.id,
      title: 'Novo agendamento recebido',
      body: `${parsed.data.name} marcou ${service.name} para ${formatDateTime(startsAt)}.`,
      type: 'appointment',
      href: '/agenda',
    },
  });

  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  revalidatePath(`/agendar/${parsed.data.slug}`);

  return {
    ok: true,
    appointment: {
      id: appointment.id,
      startsAt: startsAt.toISOString(),
      serviceName: service.name,
    },
  };
}

function safeParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
