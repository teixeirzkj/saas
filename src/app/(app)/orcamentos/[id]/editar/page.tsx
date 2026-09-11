import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { QuoteForm } from '../../quote-form';

export const metadata: Metadata = { title: 'Editar orçamento' };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();

  const [quote, customers] = await Promise.all([
    db.quote.findFirst({
      where: { id, businessId: business.id },
      include: { items: { orderBy: { order: 'asc' } } },
    }),
    db.customer.findMany({
      where: { businessId: business.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  if (!quote) notFound();

  return (
    <QuoteForm
      customers={customers}
      defaultValidDays={business.quoteValidDays}
      quote={{
        id: quote.id,
        title: quote.title,
        customerId: quote.customerId,
        status: quote.status,
        discount: quote.discount,
        discountType: quote.discountType,
        notes: quote.notes,
        validUntil: quote.validUntil,
        items: quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      }}
    />
  );
}
