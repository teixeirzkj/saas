import type { Metadata } from 'next';

import { NewAccountForm } from './new-account-form';

export const metadata: Metadata = { title: 'Admin · Nova conta', robots: { index: false, follow: false } };

export default function NewAccountPage() {
  return <NewAccountForm />;
}
