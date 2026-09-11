'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { brl } from '@/lib/utils';

/**
 * Resposta do cliente na página pública do orçamento.
 * Autorização é o próprio token opaco; nenhum id de empresa vem do cliente.
 */
export async function respondToQuote(token: string, decision: 'aprovado' | 'recusado') {
  if (!token || (decision !== 'aprovado' && decision !== 'recusado')) {
    return { error: 'Requisição inválida.' };
  }

  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    include: { customer: { select: { id: true, name: true } } },
  });

  if (!quote) return { error: 'Orçamento não encontrado.' };
  if (quote.status === 'rascunho') return { error: 'Este orçamento ainda não foi enviado.' };
  if (quote.status === 'aprovado' || quote.status === 'recusado') {
    return { error: 'Este orçamento já foi respondido.' };
  }
  if (quote.validUntil && quote.validUntil < new Date()) {
    return { error: 'O prazo de validade deste orçamento venceu. Fale com a empresa.' };
  }

  await db.quote.update({
    where: { id: quote.id },
    data: { status: decision, respondedAt: new Date() },
  });

  await db.activity.create({
    data: {
      businessId: quote.businessId,
      type: `quote.${decision}`,
      title: decision === 'aprovado' ? 'Orçamento aprovado pelo cliente' : 'Orçamento recusado pelo cliente',
      description: `#${quote.number} · ${quote.customer?.name ?? quote.title} · ${brl(quote.total)}`,
      entityType: 'quote',
      entityId: quote.id,
    },
  });

  await db.notification.create({
    data: {
      businessId: quote.businessId,
      title: decision === 'aprovado' ? 'Orçamento aprovado!' : 'Orçamento recusado',
      body: `${quote.customer?.name ?? 'O cliente'} respondeu o orçamento #${quote.number}.`,
      type: 'quote',
      href: `/orcamentos/${quote.id}`,
    },
  });

  if (decision === 'aprovado' && quote.customerId) {
    const [quotes, orders] = await Promise.all([
      db.quote.aggregate({
        where: { businessId: quote.businessId, customerId: quote.customerId, status: 'aprovado' },
        _sum: { total: true },
      }),
      db.order.aggregate({
        where: { businessId: quote.businessId, customerId: quote.customerId, status: { notIn: ['cancelado'] } },
        _sum: { total: true },
      }),
    ]);

    await db.customer.update({
      where: { id: quote.customerId },
      data: {
        totalValue: Math.round(((quotes._sum.total ?? 0) + (orders._sum.total ?? 0)) * 100) / 100,
        lastActivityAt: new Date(),
      },
    });
  }

  revalidatePath(`/orcamento/${token}`);
  revalidatePath('/orcamentos');
  revalidatePath('/dashboard');

  return { ok: true };
}
