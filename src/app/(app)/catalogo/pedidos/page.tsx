import type { Metadata } from 'next';

import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { parseJson } from '@/lib/utils';

import { OrdersBoard } from './orders-board';

export const metadata: Metadata = { title: 'Pedidos' };

export default async function OrdersPage() {
  const { business } = await requireBusiness();

  const orders = await db.order.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      items: true,
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  return (
    <OrdersBoard
      businessName={business.name}
      orders={orders.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        deliveryType: order.deliveryType,
        paymentMethod: order.paymentMethod,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        notes: order.notes,
        source: order.source,
        createdAt: order.createdAt,
        customer: order.customer,
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          notes: item.notes,
          addons: parseJson<{ name: string }[]>(item.addons, []),
        })),
      }))}
    />
  );
}
