'use server';

import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { fieldErrors, onboardingSchema } from '@/lib/validation';

export type OnboardingState = { error?: string; errors?: Record<string, string> };

export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const ctx = await requireUser();
  if (!ctx.business) return { error: 'Nenhuma empresa vinculada à sua conta.' };

  const goals = formData.getAll('goals').map(String);

  const parsed = onboardingSchema.safeParse({
    businessName: formData.get('businessName'),
    segment: formData.get('segment'),
    goals,
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.business.update({
    where: { id: ctx.business.id },
    data: {
      name: parsed.data.businessName,
      segment: parsed.data.segment,
      primaryGoals: JSON.stringify(parsed.data.goals),
      onboardedAt: new Date(),
    },
  });

  redirect('/dashboard');
}
