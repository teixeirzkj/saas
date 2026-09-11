import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTheme } from '@/lib/themes';
import { appUrl, parseJson } from '@/lib/utils';

import { CatalogView } from './catalog-view';

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await requireBusiness();
  return { title: getTheme(business.segment).terminology.catalogLabel };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { business, plan } = await requireBusiness();
  const { novo } = await searchParams;
  const theme = getTheme(business.segment);

  const [categories, products, pendingOrders] = await Promise.all([
    db.category.findMany({ where: { businessId: business.id }, orderBy: { order: 'asc' } }),
    db.product.findMany({
      where: { businessId: business.id },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    }),
    db.order.count({ where: { businessId: business.id, status: { in: ['novo', 'confirmado', 'preparando'] } } }),
  ]);

  return (
    <CatalogView
      slug={business.slug}
      appUrl={appUrl()}
      terminology={theme.terminology}
      catalogEnabled={business.catalogEnabled}
      pendingOrders={pendingOrders}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        promoPrice: p.promoPrice,
        imageUrl: p.imageUrl,
        available: p.available,
        featured: p.featured,
        categoryId: p.categoryId,
        addons: parseJson<{ name: string; price: number }[]>(p.addons, []),
      }))}
      openNew={novo === '1'}
      limit={plan.limits.maxProducts}
      planName={plan.name}
    />
  );
}
