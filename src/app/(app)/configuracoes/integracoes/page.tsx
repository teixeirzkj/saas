import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { IntegrationsView } from './integrations-view';

export const metadata: Metadata = { title: 'Integrações' };

export default async function IntegrationsPage() {
  const { business } = await requireBusiness();

  const [integrations, templates] = await Promise.all([
    db.integration.findMany({ where: { businessId: business.id } }),
    db.messageTemplate.findMany({ where: { businessId: business.id }, orderBy: { key: 'asc' } }),
  ]);

  return (
    <IntegrationsView
      integrations={integrations.map((i) => ({
        provider: i.provider,
        status: i.status,
        connectedAt: i.connectedAt,
      }))}
      templates={templates.map((t) => ({ key: t.key, title: t.title, body: t.body }))}
    />
  );
}
