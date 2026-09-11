import type { Metadata } from 'next';

import { QuoteForm } from '../quote-form';
import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata: Metadata = { title: 'Novo orçamento' };

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { business } = await requireBusiness();
  const { cliente } = await searchParams;

  const customers = await db.customer.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return (
    <QuoteForm
      customers={customers}
      defaultValidDays={business.quoteValidDays}
      presetCustomerId={cliente}
    />
  );
}
