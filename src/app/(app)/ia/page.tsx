import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';

import { IaStudio } from './ia-studio';

export const metadata: Metadata = { title: 'Nexo IA' };

export default async function IaPage() {
  const { business, plan } = await requireBusiness();

  const [subscription, history] = await Promise.all([
    db.subscription.findUnique({ where: { businessId: business.id } }),
    db.aIContent.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);

  return (
    <IaStudio
      business={{ name: business.name, segment: business.segment }}
      creditsUsed={subscription?.aiUsed ?? 0}
      creditsLimit={plan.limits.aiCredits}
      planName={plan.name}
      history={history.map((h) => ({
        id: h.id,
        type: h.type,
        output: h.output,
        saved: h.saved,
        createdAt: h.createdAt,
        prompt: h.prompt,
      }))}
    />
  );
}
