import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ThemeStyle } from '@/components/theme/theme-style';
import { db } from '@/lib/db';
import { getTheme } from '@/lib/themes';
import { parseJson } from '@/lib/utils';

import { BookingFlow } from './booking-flow';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({ where: { slug }, select: { name: true, about: true } });

  if (!business) return { title: 'Página não encontrada' };

  return {
    title: `Agendar horário · ${business.name}`,
    description: business.about ?? `Escolha o melhor horário para ser atendido na ${business.name}.`,
  };
}

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      services: { where: { active: true }, orderBy: { name: 'asc' } },
    },
  });

  if (!business || !business.bookingEnabled) notFound();

  const theme = getTheme(business.segment);

  // Só os horários ocupados dos próximos 60 dias — nada de dados de cliente aqui
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 60);

  const busy = await db.appointment.findMany({
    where: {
      businessId: business.id,
      status: { notIn: ['cancelado'] },
      startsAt: { gte: from, lte: to },
    },
    select: { startsAt: true, endsAt: true },
    orderBy: { startsAt: 'asc' },
  });

  return (
    <>
      <ThemeStyle theme={theme} brandColor={business.brandColor} />
      <BookingFlow
        business={{
          name: business.name,
          slug: business.slug,
          logoUrl: business.logoUrl,
          about: business.about,
          address: business.address,
          city: business.city,
          state: business.state,
          whatsapp: business.whatsapp,
          instagram: business.instagram,
          workdayStart: business.workdayStart,
          workdayEnd: business.workdayEnd,
          workdays: parseJson<number[]>(business.workdays, [1, 2, 3, 4, 5]),
          slotMin: business.bookingSlotMin,
        }}
        bookingCta={theme.terminology.bookingCta}
        services={business.services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          durationMin: s.durationMin,
          price: s.price,
          color: s.color,
        }))}
        busy={busy.map((b) => ({ start: b.startsAt.toISOString(), end: b.endsAt.toISOString() }))}
      />
    </>
  );
}
