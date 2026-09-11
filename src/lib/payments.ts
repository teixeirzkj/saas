import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { db } from '@/lib/db';
import { getPlan, type PlanCode } from '@/lib/plans';
import { addDays, appUrl } from '@/lib/utils';

/**
 * Camada de pagamento com provider trocável.
 *
 *  - "mock"        -> ambiente de desenvolvimento: gera um link interno de confirmação.
 *  - "infinitepay" -> gera link de cobrança da InfinitePay (checkout hospedado).
 *
 * Nenhuma chave é exposta ao cliente: tudo roda em server actions / route handlers.
 */

export type CheckoutSession = {
  paymentId: string;
  checkoutUrl: string;
  provider: string;
  amountCents: number;
};

export function provider() {
  return (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
}

export async function createCheckoutSession(opts: {
  businessId: string;
  planCode: PlanCode;
  customerEmail?: string | null;
  customerName?: string | null;
}): Promise<CheckoutSession> {
  const plan = getPlan(opts.planCode);
  const dbPlan = await db.plan.findUnique({ where: { code: plan.code } });
  if (!dbPlan) throw new Error('Plano não encontrado no banco. Rode "npm run db:seed".');

  const subscription = await db.subscription.upsert({
    where: { businessId: opts.businessId },
    create: {
      businessId: opts.businessId,
      planId: dbPlan.id,
      status: 'trialing',
      provider: provider(),
      currentPeriodEnd: addDays(new Date(), 30),
    },
    update: {},
  });

  const payment = await db.payment.create({
    data: {
      subscriptionId: subscription.id,
      amountCents: dbPlan.priceCents,
      status: plan.priceCents === 0 ? 'paid' : 'pending',
      provider: provider(),
      paidAt: plan.priceCents === 0 ? new Date() : null,
    },
  });

  // Plano gratuito: ativa na hora, sem passar pelo gateway.
  if (plan.priceCents === 0) {
    await activateSubscription({ businessId: opts.businessId, planCode: plan.code, paymentId: payment.id });
    return { paymentId: payment.id, checkoutUrl: '/dashboard?assinatura=ativada', provider: 'internal', amountCents: 0 };
  }

  const returnUrl = `${appUrl()}/checkout/retorno?payment=${payment.id}`;
  let checkoutUrl: string;

  if (provider() === 'infinitepay') {
    checkoutUrl = buildInfinitePayLink({
      amountCents: dbPlan.priceCents,
      description: `NEXO ${plan.name} - assinatura mensal`,
      paymentId: payment.id,
      returnUrl,
    });
  } else {
    // Sandbox local: tela interna que simula a aprovação do gateway.
    checkoutUrl = `/checkout/pagamento?payment=${payment.id}`;
  }

  await db.payment.update({ where: { id: payment.id }, data: { checkoutUrl } });

  return { paymentId: payment.id, checkoutUrl, provider: provider(), amountCents: dbPlan.priceCents };
}

/**
 * Link de cobrança InfinitePay.
 * O handle da conta ($seunegocio) vem do .env — nunca do cliente.
 */
export function buildInfinitePayLink(opts: {
  amountCents: number;
  description: string;
  paymentId: string;
  returnUrl: string;
}) {
  const handle = (process.env.INFINITEPAY_HANDLE || '').replace(/^\$/, '');
  if (!handle) throw new Error('INFINITEPAY_HANDLE não configurado no .env');

  const params = new URLSearchParams({
    items: JSON.stringify([{ name: opts.description, price: opts.amountCents, quantity: 1 }]),
    order_nsu: opts.paymentId,
    redirect_url: opts.returnUrl,
  });

  return `https://checkout.infinitepay.io/${handle}?${params.toString()}`;
}

/** Ativa/renova a assinatura e libera os recursos do plano. */
export async function activateSubscription(opts: {
  businessId: string;
  planCode: PlanCode;
  paymentId?: string;
  externalId?: string;
}) {
  const dbPlan = await db.plan.findUnique({ where: { code: opts.planCode } });
  if (!dbPlan) throw new Error('Plano não encontrado');

  const now = new Date();

  const subscription = await db.subscription.upsert({
    where: { businessId: opts.businessId },
    create: {
      businessId: opts.businessId,
      planId: dbPlan.id,
      status: 'active',
      provider: provider(),
      externalId: opts.externalId,
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, 30),
      aiUsed: 0,
      aiResetAt: now,
    },
    update: {
      planId: dbPlan.id,
      status: 'active',
      provider: provider(),
      externalId: opts.externalId,
      currentPeriodStart: now,
      currentPeriodEnd: addDays(now, 30),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      aiUsed: 0,
      aiResetAt: now,
    },
  });

  if (opts.paymentId) {
    await db.payment.update({
      where: { id: opts.paymentId },
      data: { status: 'paid', paidAt: now, externalId: opts.externalId },
    });
  }

  await db.notification.create({
    data: {
      businessId: opts.businessId,
      title: `Plano ${dbPlan.name} ativado`,
      body: 'Todos os recursos do seu plano já estão liberados.',
      type: 'success',
      href: '/configuracoes/assinatura',
    },
  });

  await db.activity.create({
    data: {
      businessId: opts.businessId,
      type: 'subscription.activated',
      title: `Assinatura ${dbPlan.name} ativada`,
      entityType: 'subscription',
      entityId: subscription.id,
    },
  });

  return subscription;
}

export async function cancelSubscription(businessId: string, immediate = false) {
  const sub = await db.subscription.findUnique({ where: { businessId } });
  if (!sub) return null;

  if (immediate) {
    const free = await db.plan.findUnique({ where: { code: 'free' } });
    return db.subscription.update({
      where: { businessId },
      data: {
        planId: free?.id ?? sub.planId,
        status: 'canceled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
  }

  return db.subscription.update({
    where: { businessId },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });
}

export async function resumeSubscription(businessId: string) {
  return db.subscription.update({
    where: { businessId },
    data: { cancelAtPeriodEnd: false, canceledAt: null, status: 'active' },
  });
}

/** Valida a assinatura HMAC do webhook do gateway. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = signature.replace(/^sha256=/, '');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
