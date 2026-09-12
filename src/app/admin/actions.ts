'use server';

import { randomBytes } from 'node:crypto';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin-auth';
import { hashPassword, uniqueSlug, defaultTemplates } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPlan, type PlanCode } from '@/lib/plans';
import { addDays, str } from '@/lib/utils';
import { z } from 'zod';

export type AdminFormState = { ok?: boolean; error?: string; errors?: Record<string, string>; id?: string; generatedPassword?: string };

// ------------------------------------------------------------------ criar conta

const createSchema = z.object({
  businessName: z.string().trim().min(2, 'Informe o nome do negócio'),
  segment: z.string().trim().min(1),
  ownerName: z.string().trim().min(2, 'Informe o nome do responsável'),
  ownerEmail: z.string().trim().toLowerCase().email('E-mail inválido'),
  planCode: z.enum(['free', 'pro', 'business']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
});

function generatePassword() {
  return randomBytes(6).toString('base64url'); // ~8 caracteres, alfanumérico
}

export async function createBusinessAccount(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    businessName: formData.get('businessName'),
    segment: formData.get('segment'),
    ownerName: formData.get('ownerName'),
    ownerEmail: formData.get('ownerEmail'),
    planCode: formData.get('planCode') || 'free',
    dueDate: formData.get('dueDate'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join('.') || 'form'] = issue.message;
    return { errors };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.ownerEmail } });
  if (existing) return { error: 'Já existe uma conta com esse e-mail.' };

  const dbPlan = await db.plan.findUnique({ where: { code: parsed.data.planCode } });
  if (!dbPlan) return { error: 'Plano não encontrado.' };

  const password = generatePassword();
  const passwordHash = await hashPassword(password);
  const slug = await uniqueSlug(parsed.data.businessName);

  const business = await db.business.create({
    data: {
      name: parsed.data.businessName,
      slug,
      segment: parsed.data.segment,
      onboardedAt: new Date(), // conta criada pelo admin já entra pronta, sem passar pelo onboarding
      subscription: {
        create: {
          planId: dbPlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(`${parsed.data.dueDate}T23:59:59`),
        },
      },
      messageTemplates: { create: defaultTemplates() },
      integrations: {
        create: [
          { provider: 'whatsapp', status: 'connected', connectedAt: new Date() },
          { provider: 'instagram', status: 'disconnected' },
          { provider: 'payment', status: 'disconnected' },
        ],
      },
    },
  });

  await db.user.create({
    data: {
      name: parsed.data.ownerName,
      email: parsed.data.ownerEmail,
      passwordHash,
      businessId: business.id,
      role: 'owner',
      emailVerified: true,
    },
  });

  revalidatePath('/admin');
  return { ok: true, id: business.id, generatedPassword: password };
}

// ------------------------------------------------------------------ assinatura / pagamento

const subscriptionSchema = z.object({
  planCode: z.enum(['free', 'pro', 'business']),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  adminNotes: z.string().trim().max(1000).optional(),
});

export async function updateSubscription(businessId: string, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = subscriptionSchema.safeParse({
    planCode: formData.get('planCode'),
    status: formData.get('status'),
    dueDate: formData.get('dueDate'),
    adminNotes: formData.get('adminNotes'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join('.') || 'form'] = issue.message;
    return { errors };
  }

  const dbPlan = await db.plan.findUnique({ where: { code: parsed.data.planCode } });
  if (!dbPlan) return { error: 'Plano não encontrado.' };

  await db.business.update({ where: { id: businessId }, data: { adminNotes: str(parsed.data.adminNotes) ?? null } });

  await db.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      planId: dbPlan.id,
      status: parsed.data.status,
      currentPeriodEnd: new Date(`${parsed.data.dueDate}T23:59:59`),
    },
    update: {
      planId: dbPlan.id,
      status: parsed.data.status,
      currentPeriodEnd: new Date(`${parsed.data.dueDate}T23:59:59`),
      cancelAtPeriodEnd: false,
      canceledAt: parsed.data.status === 'canceled' ? new Date() : null,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contas/${businessId}`);
  return { ok: true };
}

/** Atalho: marca como pago e empurra o vencimento 30 dias a partir de hoje (ou da data atual de vencimento, se ainda não venceu). */
export async function markPaid(businessId: string): Promise<AdminFormState> {
  await requireAdmin();

  const subscription = await db.subscription.findUnique({ where: { businessId } });
  if (!subscription) return { error: 'Assinatura não encontrada.' };

  const base = subscription.currentPeriodEnd > new Date() ? subscription.currentPeriodEnd : new Date();

  await db.subscription.update({
    where: { businessId },
    data: { status: 'active', currentPeriodEnd: addDays(base, 30), cancelAtPeriodEnd: false, canceledAt: null },
  });

  await db.payment.create({
    data: {
      subscriptionId: subscription.id,
      amountCents: 0,
      status: 'paid',
      provider: 'manual',
      paidAt: new Date(),
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contas/${businessId}`);
  return { ok: true };
}

// ------------------------------------------------------------------ bloqueio

export async function toggleBlock(businessId: string, reason?: string): Promise<AdminFormState> {
  await requireAdmin();

  const business = await db.business.findUnique({ where: { id: businessId } });
  if (!business) return { error: 'Conta não encontrada.' };

  await db.business.update({
    where: { id: businessId },
    data: {
      blocked: !business.blocked,
      blockedReason: !business.blocked ? str(reason) ?? 'Acesso suspenso pelo administrador.' : null,
      blockedAt: !business.blocked ? new Date() : null,
    },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contas/${businessId}`);
  return { ok: true };
}

// ------------------------------------------------------------------ exclusão

export async function deleteBusinessAccount(businessId: string): Promise<AdminFormState> {
  await requireAdmin();

  const exists = await db.business.count({ where: { id: businessId } });
  if (!exists) return { error: 'Conta não encontrada.' };

  // onDelete: Cascade em todas as tabelas de tenant já apaga tudo (clientes,
  // orçamentos, pedidos, etc.) junto com a empresa.
  await db.business.delete({ where: { id: businessId } });

  revalidatePath('/admin');
  redirect('/admin');
}
