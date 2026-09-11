'use server';

import { revalidatePath } from 'next/cache';

import { logActivity, requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateTimeFromParts, str } from '@/lib/utils';
import { fieldErrors, taskSchema } from '@/lib/validation';

export type FormState = { ok?: boolean; error?: string; errors?: Record<string, string>; id?: string };

// ------------------------------------------------------------------ notificações

export async function markAllNotificationsRead() {
  const { business } = await requireBusiness();
  await db.notification.updateMany({ where: { businessId: business.id, read: false }, data: { read: true } });
  revalidatePath('/', 'layout');
}

export async function markNotificationRead(id: string) {
  const { business } = await requireBusiness();
  // updateMany com businessId garante que ninguém marca notificação de outra empresa
  await db.notification.updateMany({ where: { id, businessId: business.id }, data: { read: true } });
  revalidatePath('/', 'layout');
}

// ------------------------------------------------------------------ tarefas

export async function createTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business, user } = await requireBusiness();

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    dueAt: formData.get('dueAt'),
    priority: formData.get('priority') || 'media',
    customerId: formData.get('customerId'),
    dealId: formData.get('dealId'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  // Valida que os vínculos pertencem à mesma empresa
  if (parsed.data.customerId) {
    const owns = await db.customer.count({ where: { id: parsed.data.customerId, businessId: business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }
  if (parsed.data.dealId) {
    const owns = await db.deal.count({ where: { id: parsed.data.dealId, businessId: business.id } });
    if (!owns) return { error: 'Negociação não encontrada.' };
  }

  const task = await db.task.create({
    data: {
      businessId: business.id,
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      dueAt: parsed.data.dueAt ? dateTimeFromParts(parsed.data.dueAt, '17:00') : null,
      customerId: parsed.data.customerId,
      dealId: parsed.data.dealId,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/crm');
  if (parsed.data.customerId) revalidatePath(`/clientes/${parsed.data.customerId}`);

  return { ok: true, id: task.id };
}

export async function toggleTask(id: string) {
  const { business } = await requireBusiness();

  const task = await db.task.findFirst({ where: { id, businessId: business.id } });
  if (!task) return { error: 'Tarefa não encontrada.' };

  await db.task.update({
    where: { id },
    data: { done: !task.done, doneAt: task.done ? null : new Date() },
  });

  revalidatePath('/dashboard');
  revalidatePath('/crm');
  if (task.customerId) revalidatePath(`/clientes/${task.customerId}`);
  return { ok: true };
}

export async function deleteTask(id: string) {
  const { business } = await requireBusiness();
  await db.task.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath('/dashboard');
  revalidatePath('/crm');
  return { ok: true };
}

// ------------------------------------------------------------------ notas

export async function createNote(formData: FormData): Promise<FormState> {
  const { business, user } = await requireBusiness();

  const content = str(formData.get('content'));
  if (!content) return { error: 'Escreva algo antes de salvar.' };

  const customerId = str(formData.get('customerId'));
  const dealId = str(formData.get('dealId'));

  if (customerId) {
    const owns = await db.customer.count({ where: { id: customerId, businessId: business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }
  if (dealId) {
    const owns = await db.deal.count({ where: { id: dealId, businessId: business.id } });
    if (!owns) return { error: 'Negociação não encontrada.' };
  }

  await db.note.create({
    data: { businessId: business.id, userId: user.id, content, customerId, dealId },
  });

  if (customerId) revalidatePath(`/clientes/${customerId}`);
  revalidatePath('/crm');
  return { ok: true };
}

export async function deleteNote(id: string) {
  const { business } = await requireBusiness();
  const note = await db.note.findFirst({ where: { id, businessId: business.id } });
  if (!note) return { error: 'Nota não encontrada.' };

  await db.note.delete({ where: { id } });
  if (note.customerId) revalidatePath(`/clientes/${note.customerId}`);
  revalidatePath('/crm');
  return { ok: true };
}

// ------------------------------------------------------------------ atividades

export async function recordActivity(input: { type: string; title: string; description?: string }) {
  const { business } = await requireBusiness();
  await logActivity(business.id, input);
  revalidatePath('/dashboard');
}
