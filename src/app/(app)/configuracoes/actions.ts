'use server';

import { revalidatePath } from 'next/cache';

import { comparePassword, hashPassword, requireBusiness, uniqueSlug } from '@/lib/auth';
import { cancelSubscription, resumeSubscription } from '@/lib/payments';
import { db } from '@/lib/db';
import { deleteUploadedImage, saveUploadedImage } from '@/lib/uploads';
import { money, str, toInt } from '@/lib/utils';
import {
  businessSchema,
  fieldErrors,
  passwordChangeSchema,
  profileSchema,
} from '@/lib/validation';

import type { FormState } from '../actions';

// ------------------------------------------------------------------ empresa

export async function updateBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireBusiness();

  const workdays = formData.getAll('workdays').map((v) => Number(v));

  const parsed = businessSchema.safeParse({
    name: formData.get('name'),
    segment: formData.get('segment'),
    slug: formData.get('slug'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp'),
    instagram: formData.get('instagram'),
    email: formData.get('email'),
    address: formData.get('address'),
    city: formData.get('city'),
    state: formData.get('state'),
    document: formData.get('document'),
    about: formData.get('about'),
    logoUrl: formData.get('logoUrl'),
    catalogHeadline: formData.get('catalogHeadline'),
    deliveryFee: money(formData.get('deliveryFee')),
    minOrder: money(formData.get('minOrder')),
    quoteValidDays: toInt(formData.get('quoteValidDays'), 7),
    bookingEnabled: formData.get('bookingEnabled') === 'true',
    catalogEnabled: formData.get('catalogEnabled') === 'true',
    bookingSlotMin: toInt(formData.get('bookingSlotMin'), 30),
    workdayStart: str(formData.get('workdayStart')) ?? '09:00',
    workdayEnd: str(formData.get('workdayEnd')) ?? '18:00',
    workdays: workdays.length ? workdays : [1, 2, 3, 4, 5],
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.slug !== business.slug) {
    const taken = await db.business.findFirst({ where: { slug: parsed.data.slug, id: { not: business.id } } });
    if (taken) return { error: 'Esse link já está em uso. Escolha outro.' };
  }

  // brandColor fica fora do zod de propósito: precisa poder ser "limpo" (voltar
  // para a cor padrão do segmento), o que um campo opcional-que-vira-undefined
  // não permitiria distinguir de "não enviado".
  const brandColorRaw = String(formData.get('brandColor') ?? '').trim();
  if (brandColorRaw && !/^#[0-9a-fA-F]{6}$/.test(brandColorRaw)) {
    return { errors: { brandColor: 'Cor personalizada inválida.' } };
  }
  const brandColor = brandColorRaw || null;

  await db.business.update({
    where: { id: business.id },
    data: {
      name: parsed.data.name,
      segment: parsed.data.segment,
      slug: parsed.data.slug,
      brandColor,
      phone: parsed.data.phone,
      whatsapp: parsed.data.whatsapp,
      instagram: parsed.data.instagram,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      document: parsed.data.document,
      about: parsed.data.about,
      logoUrl: parsed.data.logoUrl,
      catalogHeadline: parsed.data.catalogHeadline,
      deliveryFee: parsed.data.deliveryFee,
      minOrder: parsed.data.minOrder,
      quoteValidDays: parsed.data.quoteValidDays,
      bookingEnabled: parsed.data.bookingEnabled,
      catalogEnabled: parsed.data.catalogEnabled,
      bookingSlotMin: parsed.data.bookingSlotMin,
      workdayStart: parsed.data.workdayStart,
      workdayEnd: parsed.data.workdayEnd,
      workdays: JSON.stringify(parsed.data.workdays),
    },
  });

  revalidatePath('/configuracoes');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function suggestSlug(name: string) {
  await requireBusiness();
  return uniqueSlug(name);
}

// ------------------------------------------------------------------ perfil

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireBusiness();

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    avatarUrl: formData.get('avatarUrl'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (parsed.data.email !== user.email) {
    const taken = await db.user.findFirst({ where: { email: parsed.data.email, id: { not: user.id } } });
    if (taken) return { error: 'Este e-mail já está em uso por outra conta.' };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, email: parsed.data.email, avatarUrl: parsed.data.avatarUrl },
  });

  revalidatePath('/configuracoes/perfil');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireBusiness();

  const parsed = passwordChangeSchema.safeParse({
    current: formData.get('current'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const valid = await comparePassword(parsed.data.current, user.passwordHash);
  if (!valid) return { errors: { current: 'Senha atual incorreta' } };

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });

  return { ok: true };
}

// ------------------------------------------------------------------ assinatura

export async function cancelPlan(): Promise<FormState> {
  const { business } = await requireBusiness();
  await cancelSubscription(business.id, false);
  revalidatePath('/configuracoes/assinatura');
  return { ok: true };
}

export async function resumePlan(): Promise<FormState> {
  const { business } = await requireBusiness();
  await resumeSubscription(business.id);
  revalidatePath('/configuracoes/assinatura');
  return { ok: true };
}

// ------------------------------------------------------------------ integrações

export async function toggleIntegration(provider: string): Promise<FormState> {
  const { business } = await requireBusiness();

  const integration = await db.integration.findUnique({
    where: { businessId_provider: { businessId: business.id, provider } },
  });

  const nextStatus = integration?.status === 'connected' ? 'disconnected' : 'connected';

  await db.integration.upsert({
    where: { businessId_provider: { businessId: business.id, provider } },
    create: { businessId: business.id, provider, status: nextStatus, connectedAt: nextStatus === 'connected' ? new Date() : null },
    update: { status: nextStatus, connectedAt: nextStatus === 'connected' ? new Date() : null },
  });

  revalidatePath('/configuracoes/integracoes');
  return { ok: true };
}

// ------------------------------------------------------------------ templates de mensagem

export async function updateMessageTemplate(key: string, body: string): Promise<FormState> {
  const { business } = await requireBusiness();
  if (!body.trim()) return { error: 'A mensagem não pode ficar vazia.' };

  await db.messageTemplate.updateMany({ where: { businessId: business.id, key }, data: { body } });
  revalidatePath('/configuracoes/integracoes');
  return { ok: true };
}

// ------------------------------------------------------------------ upload de imagens

export async function uploadBusinessLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { business } = await requireBusiness();

  const result = await saveUploadedImage(formData.get('file') as File | null, `${business.id}/logo`);
  if ('error' in result) return result;

  await deleteUploadedImage(business.logoUrl);
  revalidatePath('/configuracoes');
  return { url: result.url };
}

export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { user } = await requireBusiness();

  const result = await saveUploadedImage(formData.get('file') as File | null, `${user.id}/avatar`);
  if ('error' in result) return result;

  await deleteUploadedImage(user.avatarUrl);
  revalidatePath('/configuracoes/perfil');
  return { url: result.url };
}
