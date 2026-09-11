import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ThemeStyle } from '@/components/theme/theme-style';
import { db } from '@/lib/db';
import { getTheme } from '@/lib/themes';

import { PublicQuoteView } from './public-quote-view';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    select: { number: true, business: { select: { name: true } } },
  });

  if (!quote) return { title: 'Orçamento não encontrado' };

  return {
    title: `Orçamento #${quote.number} · ${quote.business.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Acesso por token opaco: não expõe id sequencial nem exige login.
  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    include: {
      items: { orderBy: { order: 'asc' } },
      customer: { select: { name: true, phone: true, email: true, company: true, address: true } },
      business: true,
    },
  });

  if (!quote || quote.status === 'rascunho') notFound();

  const theme = getTheme(quote.business.segment);

  return (
    <>
      <ThemeStyle theme={theme} brandColor={quote.business.brandColor} />
      <PublicQuoteView
      token={token}
      business={{
        name: quote.business.name,
        logoUrl: quote.business.logoUrl,
        phone: quote.business.phone,
        whatsapp: quote.business.whatsapp,
        email: quote.business.email,
        address: quote.business.address,
        city: quote.business.city,
        state: quote.business.state,
        document: quote.business.document,
        instagram: quote.business.instagram,
      }}
      quote={{
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
    </>
  );
}
