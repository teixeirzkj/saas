'use server';

import { revalidatePath } from 'next/cache';

import { requireBusiness } from '@/lib/auth';
import { generateContent } from '@/lib/ai';
import { db } from '@/lib/db';
import { str } from '@/lib/utils';
import { aiSchema, fieldErrors } from '@/lib/validation';

export type GenerateState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  output?: string;
  id?: string;
  creditsUsed?: number;
  creditsLimit?: number;
};

async function resetCreditsIfNewMonth(businessId: string) {
  const sub = await db.subscription.findUnique({ where: { businessId } });
  if (!sub) return;

  const now = new Date();
  const resetAt = new Date(sub.aiResetAt);
  const isNewMonth = now.getFullYear() !== resetAt.getFullYear() || now.getMonth() !== resetAt.getMonth();

  if (isNewMonth) {
    await db.subscription.update({ where: { businessId }, data: { aiUsed: 0, aiResetAt: now } });
  }
}

export async function generateAIContent(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const ctx = await requireBusiness();
  const { business, plan, user } = ctx;

  await resetCreditsIfNewMonth(business.id);

  const subscription = await db.subscription.findUnique({ where: { businessId: business.id } });
  const used = subscription?.aiUsed ?? 0;
  const limit = plan.limits.aiCredits;

  if (limit > 0 && used >= limit) {
    return {
      error: `Você usou todos os ${limit} créditos de IA do plano ${plan.name} este mês. Faça upgrade para gerar mais conteúdo.`,
    };
  }

  const parsed = aiSchema.safeParse({
    type: formData.get('type'),
    businessName: str(formData.get('businessName')) ?? business.name,
    segment: str(formData.get('segment')) ?? business.segment,
    product: formData.get('product'),
    objective: formData.get('objective'),
    audience: formData.get('audience'),
    extra: formData.get('extra'),
    tone: formData.get('tone'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await generateContent(parsed.data);

  const content = await db.aIContent.create({
    data: {
      businessId: business.id,
      userId: user.id,
      type: parsed.data.type,
      prompt: JSON.stringify(parsed.data),
      output: result.output,
      tokensUsed: result.tokensUsed,
    },
  });

  if (subscription) {
    await db.subscription.update({ where: { businessId: business.id }, data: { aiUsed: { increment: 1 } } });
  }

  revalidatePath('/ia');

  return {
    ok: true,
    output: result.output,
    id: content.id,
    creditsUsed: used + 1,
    creditsLimit: limit,
  };
}

/** Regenera a partir do mesmo briefing, sem reabrir o formulário. */
export async function regenerateAIContent(contentId: string): Promise<GenerateState> {
  const ctx = await requireBusiness();
  const { business, plan, user } = ctx;

  await resetCreditsIfNewMonth(business.id);

  const subscription = await db.subscription.findUnique({ where: { businessId: business.id } });
  const used = subscription?.aiUsed ?? 0;
  const limit = plan.limits.aiCredits;

  if (limit > 0 && used >= limit) {
    return { error: `Você usou todos os ${limit} créditos de IA do plano ${plan.name} este mês.` };
  }

  const original = await db.aIContent.findFirst({ where: { id: contentId, businessId: business.id } });
  if (!original) return { error: 'Conteúdo original não encontrado.' };

  const brief = JSON.parse(original.prompt);
  const result = await generateContent(brief);

  const content = await db.aIContent.create({
    data: {
      businessId: business.id,
      userId: user.id,
      type: original.type,
      prompt: original.prompt,
      output: result.output,
      tokensUsed: result.tokensUsed,
    },
  });

  if (subscription) {
    await db.subscription.update({ where: { businessId: business.id }, data: { aiUsed: { increment: 1 } } });
  }

  revalidatePath('/ia');

  return { ok: true, output: result.output, id: content.id, creditsUsed: used + 1, creditsLimit: limit };
}

export async function saveAIContent(id: string): Promise<GenerateState> {
  const { business } = await requireBusiness();
  const exists = await db.aIContent.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Conteúdo não encontrado.' };

  await db.aIContent.update({ where: { id }, data: { saved: true } });
  revalidatePath('/ia');
  return { ok: true };
}

export async function updateAIContent(id: string, output: string): Promise<GenerateState> {
  const { business } = await requireBusiness();
  const exists = await db.aIContent.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Conteúdo não encontrado.' };

  await db.aIContent.update({ where: { id }, data: { output } });
  revalidatePath('/ia');
  return { ok: true };
}

export async function deleteAIContent(id: string): Promise<GenerateState> {
  const { business } = await requireBusiness();
  const exists = await db.aIContent.count({ where: { id, businessId: business.id } });
  if (!exists) return { error: 'Conteúdo não encontrado.' };

  await db.aIContent.delete({ where: { id } });
  revalidatePath('/ia');
  return { ok: true };
}
