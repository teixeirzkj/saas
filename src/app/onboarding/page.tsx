import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireUser } from '@/lib/auth';

import { OnboardingFlow } from './onboarding-flow';

export const metadata: Metadata = { title: 'Vamos organizar seu negócio' };

export default async function OnboardingPage() {
  const ctx = await requireUser();

  // Já concluiu o onboarding antes — não faz sentido repetir o fluxo
  if (ctx.business?.onboardedAt) redirect('/dashboard');

  return (
    <OnboardingFlow
      userName={ctx.user.name}
      businessName={ctx.business?.name ?? ''}
      segment={ctx.business?.segment ?? 'outro'}
    />
  );
}
