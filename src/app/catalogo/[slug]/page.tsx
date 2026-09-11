import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ThemeStyle } from '@/components/theme/theme-style';
import { db } from '@/lib/db';
import { getTheme } from '@/lib/themes';
import { parseJson } from '@/lib/utils';

import { PublicCatalog } from './public-catalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = await db.business.findUnique({
    where: { slug },
    select: { name: true, catalogHeadline: true, about: true },
  });

  if (!business) return { title: 'Catálogo não encontrado' };

  return {
    title: `Catálogo · ${business.name}`,
    description: business.catalogHeadline ?? business.about ?? `Confira os produtos de ${business.name}.`,
  };
}

export default async function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { order: 'asc' } },
      products: {
        where: { available: true },
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      },
    },
  });

  if (!business || !business.catalogEnabled) notFound();

  const theme = getTheme(business.segment);

  return (
    <>
      <ThemeStyle theme={theme} brandColor={business.brandColor} />
      <PublicCatalog
        business={{
          name: business.name,
          slug: business.slug,
          logoUrl: business.logoUrl,
          about: business.about,
          catalogHeadline: business.catalogHeadline,
          address: business.address,
          city: business.city,
          whatsapp: business.whatsapp,
          instagram: business.instagram,
          deliveryFee: business.deliveryFee,
          minOrder: business.minOrder,
        }}
        terminology={theme.terminology}
        categories={business.categories.map((c) => ({ id: c.id, name: c.name }))}
        products={business.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          promoPrice: p.promoPrice,
          imageUrl: p.imageUrl,
          featured: p.featured,
          categoryId: p.categoryId,
          addons: parseJson<{ name: string; price: number }[]>(p.addons, []),
        }))}
      />
    </>
  );
}
