import 'server-only';

import { db } from '@/lib/db';

/**
 * Helpers de cliente usados pelo código de servidor (inclusive pelas páginas públicas).
 *
 * Ficam FORA de um módulo "use server" de propósito: funções que recebem businessId
 * por parâmetro não podem ser expostas como server action, senão qualquer visitante
 * conseguiria escrever nos dados de outra empresa.
 */

/** Busca (pelo final do telefone) ou cria um cliente. Usado no catálogo e no agendamento público. */
export async function upsertCustomerByPhone(
  businessId: string,
  input: { name: string; phone: string; address?: string | null; source?: string },
) {
  const digits = input.phone.replace(/\D/g, '');

  const existing = digits.length >= 8
    ? await db.customer.findFirst({
        where: { businessId, phone: { contains: digits.slice(-8) } },
      })
    : null;

  if (existing) {
    return db.customer.update({
      where: { id: existing.id },
      data: {
        name: existing.name || input.name,
        address: input.address ?? existing.address,
        status: existing.status === 'inativo' ? 'ativo' : existing.status,
        lastActivityAt: new Date(),
      },
    });
  }

  return db.customer.create({
    data: {
      businessId,
      name: input.name,
      phone: input.phone,
      address: input.address ?? undefined,
      source: input.source ?? 'site',
      status: 'ativo',
      lastActivityAt: new Date(),
    },
  });
}

/** Soma orçamentos aprovados + pedidos não cancelados e grava em Customer.totalValue. */
export async function recalcCustomerValue(businessId: string, customerId: string) {
  const [quotes, orders] = await Promise.all([
    db.quote.aggregate({ where: { businessId, customerId, status: 'aprovado' }, _sum: { total: true } }),
    db.order.aggregate({
      where: { businessId, customerId, status: { notIn: ['cancelado'] } },
      _sum: { total: true },
    }),
  ]);

  await db.customer.update({
    where: { id: customerId },
    data: {
      totalValue: Math.round(((quotes._sum.total ?? 0) + (orders._sum.total ?? 0)) * 100) / 100,
      lastActivityAt: new Date(),
    },
  });
}

/** Próximo número sequencial por empresa (orçamentos e pedidos). */
export async function nextNumber(businessId: string, entity: 'quote' | 'order') {
  if (entity === 'quote') {
    const last = await db.quote.findFirst({
      where: { businessId },
      orderBy: { number: 'desc' },
      select: { number: true },
    });
    return (last?.number ?? 1000) + 1;
  }

  const last = await db.order.findFirst({
    where: { businessId },
    orderBy: { number: 'desc' },
    select: { number: true },
  });
  return (last?.number ?? 100) + 1;
}
