'use server';

import { revalidatePath } from 'next/cache';

import { upsertCustomerByPhone } from '@/lib/customers';
import { db } from '@/lib/db';
import { brl } from '@/lib/utils';
import { fieldErrors, publicOrderSchema } from '@/lib/validation';

export type PublicOrderResult = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  order?: { id: string; number: number; total: number };
};

/**
 * Pedido feito pelo cliente final na página pública do catálogo.
 * O businessId é resolvido pelo slug no servidor — nunca vem do formulário.
 */
export async function createPublicOrder(formData: FormData): Promise<PublicOrderResult> {
  let itemsRaw: unknown;
  try {
    itemsRaw = JSON.parse(String(formData.get('items') ?? '[]'));
  } catch {
    return { error: 'Carrinho inválido. Atualize a página e tente novamente.' };
  }

  const parsed = publicOrderSchema.safeParse({
    slug: formData.get('slug'),
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    deliveryType: formData.get('deliveryType') || 'entrega',
    address: formData.get('address'),
    paymentMethod: formData.get('paymentMethod') || 'pix',
    notes: formData.get('notes'),
    items: itemsRaw,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const business = await db.business.findUnique({ where: { slug: parsed.data.slug } });
  if (!business || !business.catalogEnabled) return { error: 'Este catálogo não está disponível.' };

  if (parsed.data.deliveryType === 'entrega' && !parsed.data.address) {
    return { error: 'Informe o endereço de entrega.' };
  }

  // Revalida cada produto no servidor — nunca confia em preço vindo do cliente
  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, businessId: business.id, available: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    addons: string;
    notes?: string;
  }[] = [];

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product) return { error: 'Um dos produtos do carrinho não está mais disponível.' };

    const basePrice = product.promoPrice ?? product.price;
    const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
    const unitPrice = basePrice + addonsTotal;

    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      total: Math.round(unitPrice * item.quantity * 100) / 100,
      addons: JSON.stringify(item.addons),
      notes: item.notes,
    });
  }

  const subtotal = Math.round(orderItems.reduce((sum, i) => sum + i.total, 0) * 100) / 100;

  if (business.minOrder > 0 && subtotal < business.minOrder) {
    return { error: `O pedido mínimo é de ${brl(business.minOrder)}.` };
  }

  const deliveryFee = parsed.data.deliveryType === 'entrega' ? business.deliveryFee : 0;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const last = await db.order.findFirst({
    where: { businessId: business.id },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  const number = (last?.number ?? 100) + 1;

  const customer = await upsertCustomerByPhone(business.id, {
    name: parsed.data.customerName,
    phone: parsed.data.customerPhone,
    address: parsed.data.address,
    source: 'site',
  });

  const order = await db.order.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      number,
      status: 'novo',
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      address: parsed.data.deliveryType === 'entrega' ? parsed.data.address : null,
      deliveryType: parsed.data.deliveryType,
      paymentMethod: parsed.data.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      notes: parsed.data.notes,
      source: 'publico',
      items: { create: orderItems },
    },
  });

  await db.activity.create({
    data: {
      businessId: business.id,
      type: 'order.created',
      title: 'Novo pedido recebido',
      description: `Pedido #${number} · ${parsed.data.customerName} · ${brl(total)}`,
      entityType: 'order',
      entityId: order.id,
    },
  });

  await db.notification.create({
    data: {
      businessId: business.id,
      title: 'Novo pedido recebido',
      body: `${parsed.data.customerName} fez um pedido de ${brl(total)}.`,
      type: 'order',
      href: '/catalogo/pedidos',
    },
  });

  revalidatePath('/catalogo/pedidos');
  revalidatePath('/dashboard');

  return { ok: true, order: { id: order.id, number, total } };
}
