'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  FileText,
  ListTodo,
  Mail,
  MapPin,
  Pencil,
  Plus,
  ShoppingBag,
  StickyNote,
  Trash2,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { useState, useTransition } from 'react';

import { createNote, deleteNote, toggleTask } from '@/app/(app)/actions';
import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Avatar } from '@/components/ui/misc';
import { ConfirmDialog } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import {
  APPOINTMENT_STATUS,
  CUSTOMER_STATUS,
  DEAL_STAGES,
  ORDER_STATUS,
  QUOTE_STATUS,
  SOURCES,
} from '@/lib/constants';
import { brl, cn, formatDate, formatDateTime, formatPhone, relativeTime } from '@/lib/utils';

import { deleteCustomer } from '../actions';
import { CustomerFormModal } from '../customer-form';

type Props = {
  businessName: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    company: string | null;
    document: string | null;
    address: string | null;
    notes: string | null;
    source: string | null;
    status: string;
    totalValue: number;
    createdAt: Date;
    lastActivityAt: Date | null;
  };
  quotes: { id: string; number: number; title: string; status: string; total: number; createdAt: Date }[];
  orders: { id: string; number: number; status: string; total: number; createdAt: Date; itemCount: number }[];
  appointments: { id: string; title: string; serviceName: string | null; startsAt: Date; status: string }[];
  deals: { id: string; title: string; stage: string; value: number }[];
  tasks: { id: string; title: string; done: boolean; dueAt: Date | null; priority: string }[];
  notes: { id: string; content: string; createdAt: Date; authorName: string | null }[];
};

export function CustomerDetail({
  businessName,
  customer,
  quotes,
  orders,
  appointments,
  deals,
  tasks,
  notes,
}: Props) {
  const [tab, setTab] = useState('historico');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { success, error } = useToast();

  const firstName = customer.name.split(' ')[0];
  const sourceLabel = SOURCES.find((s) => s.value === customer.source)?.label ?? customer.source;
  const openTasks = tasks.filter((t) => !t.done).length;

  const tabs = [
    { value: 'historico', label: 'Histórico', count: quotes.length + orders.length + appointments.length },
    { value: 'orcamentos', label: 'Orçamentos', count: quotes.length },
    { value: 'pedidos', label: 'Pedidos', count: orders.length },
    { value: 'agendamentos', label: 'Agendamentos', count: appointments.length },
    { value: 'notas', label: 'Notas', count: notes.length },
    { value: 'tarefas', label: 'Tarefas', count: openTasks },
  ];

  return (
    <>
      <Link
        href="/clientes"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todos os clientes
      </Link>

      {/* Cabeçalho do cliente */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="surface p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <Avatar name={customer.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-white">
                  {customer.name}
                </h1>
                <StatusBadge status={customer.status} map={CUSTOMER_STATUS} />
              </div>

              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-white/50">
                {customer.phone && <span>{formatPhone(customer.phone)}</span>}
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.company && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {customer.company}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.address}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {sourceLabel && <Badge tone="purple">Origem: {sourceLabel}</Badge>}
                <Badge>Cliente desde {formatDate(customer.createdAt, { month: 'short', year: 'numeric' })}</Badge>
                <Badge>Última atividade {relativeTime(customer.lastActivityAt)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {customer.phone && (
              <WhatsAppSend
                phone={customer.phone}
                message={`Olá, ${firstName}! Tudo bem? Aqui é da ${businessName}.`}
                label="Falar no WhatsApp"
              />
            )}
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button variant="ghost" size="icon" aria-label="Excluir cliente" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Resumo financeiro */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-4">
          <Metric label="Valor total" value={brl(customer.totalValue)} highlight />
          <Metric label="Orçamentos" value={String(quotes.length)} />
          <Metric label="Pedidos" value={String(orders.length)} />
          <Metric label="Agendamentos" value={String(appointments.length)} />
        </div>

        {customer.notes && (
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Observações do cadastro</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{customer.notes}</p>
          </div>
        )}
      </motion.div>

      {/* Ações rápidas */}
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href={`/orcamentos/novo?cliente=${customer.id}`} variant="subtle" size="sm">
          <FileText className="h-3.5 w-3.5" />
          Novo orçamento
        </ButtonLink>
        <ButtonLink href={`/agenda?novo=1&cliente=${customer.id}`} variant="subtle" size="sm">
          <Calendar className="h-3.5 w-3.5" />
          Agendar
        </ButtonLink>
        <ButtonLink href={`/crm?novo=1&cliente=${customer.id}`} variant="subtle" size="sm">
          <TrendingUp className="h-3.5 w-3.5" />
          Nova negociação
        </ButtonLink>
      </div>

      <div className="mt-5">
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        {tab === 'historico' && (
          <HistoryTab quotes={quotes} orders={orders} appointments={appointments} deals={deals} />
        )}

        {tab === 'orcamentos' && (
          <Card>
            <CardHeader title="Orçamentos" icon={<FileText className="h-4 w-4" />} />
            {quotes.length === 0 ? (
              <EmptyRow
                message="Nenhum orçamento para este cliente."
                actionLabel="Criar orçamento"
                href={`/orcamentos/novo?cliente=${customer.id}`}
              />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {quotes.map((quote) => (
                  <li key={quote.id}>
                    <Link
                      href={`/orcamentos/${quote.id}`}
                      className="flex items-center gap-3 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-white">
                          #{quote.number} · {quote.title}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-white/35">{formatDate(quote.createdAt)}</p>
                      </div>
                      <span className="font-display text-[14px] font-semibold text-white">{brl(quote.total)}</span>
                      <StatusBadge status={quote.status} map={QUOTE_STATUS} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'pedidos' && (
          <Card>
            <CardHeader title="Pedidos" icon={<ShoppingBag className="h-4 w-4" />} />
            {orders.length === 0 ? (
              <EmptyRow message="Nenhum pedido registrado para este cliente." />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {orders.map((order) => (
                  <li key={order.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-white">Pedido #{order.number}</p>
                      <p className="mt-0.5 text-[11.5px] text-white/35">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'itens'} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span className="font-display text-[14px] font-semibold text-white">{brl(order.total)}</span>
                    <StatusBadge status={order.status} map={ORDER_STATUS} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'agendamentos' && (
          <Card>
            <CardHeader title="Agendamentos" icon={<Calendar className="h-4 w-4" />} />
            {appointments.length === 0 ? (
              <EmptyRow
                message="Nenhum agendamento para este cliente."
                actionLabel="Agendar horário"
                href={`/agenda?novo=1&cliente=${customer.id}`}
              />
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {appointments.map((appointment) => (
                  <li key={appointment.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-white">
                        {appointment.serviceName ?? appointment.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-white/35">{formatDateTime(appointment.startsAt)}</p>
                    </div>
                    <StatusBadge status={appointment.status} map={APPOINTMENT_STATUS} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'notas' && (
          <Card>
            <CardHeader title="Notas internas" icon={<StickyNote className="h-4 w-4" />} />

            <NoteComposer customerId={customer.id} />

            {notes.length === 0 ? (
              <EmptyRow message="Nenhuma nota registrada ainda." />
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                    <p className="whitespace-pre-line text-[13px] leading-relaxed text-white/75">{note.content}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] text-white/30">
                        {note.authorName ? `${note.authorName} · ` : ''}
                        {formatDateTime(note.createdAt)}
                      </span>
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await deleteNote(note.id);
                            router.refresh();
                          })
                        }
                        className="text-[11px] font-medium text-white/25 opacity-0 transition group-hover:opacity-100 hover:text-red-300"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'tarefas' && (
          <Card>
            <CardHeader title="Tarefas" icon={<ListTodo className="h-4 w-4" />} />
            {tasks.length === 0 ? (
              <EmptyRow message="Nenhuma tarefa vinculada a este cliente." />
            ) : (
              <ul className="space-y-1.5">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          await toggleTask(task.id);
                          router.refresh();
                        })
                      }
                      className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all',
                          task.done ? 'border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-500))]' : 'border-white/20 bg-white/[0.04]',
                        )}
                      >
                        {task.done && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.4}>
                            <path d="M2 6.2 4.6 8.8 10 3.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[13px]', task.done ? 'text-white/30 line-through' : 'text-white/85')}>
                          {task.title}
                        </span>
                        {task.dueAt && (
                          <span className="mt-0.5 block text-[11px] text-white/30">
                            Prazo: {formatDate(task.dueAt)}
                          </span>
                        )}
                      </span>
                      {task.priority === 'alta' && !task.done && <Badge tone="danger">Alta</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Excluir ${customer.name}?`}
        description="Orçamentos, pedidos e agendamentos deixarão de estar vinculados a este cliente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir cliente"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteCustomer(customer.id);
            if (result.error) return error('Não foi possível excluir', result.error);
            success('Cliente excluído');
            router.push('/clientes');
          })
        }
      />
    </>
  );
}

/** Caixa de nova nota — vinculada ao cliente e visível para todo o time. */
function NoteComposer({ customerId }: { customerId: string }) {
  const [content, setContent] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { success, error } = useToast();

  const submit = () => {
    if (!content.trim()) return;
    const formData = new FormData();
    formData.set('content', content);
    formData.set('customerId', customerId);

    startTransition(async () => {
      const result = await createNote(formData);
      if (result.error) return error('Não foi possível salvar', result.error);
      setContent('');
      success('Nota adicionada');
      router.refresh();
    });
  };

  return (
    <div className="mb-5">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Registre uma preferência, um combinado, um detalhe importante..."
        rows={3}
      />
      <div className="mt-2.5 flex justify-end">
        <Button type="button" size="sm" loading={pending} disabled={!content.trim()} onClick={submit}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar nota
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-white/30">{label}</p>
      <p
        className={cn(
          'mt-1 font-display text-[19px] font-semibold',
          highlight ? 'text-[rgb(var(--brand-200))]' : 'text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyRow({
  message,
  actionLabel,
  href,
}: {
  message: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-[13px] text-white/40">{message}</p>
      {actionLabel && href && (
        <ButtonLink href={href} variant="subtle" size="sm" className="mt-4">
          {actionLabel}
        </ButtonLink>
      )}
    </div>
  );
}

/** Linha do tempo unificada: a prova visual de que os módulos compartilham dados. */
function HistoryTab({
  quotes,
  orders,
  appointments,
  deals,
}: {
  quotes: Props['quotes'];
  orders: Props['orders'];
  appointments: Props['appointments'];
  deals: Props['deals'];
}) {
  const events = [
    ...quotes.map((q) => ({
      id: `q-${q.id}`,
      date: q.createdAt,
      icon: FileText,
      title: `Orçamento #${q.number} · ${q.title}`,
      meta: brl(q.total),
      status: q.status,
      map: QUOTE_STATUS as Record<string, { label: string; tone: string }>,
      href: `/orcamentos/${q.id}`,
    })),
    ...orders.map((o) => ({
      id: `o-${o.id}`,
      date: o.createdAt,
      icon: ShoppingBag,
      title: `Pedido #${o.number}`,
      meta: brl(o.total),
      status: o.status,
      map: ORDER_STATUS as Record<string, { label: string; tone: string }>,
      href: '/catalogo/pedidos',
    })),
    ...appointments.map((a) => ({
      id: `a-${a.id}`,
      date: a.startsAt,
      icon: Calendar,
      title: a.serviceName ?? a.title,
      meta: formatDateTime(a.startsAt),
      status: a.status,
      map: APPOINTMENT_STATUS as Record<string, { label: string; tone: string }>,
      href: '/agenda',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Linha do tempo"
          description="Tudo que este cliente fez, em todos os módulos"
          icon={<Calendar className="h-4 w-4" />}
        />

        {events.length === 0 ? (
          <EmptyRow message="Este cliente ainda não tem histórico." />
        ) : (
          <ol className="space-y-4">
            {events.map((event, i) => {
              const Icon = event.icon;
              return (
                <li key={event.id} className="relative flex gap-3.5">
                  {i < events.length - 1 && (
                    <span className="absolute left-[17px] top-9 h-[calc(100%-14px)] w-px bg-white/[0.06]" />
                  )}
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <Link href={event.href} className="min-w-0 flex-1 pt-1">
                    <p className="truncate text-[13.5px] font-medium text-white">{event.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-white/40">{event.meta}</p>
                  </Link>
                  <div className="shrink-0 pt-1">
                    <StatusBadge status={event.status} map={event.map} />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card>
        <CardHeader title="Negociações" icon={<TrendingUp className="h-4 w-4" />} />
        {deals.length === 0 ? (
          <EmptyRow message="Nenhuma negociação no CRM." />
        ) : (
          <ul className="space-y-2.5">
            {deals.map((deal) => {
              const stage = DEAL_STAGES.find((s) => s.value === deal.stage);
              return (
                <li key={deal.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[13px] font-medium leading-snug text-white">{deal.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: `${stage?.color}20`, color: stage?.color }}
                    >
                      {stage?.label}
                    </span>
                    <span className="font-display text-[13px] font-semibold text-white">{brl(deal.value)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
