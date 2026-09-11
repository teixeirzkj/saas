import 'server-only';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { getPlan } from '@/lib/plans';
import { SESSION_COOKIE, cookieOptions, signSession, verifySession, type SessionPayload } from '@/lib/session';
import { addDays, slugify } from '@/lib/utils';

// ------------------------------------------------------------------ senhas

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 11);
}

export function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

// ------------------------------------------------------------------ sessao

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

/**
 * Contexto autenticado completo. Todo acesso a dados no app passa por aqui:
 * o businessId retornado e o unico escopo permitido para queries.
 */
export async function getAuthContext() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      business: {
        include: { subscription: { include: { plan: true } } },
      },
    },
  });

  if (!user) return null;

  const planCode = user.business?.subscription?.plan.code ?? 'free';

  return {
    user,
    business: user.business,
    businessId: user.business?.id ?? null,
    subscription: user.business?.subscription ?? null,
    plan: getPlan(planCode),
    planCode,
  };
}

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthContext>>>;
export type AppContext = AuthContext & {
  business: NonNullable<AuthContext['business']>;
  businessId: string;
};

/** Usado nas paginas do painel: garante usuario + empresa + onboarding concluido. */
export async function requireBusiness(): Promise<AppContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (!ctx.business) redirect('/onboarding');
  if (!ctx.business.onboardedAt) redirect('/onboarding');
  return ctx as AppContext;
}

/** Igual ao anterior mas sem exigir onboarding (usado na propria tela de onboarding). */
export async function requireUser() {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  return ctx;
}

/** Versao para route handlers: devolve null em vez de redirecionar. */
export async function apiContext(): Promise<AppContext | null> {
  const ctx = await getAuthContext();
  if (!ctx || !ctx.business) return null;
  return ctx as AppContext;
}

// ------------------------------------------------------------------ cadastro

export async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  businessName: string;
  segment: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: 'Este e-mail já está cadastrado. Tente fazer login.' as string };

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueSlug(input.businessName || input.name);

  const freePlan = await db.plan.findUnique({ where: { code: 'free' } });
  if (!freePlan) return { error: 'Planos não inicializados. Rode "npm run db:seed".' };

  const business = await db.business.create({
    data: {
      name: input.businessName || input.name,
      slug,
      segment: input.segment || 'outro',
      subscription: {
        create: {
          planId: freePlan.id,
          status: 'active',
          currentPeriodEnd: addDays(new Date(), 30),
          aiResetAt: new Date(),
        },
      },
      messageTemplates: { create: defaultTemplates() },
      integrations: {
        create: [
          { provider: 'whatsapp', status: 'connected', connectedAt: new Date() },
          { provider: 'instagram', status: 'disconnected' },
          { provider: 'payment', status: 'disconnected' },
        ],
      },
    },
  });

  const user = await db.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      businessId: business.id,
      role: 'owner',
      lastLoginAt: new Date(),
    },
  });

  await setSessionCookie({ userId: user.id, businessId: business.id, email: user.email, name: user.name });

  return { user, business };
}

export async function uniqueSlug(base: string) {
  const root = slugify(base) || 'negocio';
  let candidate = root;
  let i = 1;
  while (await db.business.findUnique({ where: { slug: candidate } })) {
    candidate = `${root}-${i++}`;
  }
  return candidate;
}

export function defaultTemplates() {
  return [
    {
      key: 'quote_send',
      title: 'Enviar orçamento',
      body:
        'Olá, {cliente}! Tudo bem? Segue seu orçamento solicitado. Acesse o link para conferir os detalhes: {link}',
    },
    {
      key: 'appointment_confirm',
      title: 'Confirmar agendamento',
      body: 'Olá, {cliente}! Confirmando seu horário de {servico} em {data} às {hora}. Posso confirmar?',
    },
    {
      key: 'order_confirm',
      title: 'Confirmar pedido',
      body: 'Olá, {cliente}! Recebemos seu pedido #{numero}. Total de {total}. Já estamos preparando!',
    },
    {
      key: 'followup',
      title: 'Follow-up de venda',
      body: 'Olá, {cliente}! Passando para saber se conseguiu analisar a proposta. Ficou alguma dúvida?',
    },
    {
      key: 'catalog_share',
      title: 'Enviar catálogo',
      body: 'Olá, {cliente}! Esse é o nosso catálogo completo, dá uma olhada: {link}',
    },
  ];
}

// ------------------------------------------------------------------ limites do plano

export async function checkLimit(ctx: AppContext, resource: 'customers' | 'quotes' | 'products') {
  const { plan, businessId } = ctx;

  if (resource === 'customers') {
    if (plan.limits.maxCustomers < 0) return { allowed: true as const };
    const count = await db.customer.count({ where: { businessId } });
    return count >= plan.limits.maxCustomers
      ? {
          allowed: false as const,
          message: `Seu plano ${plan.name} permite ${plan.limits.maxCustomers} clientes. Faça upgrade para cadastrar mais.`,
        }
      : { allowed: true as const };
  }

  if (resource === 'quotes') {
    if (plan.limits.maxQuotes < 0) return { allowed: true as const };
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const count = await db.quote.count({ where: { businessId, createdAt: { gte: start } } });
    return count >= plan.limits.maxQuotes
      ? {
          allowed: false as const,
          message: `Seu plano ${plan.name} permite ${plan.limits.maxQuotes} orçamentos por mês. Faça upgrade para continuar.`,
        }
      : { allowed: true as const };
  }

  if (plan.limits.maxProducts < 0) return { allowed: true as const };
  const count = await db.product.count({ where: { businessId } });
  return count >= plan.limits.maxProducts
    ? {
        allowed: false as const,
        message: `Seu plano ${plan.name} permite ${plan.limits.maxProducts} produtos. Faça upgrade para cadastrar mais.`,
      }
    : { allowed: true as const };
}

// ------------------------------------------------------------------ trilha de atividades

export async function logActivity(
  businessId: string,
  input: { type: string; title: string; description?: string; entityType?: string; entityId?: string },
) {
  await db.activity.create({ data: { businessId, ...input } });
}

export async function notify(
  businessId: string,
  input: { title: string; body?: string; type?: string; href?: string; userId?: string | null },
) {
  await db.notification.create({
    data: {
      businessId,
      title: input.title,
      body: input.body,
      type: input.type ?? 'info',
      href: input.href,
      userId: input.userId ?? undefined,
    },
  });
}
