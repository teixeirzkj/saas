import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { parseJson } from '@/lib/utils';

import { BusinessForm } from './business-form';

export const metadata: Metadata = { title: 'Minha empresa' };

export default async function BusinessSettingsPage() {
  const { business } = await requireBusiness();

  return (
    <BusinessForm
      business={{
        name: business.name,
        segment: business.segment,
        slug: business.slug,
        phone: business.phone,
        whatsapp: business.whatsapp,
        instagram: business.instagram,
        email: business.email,
        address: business.address,
        city: business.city,
        state: business.state,
        document: business.document,
        about: business.about,
        logoUrl: business.logoUrl,
        brandColor: business.brandColor,
        catalogHeadline: business.catalogHeadline,
        deliveryFee: business.deliveryFee,
        minOrder: business.minOrder,
        quoteValidDays: business.quoteValidDays,
        bookingEnabled: business.bookingEnabled,
        catalogEnabled: business.catalogEnabled,
        bookingSlotMin: business.bookingSlotMin,
        workdayStart: business.workdayStart,
        workdayEnd: business.workdayEnd,
        workdays: parseJson<number[]>(business.workdays, [1, 2, 3, 4, 5]),
      }}
    />
  );
}
