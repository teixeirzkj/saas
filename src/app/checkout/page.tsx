import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { getPlan } from '@/lib/plans';

import { CheckoutView } from './checkout-view';

export const metadata: Metadata = { title: 'Finalizar assinatura' };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano } = await searchParams;
  const { plan: currentPlan } = await requireBusiness();

  const targetCode = plano && ['free', 'pro', 'business'].includes(plano) ? plano : null;
  if (!targetCode) redirect('/planos');

  const plan = getPlan(targetCode);

  if (plan.code === currentPlan.code) {
    redirect('/configuracoes/assinatura');
  }

  return <CheckoutView plan={plan} />;
}
