'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChefHat,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/misc';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ORDER_FLOW, ORDER_STATUS, type OrderStatus } from '@/lib/constants';
import { brl, cn, formatDateTime, relativeTime } from '@/lib/utils';
import { orderMessage } from '@/lib/whatsapp';

import { setOrderStatus } from '../actions';

type Order = {
  id: string;
  number: number;
  status: string;
  customerName: string;
  customerPhone: string;
  address: string | null;
  deliveryType: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes: string | null;
  source: string;
  createdAt: Date;
  customer: { id: string; name: string; phone: string | null } | null;
  items: { id: string; name: string; quantity: number; unitPrice: number; total: number; notes: string | null; addons: { name: string }[] }[];
};

const COLUMN_ICONS: Record<string, typeof Package> = {
  novo: ShoppingBag,
  confirmado: CheckCircle2,
  preparando: ChefHat,
  pronto: Package,
  concluido: Store,
  cancelado: Ban,
};

const COLUMNS: OrderStatus[] = ['novo', 'confirmado', 'preparando', 'pronto', 'concluido', 'cancelado'];

export function OrdersBoard({ businessName, orders }: { businessName: string; orders: Order[] }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Order | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const status of COLUMNS) map.set(status, []);
    for (const order of orders) map.get(order.status)?.push(order);
    return map;
  }, [orders]);

  const activeCount = orders.filter((o) => !['concluido', 'cancelado'].includes(o.status)).length;

  const changeStatus = (order: Order, status: OrderStatus) =>
    startTransition(async () => {
      const result = await setOrderStatus(order.id, status);
      if (result.error) return error('Não foi possível atualizar', result.error);
      success(`Pedido #${order.number} marcado como ${ORDER_STATUS[status].label.toLowerCase()}`);
      router.refresh();
      setSelected((current) => (current?.id === order.id ? { ...current, status } : current));
    });

  return (
    <>
      <div className="mb-6">
        <ButtonLink
          href="/catalogo"
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 text-white/45 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao catálogo
        </ButtonLink>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
            Pedidos
          </h1>
          <p className="text-sm text-white/45">
            {activeCount === 0 ? 'Nenhum pedido em andamento.' : `${activeCount} ${activeCount === 1 ? 'pedido em andamento' : 'pedidos em andamento'}.`}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Nenhum pedido recebido ainda"
          description="Assim que um cliente finalizar um pedido pela sua página pública de catálogo, ele aparece aqui."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto pb-2 sm:grid-cols-2 lg:flex lg:gap-3">
          {COLUMNS.map((status) => {
            const list = byStatus.get(status) ?? [];
            const Icon = COLUMN_ICONS[status];
            const meta = ORDER_STATUS[status];

            return (
              <div key={status} className="flex min-w-0 flex-col lg:w-[280px] lg:shrink-0">
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <Icon className="h-3.5 w-3.5 text-white/40" />
                  <p className="text-[12.5px] font-semibold text-white/70">{meta.label}</p>
                  <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-2 lg:min-h-[220px]">
                  <AnimatePresence initial={false}>
                    {list.map((order) => (
                      <motion.button
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => setSelected(order)}
                        className="surface surface-hover p-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-white">#{order.number}</p>
                          <span className="text-[10px] text-white/30">{relativeTime(order.createdAt)}</span>
                        </div>
                        <p className="mt-1 truncate text-[12.5px] text-white/65">{order.customerName}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-[13px] font-semibold text-[rgb(var(--brand-200))]">
                            {brl(order.total)}
                          </span>
                          <Badge>{order.deliveryType === 'entrega' ? 'Entrega' : 'Retirada'}</Badge>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>

                  {list.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-white/20">Nenhum pedido aqui</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OrderDetailModal
        order={selected}
        businessName={businessName}
        onClose={() => setSelected(null)}
        onChangeStatus={changeStatus}
        pending={pending}
      />
    </>
  );
}

function OrderDetailModal({
  order,
  businessName,
  onClose,
  onChangeStatus,
  pending,
}: {
  order: Order | null;
  businessName: string;
  onClose: () => void;
  onChangeStatus: (order: Order, status: OrderStatus) => void;
  pending: boolean;
}) {
  const flowIndex = order ? ORDER_FLOW.indexOf(order.status as OrderStatus) : -1;
  const nextStatus =
    order && flowIndex >= 0 && flowIndex < ORDER_FLOW.length - 1 ? ORDER_FLOW[flowIndex + 1] : null;

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={order ? `Pedido #${order.number}` : undefined}
      description={order ? formatDateTime(order.createdAt) : undefined}
      size="md"
      footer={
        order ? (
          <>
            {order.status !== 'cancelado' && order.status !== 'concluido' && (
              <Button variant="danger" onClick={() => onChangeStatus(order, 'cancelado')} loading={pending}>
                <X className="h-4 w-4" />
                Cancelar pedido
              </Button>
            )}
            {nextStatus && (
              <Button onClick={() => onChangeStatus(order, nextStatus)} loading={pending}>
                Avançar para {ORDER_STATUS[nextStatus].label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : null
      }
    >
      {!order ? null : (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={order.status === 'cancelado' ? 'danger' : 'purple'}>{ORDER_STATUS[order.status as OrderStatus]?.label}</Badge>
          <Badge>{order.deliveryType === 'entrega' ? 'Entrega' : 'Retirada no local'}</Badge>
          <Badge>{order.paymentMethod === 'pix' ? 'Pix' : order.paymentMethod === 'cartao' ? 'Cartão' : 'Dinheiro'}</Badge>
          {order.source === 'publico' && <Badge tone="info">Página pública</Badge>}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">Cliente</p>
          <p className="text-[14px] font-medium text-white">{order.customerName}</p>
          <p className="mt-0.5 text-[12.5px] text-white/45">{order.customerPhone}</p>
          {order.deliveryType === 'entrega' && order.address && (
            <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] text-white/45">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {order.address}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">Itens</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.02] p-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] text-white/85">
                    {item.quantity}x {item.name}
                  </p>
                  {item.addons.length > 0 && (
                    <p className="mt-0.5 text-[11px] text-white/35">+ {item.addons.map((a) => a.name).join(', ')}</p>
                  )}
                  {item.notes && <p className="mt-0.5 text-[11px] italic text-white/35">{item.notes}</p>}
                </div>
                <span className="shrink-0 text-[13px] font-medium text-white">{brl(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Observações</p>
            <p className="mt-1.5 text-[13px] text-white/65">{order.notes}</p>
          </div>
        )}

        <div className="space-y-1.5 border-t border-white/[0.06] pt-4">
          <div className="flex justify-between text-[13px]">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white/85">{brl(order.subtotal)}</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between text-[13px]">
              <span className="text-white/50">Taxa de entrega</span>
              <span className="text-white/85">{brl(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-end justify-between pt-1">
            <span className="text-[13px] font-medium text-white/70">Total</span>
            <span className="font-display text-[20px] font-semibold text-white">{brl(order.total)}</span>
          </div>
        </div>

        <WhatsAppSend
          phone={order.customerPhone}
          message={orderMessage({
            customerName: order.customerName,
            number: order.number,
            total: order.total,
            businessName,
          })}
          label="Falar com o cliente"
          fullWidth
        />
      </div>
      )}
    </Modal>
  );
}
