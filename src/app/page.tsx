import type { Metadata } from 'next';

import { getSession } from '@/lib/auth';

import { LandingView } from './landing-view';

export const metadata: Metadata = {
  title: 'NEXO — Tudo que seu negócio precisa. Em um só lugar.',
  description:
    'Organize clientes, orçamentos, agenda, vendas e conteúdo em uma plataforma simples, rápida e inteligente. 5 ferramentas. 1 plataforma.',
};

export default async function LandingPage() {
  const session = await getSession();
  return <LandingView isLoggedIn={Boolean(session)} />;
}
