'use server';

import { revalidatePath } from 'next/cache';

import { checkLimit, logActivity, requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { customerSchema, fieldErrors } from '@/lib/validation';

import type { FormState } from '../actions';

function readForm(formData: FormData) {
  return {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    company: formData.get('company'),
    document: formData.get('document'),
    address: formData.get('address'),
    notes: formData.get('notes'),
    source: formData.get('source'),
    status: formData.get('status') || 'ativo',
  };
}

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireBusiness();

  const limit = await checkLimit(ctx, 'customers');
  if (!limit.allowed) return { error: limit.message };

  const parsed = customerSchema.safeParse(readForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const customer = await db.customer.create({
    data: { businessId: ctx.business.id, ...parsed.data, lastActivityAt: new Date() },
  });

  await logActivity(ctx.business.id, {
    type: 'customer.created',
    title: 'Novo cliente cadastrado',
    description: parsed.data.source ? `${customer.name} veio de ${parsed.data.source}` : customer.name,
    entityType: 'customer',
    entityId: customer.id,
  });

  revalidatePath('/clientes');
  revalidatePath('/dashboard');
  return { ok: true, id: customer.id };
}

export async function updateCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const existing = await db.customer.findFirst({ where: { id, businessId: business.id } });
  if (!existing) return { error: 'Cliente não encontrado.' };

  const parsed = customerSchema.safeParse(readForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.customer.update({ where: { id }, data: parsed.data });

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${id}`);
  return { ok: true, id };
}

export async function deleteCustomer(id: string): Promise<FormState> {
  const { business } = await requireBusiness();

  const existing = await db.customer.findFirst({ where: { id, businessId: business.id } });
  if (!existing) return { error: 'Cliente não encontrado.' };

  await db.customer.delete({ where: { id } });

  revalidatePath('/clientes');
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Recalcula o valor total do cliente a partir de orçamentos aprovados + pedidos. */
export async function refreshCustomerValue(customerId: string) {
  const { business } = await requireBusiness();

  const owns = await db.customer.count({ where: { id: customerId, businessId: business.id } });
  if (!owns) return;

  const [quotes, orders] = await Promise.all([
    db.quote.aggregate({
      where: { businessId: business.id, customerId, status: 'aprovado' },
      _sum: { total: true },
    }),
    db.order.aggregate({
      where: { businessId: business.id, customerId, status: { notIn: ['cancelado'] } },
      _sum: { total: true },
    }),
  ]);

  await db.customer.update({
    where: { id: customerId },
    data: {
      totalValue: Math.round(((quotes._sum.total ?? 0) + (orders._sum.total ?? 0)) * 100) / 100,
      lastActivityAt: new Date(),
    },
  });
}
