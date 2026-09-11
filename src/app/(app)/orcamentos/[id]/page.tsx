import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { appUrl } from '@/lib/utils';

import { QuoteDetail } from './quote-detail';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { business } = await requireBusiness();
  const quote = await db.quote.findFirst({
    where: { id, businessId: business.id },
    select: { number: true, title: true },
  });
  return { title: quote ? `#${quote.number} · ${quote.title}` : 'Orçamento' };
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { business } = await requireBusiness();

  const [quote, template] = await Promise.all([
    db.quote.findFirst({
      where: { id, businessId: business.id },
      include: {
        items: { orderBy: { order: 'asc' } },
        customer: { select: { id: true, name: true, phone: true, email: true, company: true, address: true } },
      },
    }),
    db.messageTemplate.findFirst({ where: { businessId: business.id, key: 'quote_send' } }),
  ]);

  if (!quote) notFound();

  return (
    <QuoteDetail
      business={{
        name: business.name,
        logoUrl: business.logoUrl,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
        address: business.address,
        city: business.city,
        state: business.state,
        document: business.document,
        instagram: business.instagram,
      }}
      appUrl={appUrl()}
      template={template?.body ?? null}
      quote={{
        id: quote.id,
        number: quote.number,
        title: quote.title,
        status: quote.status,
        subtotal: quote.subtotal,
        discount: quote.discount,
        discountType: quote.discountType,
        total: quote.total,
        notes: quote.notes,
        validUntil: quote.validUntil,
        createdAt: quote.createdAt,
        sentAt: quote.sentAt,
        respondedAt: quote.respondedAt,
        publicToken: quote.publicToken,
        customer: quote.customer,
        items: quote.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      }}
    />
  );
}
