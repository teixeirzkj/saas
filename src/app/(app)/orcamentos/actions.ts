'use server';

import { revalidatePath } from 'next/cache';

import { checkLimit, logActivity, notify, requireBusiness } from '@/lib/auth';
import { recalcCustomerValue, nextNumber } from '@/lib/customers';
import { db } from '@/lib/db';
import { addDays, brl, dateTimeFromParts, money, str, toInt } from '@/lib/utils';
import { fieldErrors, quoteSchema } from '@/lib/validation';

import type { FormState } from '../actions';

type ParsedItem = { description: string; quantity: number; unitPrice: number };

/** Lê a lista dinâmica de itens (item-0-description, item-0-quantity, ...). */
function readItems(formData: FormData): ParsedItem[] {
  const items: ParsedItem[] = [];
  const total = toInt(formData.get('itemCount'), 0);

  for (let i = 0; i < total; i++) {
    const description = str(formData.get(`item-${i}-description`));
    if (!description) continue;
    items.push({
      description,
      quantity: money(formData.get(`item-${i}-quantity`)) || 1,
      unitPrice: money(formData.get(`item-${i}-unitPrice`)),
    });
  }

  return items;
}

function computeTotals(items: ParsedItem[], discount: number, discountType: 'value' | 'percent') {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountValue = discountType === 'percent' ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountValue);
  return { subtotal: round2(subtotal), total: round2(total) };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------------ criar

export async function createQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireBusiness();

  const limit = await checkLimit(ctx, 'quotes');
  if (!limit.allowed) return { error: limit.message };

  const items = readItems(formData);

  const parsed = quoteSchema.safeParse({
    customerId: formData.get('customerId'),
    title: str(formData.get('title')) ?? 'Orçamento',
    status: formData.get('status') || 'rascunho',
    discount: money(formData.get('discount')),
    discountType: formData.get('discountType') || 'value',
    notes: formData.get('notes'),
    validUntil: formData.get('validUntil'),
    items,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.customerId) {
    const owns = await db.customer.count({ where: { id: parsed.data.customerId, businessId: ctx.business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }

  const { subtotal, total } = computeTotals(parsed.data.items, parsed.data.discount, parsed.data.discountType);
  const number = await nextNumber(ctx.business.id, 'quote');

  const quote = await db.quote.create({
    data: {
      businessId: ctx.business.id,
      customerId: parsed.data.customerId,
      number,
      title: parsed.data.title,
      status: parsed.data.status,
      discount: parsed.data.discount,
      discountType: parsed.data.discountType,
      subtotal,
      total,
      notes: parsed.data.notes,
      validUntil: parsed.data.validUntil
        ? dateTimeFromParts(parsed.data.validUntil, '23:59')
        : addDays(new Date(), ctx.business.quoteValidDays),
      sentAt: parsed.data.status === 'enviado' ? new Date() : null,
      items: {
        create: parsed.data.items.map((item, order) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: round2(item.quantity * item.unitPrice),
          order,
        })),
      },
    },
  });

  await logActivity(ctx.business.id, {
    type: parsed.data.status === 'enviado' ? 'quote.sent' : 'quote.created',
    title: parsed.data.status === 'enviado' ? 'Orçamento enviado' : 'Orçamento criado',
    description: `#${number} · ${parsed.data.title} · ${brl(total)}`,
    entityType: 'quote',
    entityId: quote.id,
  });

  revalidatePath('/orcamentos');
  revalidatePath('/dashboard');
  return { ok: true, id: quote.id };
}

// ------------------------------------------------------------------ atualizar

export async function updateQuote(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const existing = await db.quote.findFirst({ where: { id, businessId: ctx.business.id } });
  if (!existing) return { error: 'Orçamento não encontrado.' };

  const items = readItems(formData);

  const parsed = quoteSchema.safeParse({
    customerId: formData.get('customerId'),
    title: str(formData.get('title')) ?? 'Orçamento',
    status: formData.get('status') || existing.status,
    discount: money(formData.get('discount')),
    discountType: formData.get('discountType') || 'value',
    notes: formData.get('notes'),
    validUntil: formData.get('validUntil'),
    items,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.customerId) {
    const owns = await db.customer.count({ where: { id: parsed.data.customerId, businessId: ctx.business.id } });
    if (!owns) return { error: 'Cliente não encontrado.' };
  }

  const { subtotal, total } = computeTotals(parsed.data.items, parsed.data.discount, parsed.data.discountType);

  await db.$transaction([
    db.quoteItem.deleteMany({ where: { quoteId: id } }),
    db.quote.update({
      where: { id },
      data: {
        customerId: parsed.data.customerId,
        title: parsed.data.title,
        status: parsed.data.status,
        discount: parsed.data.discount,
        discountType: parsed.data.discountType,
        subtotal,
        total,
        notes: parsed.data.notes,
        validUntil: parsed.data.validUntil ? dateTimeFromParts(parsed.data.validUntil, '23:59') : existing.validUntil,
        sentAt: parsed.data.status !== 'rascunho' && !existing.sentAt ? new Date() : existing.sentAt,
        items: {
          create: parsed.data.items.map((item, order) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: round2(item.quantity * item.unitPrice),
            order,
          })),
        },
      },
    }),
  ]);

  if (parsed.data.customerId) await recalcCustomerValue(ctx.business.id, parsed.data.customerId);

  revalidatePath('/orcamentos');
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath('/dashboard');
  return { ok: true, id };
}

// ------------------------------------------------------------------ status

export async function setQuoteStatus(id: string, status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado') {
  const { business } = await requireBusiness();

  const quote = await db.quote.findFirst({
    where: { id, businessId: business.id },
    include: { customer: { select: { id: true, name: true } } },
  });
  if (!quote) return { error: 'Orçamento não encontrado.' };

  await db.quote.update({
    where: { id },
    data: {
      status,
      sentAt: status !== 'rascunho' && !quote.sentAt ? new Date() : quote.sentAt,
      respondedAt: status === 'aprovado' || status === 'recusado' ? new Date() : null,
    },
  });

  const labels = { rascunho: 'voltou para rascunho', enviado: 'enviado', aprovado: 'aprovado', recusado: 'recusado' };

  await logActivity(business.id, {
    type: `quote.${status}`,
    title: `Orçamento ${labels[status]}`,
    description: `#${quote.number} · ${quote.customer?.name ?? quote.title} · ${brl(quote.total)}`,
    entityType: 'quote',
    entityId: id,
  });

  if (status === 'aprovado') {
    await notify(business.id, {
      title: 'Orçamento aprovado',
      body: `${quote.customer?.name ?? quote.title} aprovou o orçamento #${quote.number}.`,
      type: 'quote',
      href: `/orcamentos/${id}`,
    });
  }

  if (quote.customerId) await recalcCustomerValue(business.id, quote.customerId);

  revalidatePath('/orcamentos');
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath('/dashboard');
  if (quote.customerId) revalidatePath(`/clientes/${quote.customerId}`);

  return { ok: true };
}

/** Marca como enviado no momento em que o usuário dispara o WhatsApp. */
export async function markQuoteSent(id: string) {
  const { business } = await requireBusiness();
  const quote = await db.quote.findFirst({ where: { id, businessId: business.id } });
  if (!quote) return { error: 'Orçamento não encontrado.' };
  if (quote.status !== 'rascunho') return { ok: true };
  return setQuoteStatus(id, 'enviado');
}

export async function deleteQuote(id: string) {
  const { business } = await requireBusiness();

  const quote = await db.quote.findFirst({ where: { id, businessId: business.id } });
  if (!quote) return { error: 'Orçamento não encontrado.' };

  await db.quote.delete({ where: { id } });
  if (quote.customerId) await recalcCustomerValue(business.id, quote.customerId);

  revalidatePath('/orcamentos');
  revalidatePath('/dashboard');
  return { ok: true };
}

/** Duplica um orçamento como novo rascunho. */
export async function duplicateQuote(id: string): Promise<FormState> {
  const ctx = await requireBusiness();

  const limit = await checkLimit(ctx, 'quotes');
  if (!limit.allowed) return { error: limit.message };

  const source = await db.quote.findFirst({
    where: { id, businessId: ctx.business.id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!source) return { error: 'Orçamento não encontrado.' };

  const number = await nextNumber(ctx.business.id, 'quote');

  const copy = await db.quote.create({
    data: {
      businessId: ctx.business.id,
      customerId: source.customerId,
      number,
      title: `${source.title} (cópia)`,
      status: 'rascunho',
      discount: source.discount,
      discountType: source.discountType,
      subtotal: source.subtotal,
      total: source.total,
      notes: source.notes,
      validUntil: addDays(new Date(), ctx.business.quoteValidDays),
      items: {
        create: source.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          order: item.order,
        })),
      },
    },
  });

  revalidatePath('/orcamentos');
  return { ok: true, id: copy.id };
}
