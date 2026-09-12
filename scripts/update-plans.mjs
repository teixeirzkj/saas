// Atualiza só a tabela Plan a partir de src/lib/plans.ts, sem tocar em
// nenhuma empresa/assinatura existente. Rodar com: node scripts/update-plans.mjs
// (precisa do tsx/register para importar o .ts, então roda via tsx)
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const { PLANS } = await import('../src/lib/plans.ts');

for (const plan of PLANS) {
  await db.plan.upsert({
    where: { code: plan.code },
    update: {
      name: plan.name,
      priceCents: plan.priceCents,
      description: plan.description,
      highlight: plan.highlight,
      order: plan.order,
      maxCustomers: plan.limits.maxCustomers,
      maxQuotes: plan.limits.maxQuotes,
      maxProducts: plan.limits.maxProducts,
      maxUsers: plan.limits.maxUsers,
      aiCredits: plan.limits.aiCredits,
      features: JSON.stringify(plan.features),
    },
    create: {
      code: plan.code,
      name: plan.name,
      priceCents: plan.priceCents,
      interval: plan.interval,
      description: plan.description,
      highlight: plan.highlight,
      order: plan.order,
      maxCustomers: plan.limits.maxCustomers,
      maxQuotes: plan.limits.maxQuotes,
      maxProducts: plan.limits.maxProducts,
      maxUsers: plan.limits.maxUsers,
      aiCredits: plan.limits.aiCredits,
      features: JSON.stringify(plan.features),
    },
  });
  console.log(`  ${plan.code} -> ${plan.name} (${(plan.priceCents / 100).toFixed(2)})`);
}

console.log('Planos atualizados.');
await db.$disconnect();
