'use server';

import { revalidatePath } from 'next/cache';

import { logActivity, requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { money, str, toInt } from '@/lib/utils';
import { dealSchema, fieldErrors } from '@/lib/validation';

import type { FormState } from '../actions';

export async function createDeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();

  const parsed = dealSchema.safeParse({
    title: formData.get('title'),
    customerId: formData.get('customerId'),
    stage: formData.get('stage') || 'novo_lead',
    value: money(formData.get('value')),
    probability: toInt(formData.get('probability'), 50),
    source: formData.get('source'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.customerId) {
    const owns = await db.customer.count({ where: { id: parsed.data.customerId, businessId: business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }

  const count = await db.deal.count({ where: { businessId: business.id, stage: parsed.data.stage } });

  const deal = await db.deal.create({
    data: {
      businessId: business.id,
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      stage: parsed.data.stage,
      value: parsed.data.value,
      probability: parsed.data.probability,
      source: parsed.data.source,
      notes: parsed.data.notes,
      order: count,
      lastInteractionAt: new Date(),
    },
  });

  revalidatePath('/crm');
  revalidatePath('/dashboard');
  return { ok: true, id: deal.id };
}

export async function updateDeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const existing = await db.deal.findFirst({ where: { id, businessId: business.id } });
  if (!existing) return { error: 'Negociação não encontrada.' };

  const parsed = dealSchema.safeParse({
    title: formData.get('title'),
    customerId: formData.get('customerId'),
    stage: formData.get('stage') || existing.stage,
    value: money(formData.get('value')),
    probability: toInt(formData.get('probability'), 50),
    source: formData.get('source'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.deal.update({
    where: { id },
    data: {
      customerId: parsed.data.customerId,
      title: parsed.data.title,
      value: parsed.data.value,
      probability: parsed.data.probability,
      source: parsed.data.source,
      notes: parsed.data.notes,
      lastInteractionAt: new Date(),
    },
  });

  revalidatePath('/crm');
  return { ok: true, id };
}

export async function moveDeal(
  id: string,
  stage: 'novo_lead' | 'contato' | 'negociacao' | 'proposta' | 'vendido' | 'pos_venda',
): Promise<FormState> {
  const { business } = await requireBusiness();

  const deal = await db.deal.findFirst({ where: { id, businessId: business.id } });
  if (!deal) return { error: 'Negociação não encontrada.' };

  const count = await db.deal.count({ where: { businessId: business.id, stage } });

  await db.deal.update({
    where: { id },
    data: {
      stage,
      order: count,
      lastInteractionAt: new Date(),
      closedAt: stage === 'vendido' || stage === 'pos_venda' ? new Date() : null,
    },
  });

  if (stage === 'vendido' && deal.stage !== 'vendido') {
    await logActivity(business.id, {
      type: 'deal.moved',
      title: 'Negociação vendida',
      description: deal.title,
      entityType: 'deal',
      entityId: id,
    });
  }

  revalidatePath('/crm');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const exists = await db.deal.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Negociação não encontrada.' };

  await db.deal.delete({ where: { id } });
  revalidatePath('/crm');
  return { ok: true };
}
