import type { Metadata } from 'next';

import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const { plano } = await searchParams;
  return <SignupForm plan={plano} />;
}
