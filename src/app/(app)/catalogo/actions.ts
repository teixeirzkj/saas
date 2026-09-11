'use server';

import { revalidatePath } from 'next/cache';

import { checkLimit, logActivity, requireBusiness } from '@/lib/auth';
import { recalcCustomerValue } from '@/lib/customers';
import { db } from '@/lib/db';
import { saveUploadedImage } from '@/lib/uploads';
import { brl, money, str, toInt } from '@/lib/utils';
import { fieldErrors, productSchema } from '@/lib/validation';

import type { FormState } from '../actions';

// ------------------------------------------------------------------ categorias

export async function createCategory(name: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Informe o nome da categoria.' };

  const count = await db.category.count({ where: { businessId: business.id } });
  const category = await db.category.create({ data: { businessId: business.id, name: trimmed, order: count } });

  revalidatePath('/catalogo');
  return { ok: true, id: category.id };
}

export async function deleteCategory(id: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const exists = await db.category.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Categoria não encontrada.' };

  await db.category.delete({ where: { id } });
  revalidatePath('/catalogo');
  return { ok: true };
}

// ------------------------------------------------------------------ produtos

function readAddons(formData: FormData) {
  const count = toInt(formData.get('addonCount'), 0);
  const addons: { name: string; price: number }[] = [];
  for (let i = 0; i < count; i++) {
    const name = str(formData.get(`addon-${i}-name`));
    if (!name) continue;
    addons.push({ name, price: money(formData.get(`addon-${i}-price`)) });
  }
  return addons;
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireBusiness();

  const limit = await checkLimit(ctx, 'products');
  if (!limit.allowed) return { error: limit.message };

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: money(formData.get('price')),
    promoPrice: formData.get('promoPrice'),
    categoryId: formData.get('categoryId'),
    imageUrl: formData.get('imageUrl'),
    available: formData.get('available') !== 'false',
    featured: formData.get('featured') === 'true',
    addons: readAddons(formData),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.categoryId) {
    const owns = await db.category.count({ where: { id: parsed.data.categoryId, businessId: ctx.business.id } });
    if (!owns) return { error: 'Categoria não encontrada.' };
  }

  const count = await db.product.count({ where: { businessId: ctx.business.id } });

  const product = await db.product.create({
    data: {
      businessId: ctx.business.id,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      promoPrice: parsed.data.promoPrice,
      categoryId: parsed.data.categoryId,
      imageUrl: parsed.data.imageUrl,
      available: parsed.data.available,
      featured: parsed.data.featured,
      order: count,
      addons: JSON.stringify(parsed.data.addons),
    },
  });

  revalidatePath('/catalogo');
  return { ok: true, id: product.id };
}

export async function updateProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();
  const id = String(formData.get('id') ?? '');

  const exists = await db.product.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Produto não encontrado.' };

  const parsed = productSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: money(formData.get('price')),
    promoPrice: formData.get('promoPrice'),
    categoryId: formData.get('categoryId'),
    imageUrl: formData.get('imageUrl'),
    available: formData.get('available') !== 'false',
    featured: formData.get('featured') === 'true',
    addons: readAddons(formData),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      promoPrice: parsed.data.promoPrice,
      categoryId: parsed.data.categoryId,
      imageUrl: parsed.data.imageUrl,
      available: parsed.data.available,
      featured: parsed.data.featured,
      addons: JSON.stringify(parsed.data.addons),
    },
  });

  revalidatePath('/catalogo');
  return { ok: true, id };
}

export async function toggleProductAvailable(id: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const product = await db.product.findFirst({ where: { id, businessId: business.id } });
  if (!product) return { error: 'Produto não encontrado.' };

  await db.product.update({ where: { id }, data: { available: !product.available } });
  revalidatePath('/catalogo');
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<FormState> {
  const { business } = await requireBusiness();
  const exists = await db.product.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Produto não encontrado.' };

  await db.product.delete({ where: { id } });
  revalidatePath('/catalogo');
  return { ok: true };
}

// ------------------------------------------------------------------ pedidos

const ORDER_FLOW_LABELS: Record<string, string> = {
  novo: 'novo',
  confirmado: 'confirmado',
  preparando: 'em preparação',
  pronto: 'pronto',
  concluido: 'concluído',
  cancelado: 'cancelado',
};

export async function setOrderStatus(
  id: string,
  status: 'novo' | 'confirmado' | 'preparando' | 'pronto' | 'concluido' | 'cancelado',
): Promise<FormState> {
  const { business } = await requireBusiness();

  const order = await db.order.findFirst({ where: { id, businessId: business.id } });
  if (!order) return { error: 'Pedido não encontrado.' };

  await db.order.update({ where: { id }, data: { status } });

  await logActivity(business.id, {
    type: 'order.updated',
    title: `Pedido marcado como ${ORDER_FLOW_LABELS[status]}`,
    description: `#${order.number} · ${order.customerName} · ${brl(order.total)}`,
    entityType: 'order',
    entityId: id,
  });

  if (order.customerId) {
    await recalcCustomerValue(business.id, order.customerId);
    revalidatePath(`/clientes/${order.customerId}`);
  }

  revalidatePath('/catalogo/pedidos');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ------------------------------------------------------------------ upload de imagem

export async function uploadProductImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { business } = await requireBusiness();
  const result = await saveUploadedImage(formData.get('file') as File | null, `${business.id}/products`);
  if ('error' in result) return result;
  return { url: result.url };
}
