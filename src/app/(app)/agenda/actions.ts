'use server';

import { revalidatePath } from 'next/cache';

import { logActivity, requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { addMinutes, dateTimeFromParts, formatDateTime, money, str, toInt } from '@/lib/utils';
import { appointmentSchema, fieldErrors, serviceSchema } from '@/lib/validation';

import type { FormState } from '../actions';

// ------------------------------------------------------------------ serviços

export async function createService(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();

  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    durationMin: toInt(formData.get('durationMin'), 30),
    price: money(formData.get('price')),
    color: str(formData.get('color')) ?? '#8B2FFF',
    active: formData.get('active') !== 'false',
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const service = await db.service.create({ data: { businessId: business.id, ...parsed.data } });

  revalidatePath('/agenda');
  revalidatePath('/agenda/servicos');
  return { ok: true, id: service.id };
}

export async function updateService(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const exists = await db.service.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Serviço não encontrado.' };

  const parsed = serviceSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    durationMin: toInt(formData.get('durationMin'), 30),
    price: money(formData.get('price')),
    color: str(formData.get('color')) ?? '#8B2FFF',
    active: formData.get('active') !== 'false',
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.service.update({ where: { id }, data: parsed.data });

  revalidatePath('/agenda');
  revalidatePath('/agenda/servicos');
  return { ok: true, id };
}

export async function deleteService(id: string): Promise<FormState> {
  const { business } = await requireBusiness();

  const exists = await db.service.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Serviço não encontrado.' };

  await db.service.delete({ where: { id } });

  revalidatePath('/agenda');
  revalidatePath('/agenda/servicos');
  return { ok: true };
}

export async function toggleServiceActive(id: string): Promise<FormState> {
  const { business } = await requireBusiness();

  const service = await db.service.findFirst({ where: { id, businessId: business.id } });
  if (!service) return { error: 'Serviço não encontrado.' };

  await db.service.update({ where: { id }, data: { active: !service.active } });

  revalidatePath('/agenda');
  revalidatePath('/agenda/servicos');
  return { ok: true };
}

// ------------------------------------------------------------------ compromissos

export async function createAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();

  const parsed = appointmentSchema.safeParse({
    title: formData.get('title'),
    customerId: formData.get('customerId'),
    serviceId: formData.get('serviceId'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMin: toInt(formData.get('durationMin'), 30),
    status: formData.get('status') || 'agendado',
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.customerId) {
    const owns = await db.customer.count({ where: { id: parsed.data.customerId, businessId: business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }

  let duration = parsed.data.durationMin;
  if (parsed.data.serviceId) {
    const service = await db.service.findFirst({
      where: { id: parsed.data.serviceId, businessId: business.id },
    });
    if (!service) return { error: 'Serviço não encontrado.' };
    duration = service.durationMin;
  }

  const startsAt = dateTimeFromParts(parsed.data.date, parsed.data.time);
  const endsAt = addMinutes(startsAt, duration);

  const conflict = await findConflict(business.id, startsAt, endsAt);
  if (conflict) {
    return {
      error: `Já existe "${conflict.title}" nesse horário (${formatDateTime(conflict.startsAt)}). Escolha outro horário.`,
    };
  }

  const appointment = await db.appointment.create({
    data: {
      businessId: business.id,
      customerId: parsed.data.customerId,
      serviceId: parsed.data.serviceId,
      title: parsed.data.title,
      startsAt,
      endsAt,
      status: parsed.data.status,
      notes: parsed.data.notes,
      source: 'interno',
    },
  });

  await logActivity(business.id, {
    type: 'appointment.created',
    title: 'Agendamento realizado',
    description: `${parsed.data.title} · ${formatDateTime(startsAt)}`,
    entityType: 'appointment',
    entityId: appointment.id,
  });

  if (parsed.data.customerId) {
    await db.customer.update({
      where: { id: parsed.data.customerId },
      data: { lastActivityAt: new Date() },
    });
    revalidatePath(`/clientes/${parsed.data.customerId}`);
  }

  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  return { ok: true, id: appointment.id };
}

export async function updateAppointment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const existing = await db.appointment.findFirst({ where: { id, businessId: business.id } });
  if (!existing) return { error: 'Compromisso não encontrado.' };

  const parsed = appointmentSchema.safeParse({
    title: formData.get('title'),
    customerId: formData.get('customerId'),
    serviceId: formData.get('serviceId'),
    date: formData.get('date'),
    time: formData.get('time'),
    durationMin: toInt(formData.get('durationMin'), 30),
    status: formData.get('status') || existing.status,
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  let duration = parsed.data.durationMin;
  if (parsed.data.serviceId) {
    const service = await db.service.findFirst({
      where: { id: parsed.data.serviceId, businessId: business.id },
    });
    if (!service) return { error: 'Serviço não encontrado.' };
    duration = service.durationMin;
  }

  const startsAt = dateTimeFromParts(parsed.data.date, parsed.data.time);
  const endsAt = addMinutes(startsAt, duration);

  const conflict = await findConflict(business.id, startsAt, endsAt, id);
  if (conflict) return { error: `Conflito com "${conflict.title}". Escolha outro horário.` };

  await db.appointment.update({
    where: { id },
    data: {
      customerId: parsed.data.customerId,
      serviceId: parsed.data.serviceId,
      title: parsed.data.title,
      startsAt,
      endsAt,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  return { ok: true, id };
}

export async function setAppointmentStatus(
  id: string,
  status: 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou',
): Promise<FormState> {
  const { business } = await requireBusiness();

  const appointment = await db.appointment.findFirst({ where: { id, businessId: business.id } });
  if (!appointment) return { error: 'Compromisso não encontrado.' };

  await db.appointment.update({ where: { id }, data: { status } });

  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  if (appointment.customerId) revalidatePath(`/clientes/${appointment.customerId}`);
  return { ok: true };
}

export async function deleteAppointment(id: string): Promise<FormState> {
  const { business } = await requireBusiness();

  const exists = await db.appointment.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Compromisso não encontrado.' };

  await db.appointment.delete({ where: { id } });

  revalidatePath('/agenda');
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Marca que o lembrete foi disparado (o envio em si é feito pelo WhatsApp). */
export async function markReminderSent(id: string): Promise<FormState> {
  const { business } = await requireBusiness();
  await db.appointment.updateMany({
    where: { id, businessId: business.id },
    data: { reminderSentAt: new Date() },
  });
  revalidatePath('/agenda');
  return { ok: true };
}

// ------------------------------------------------------------------ util

async function findConflict(businessId: string, startsAt: Date, endsAt: Date, ignoreId?: string) {
  return db.appointment.findFirst({
    where: {
      businessId,
      status: { notIn: ['cancelado'] },
      ...(ignoreId ? { id: { not: ignoreId } } : {}),
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, title: true, startsAt: true },
  });
}
