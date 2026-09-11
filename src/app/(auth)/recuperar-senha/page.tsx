import type { Metadata } from 'next';

import { ForgotForm, ResetForm } from './forms';

export const metadata: Metadata = { title: 'Recuperar senha' };

export default async function RecoverPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return token ? <ResetForm token={token} /> : <ForgotForm />;
}
