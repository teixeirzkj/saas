import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { endOfMonth, startOfMonth } from '@/lib/utils';

import { FinanceView } from './finance-view';

export const metadata: Metadata = { title: 'Financeiro' };

export default async function FinancePage() {
  const { business } = await requireBusiness();
  const businessId = business.id;
  const now = new Date();

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prevMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [monthOrders, monthQuotes, prevOrders, prevQuotes, monthly, byPayment, topProducts, topCustomers] =
    await Promise.all([
      db.order.aggregate({
        where: { businessId, status: { notIn: ['cancelado'] }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
        _count: true,
      }),
      db.quote.aggregate({
        where: { businessId, status: 'aprovado', respondedAt: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
        _count: true,
      }),
      db.order.aggregate({
        where: { businessId, status: { notIn: ['cancelado'] }, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { total: true },
      }),
      db.quote.aggregate({
        where: { businessId, status: 'aprovado', respondedAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { total: true },
      }),
      Promise.all(
        Array.from({ length: 6 }).map(async (_, i) => {
          const ref = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const from = startOfMonth(ref);
          const to = endOfMonth(ref);
          const [orders, quotes] = await Promise.all([
            db.order.aggregate({
              where: { businessId, status: { notIn: ['cancelado'] }, createdAt: { gte: from, lte: to } },
              _sum: { total: true },
            }),
            db.quote.aggregate({
              where: { businessId, status: 'aprovado', respondedAt: { gte: from, lte: to } },
              _sum: { total: true },
            }),
          ]);
          return {
            label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(ref).replace('.', ''),
            orders: Math.round(orders._sum.total ?? 0),
            quotes: Math.round(quotes._sum.total ?? 0),
            value: Math.round((orders._sum.total ?? 0) + (quotes._sum.total ?? 0)),
          };
        }),
      ),
      db.order.groupBy({
        by: ['paymentMethod'],
        where: { businessId, status: { notIn: ['cancelado'] }, createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
      }),
      db.orderItem.groupBy({
        by: ['name'],
        where: { order: { businessId, status: { notIn: ['cancelado'] } } },
        _sum: { total: true, quantity: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      db.customer.findMany({
        where: { businessId, totalValue: { gt: 0 } },
        orderBy: { totalValue: 'desc' },
        take: 5,
        select: { id: true, name: true, totalValue: true },
      }),
    ]);

  const monthRevenue = (monthOrders._sum.total ?? 0) + (monthQuotes._sum.total ?? 0);
  const prevRevenue = (prevOrders._sum.total ?? 0) + (prevQuotes._sum.total ?? 0);

  return (
    <FinanceView
      monthRevenue={monthRevenue}
      prevRevenue={prevRevenue}
      orderCount={monthOrders._count}
      quoteCount={monthQuotes._count}
      orderRevenue={monthOrders._sum.total ?? 0}
      quoteRevenue={monthQuotes._sum.total ?? 0}
      monthly={monthly}
      byPayment={byPayment.map((p) => ({ label: paymentLabel(p.paymentMethod), value: Math.round(p._sum.total ?? 0) }))}
      topProducts={topProducts.map((p) => ({ label: p.name, value: Math.round(p._sum.total ?? 0), quantity: p._sum.quantity ?? 0 }))}
      topCustomers={topCustomers}
    />
  );
}

function paymentLabel(method: string) {
  if (method === 'pix') return 'Pix';
  if (method === 'cartao') return 'Cartão';
  if (method === 'dinheiro') return 'Dinheiro';
  return method;
}
