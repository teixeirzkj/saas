import type { Metadata } from 'next';

import { getSession } from '@/lib/auth';

import { PlansView } from './plans-view';

export const metadata: Metadata = {
  title: 'Planos',
  description: 'Planos simples para crescer com você, a partir de R$ 19,90/mês.',
};

export default async function PlansPage() {
  const session = await getSession();

  return <PlansView isLoggedIn={Boolean(session)} />;
}
