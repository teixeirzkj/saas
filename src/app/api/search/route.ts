import { NextResponse } from 'next/server';

import { apiContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { brl, formatDate, formatPhone } from '@/lib/utils';

/**
 * Busca global do painel.
 * Sempre escopada ao businessId da sessão — nunca aceita businessId do cliente.
 */
export async function GET(request: Request) {
  const ctx = await apiContext();
  if (!ctx) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const term = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (term.length < 2) return NextResponse.json({ results: [] });

  const businessId = ctx.businessId;
  const numeric = Number.parseInt(term.replace(/\D/g, ''), 10);
  const hasNumber = Number.isFinite(numeric) && term.replace(/\D/g, '').length > 0;

  const [customers, quotes, orders, products, deals, appointments] = await Promise.all([
    db.customer.findMany({
      where: {
        businessId,
        OR: [{ name: { contains: term } }, { phone: { contains: term } }, { email: { contains: term } }],
      },
      take: 5,
      orderBy: { lastActivityAt: 'desc' },
    }),
    db.quote.findMany({
      where: {
        businessId,
        OR: [{ title: { contains: term } }, ...(hasNumber ? [{ number: numeric }] : [])],
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { name: true } } },
    }),
    db.order.findMany({
      where: {
        businessId,
        OR: [{ customerName: { contains: term } }, ...(hasNumber ? [{ number: numeric }] : [])],
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    db.product.findMany({
      where: { businessId, name: { contains: term } },
      take: 4,
      orderBy: { name: 'asc' },
    }),
    db.deal.findMany({
      where: { businessId, title: { contains: term } },
      take: 4,
      orderBy: { updatedAt: 'desc' },
    }),
    db.appointment.findMany({
      where: { businessId, title: { contains: term } },
      take: 3,
      orderBy: { startsAt: 'desc' },
    }),
  ]);

  const results = [
    ...customers.map((c) => ({
      id: `c-${c.id}`,
      type: 'cliente' as const,
      title: c.name,
      subtitle: [c.phone ? formatPhone(c.phone) : null, c.email].filter(Boolean).join(' · '),
      href: `/clientes/${c.id}`,
    })),
    ...quotes.map((q) => ({
      id: `q-${q.id}`,
      type: 'orcamento' as const,
      title: `#${q.number} · ${q.title}`,
      subtitle: [q.customer?.name, brl(q.total)].filter(Boolean).join(' · '),
      href: `/orcamentos/${q.id}`,
    })),
    ...orders.map((o) => ({
      id: `o-${o.id}`,
      type: 'pedido' as const,
      title: `Pedido #${o.number} · ${o.customerName}`,
      subtitle: brl(o.total),
      href: `/catalogo/pedidos?pedido=${o.id}`,
    })),
    ...deals.map((d) => ({
      id: `d-${d.id}`,
      type: 'negociacao' as const,
      title: d.title,
      subtitle: brl(d.value),
      href: `/crm?negociacao=${d.id}`,
    })),
    ...products.map((p) => ({
      id: `p-${p.id}`,
      type: 'produto' as const,
      title: p.name,
      subtitle: brl(p.promoPrice ?? p.price),
      href: `/catalogo?produto=${p.id}`,
    })),
    ...appointments.map((a) => ({
      id: `a-${a.id}`,
      type: 'agendamento' as const,
      title: a.title,
      subtitle: formatDate(a.startsAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      href: `/agenda?data=${a.startsAt.toISOString().slice(0, 10)}`,
    })),
  ];

  return NextResponse.json({ results: results.slice(0, 16) });
}
