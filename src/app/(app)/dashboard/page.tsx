import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Instagram,
  Link2,
  MessageCircle,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Card, CardHeader, StatCard } from '@/components/ui/card';
import { SalesAreaChart } from '@/components/ui/chart';
import { FadeIn } from '@/components/ui/misc';
import { APPOINTMENT_STATUS } from '@/lib/constants';
import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  addDays,
  appUrl,
  brl,
  endOfDay,
  endOfMonth,
  formatTime,
  greeting,
  relativeTime,
  startOfDay,
  startOfMonth,
} from '@/lib/utils';
import { appointmentMessage } from '@/lib/whatsapp';

import { TodayTasks } from './today-tasks';

export const metadata: Metadata = { title: 'Dashboard' };

const ACTIVITY_ICONS: Record<string, { icon: typeof FileText; tone: string }> = {
  'customer.created': { icon: UserPlus, tone: 'text-sky-300 border-sky-500/20 bg-sky-500/10' },
  'quote.approved': { icon: CheckCircle2, tone: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' },
  'quote.sent': { icon: FileText, tone: 'text-[rgb(var(--brand-200))] border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)]' },
  'quote.created': { icon: FileText, tone: 'text-[rgb(var(--brand-200))] border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)]' },
  'order.created': { icon: ShoppingBag, tone: 'text-amber-300 border-amber-500/20 bg-amber-500/10' },
  'order.updated': { icon: Package, tone: 'text-amber-300 border-amber-500/20 bg-amber-500/10' },
  'appointment.created': { icon: Calendar, tone: 'text-[rgb(var(--brand-200))] border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)]' },
  'deal.moved': { icon: TrendingUp, tone: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' },
  'ai.generated': { icon: Sparkles, tone: 'text-[rgb(var(--brand-200))] border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)]' },
  'subscription.activated': { icon: CheckCircle2, tone: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' },
};

export default async function DashboardPage() {
  const { user, business, plan } = await requireBusiness();
  const businessId = business.id;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(addDays(monthStart, -1));
  const prevMonthEnd = endOfMonth(addDays(monthStart, -1));
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    monthOrders,
    monthQuotesApproved,
    prevOrders,
    prevQuotesApproved,
    quotesSentCount,
    prevQuotesSentCount,
    customersCount,
    newCustomersMonth,
    todayAppointments,
    activities,
    tasks,
    pendingQuotes,
    newOrders,
    salesHistory,
  ] = await Promise.all([
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
    db.quote.count({ where: { businessId, sentAt: { gte: monthStart, lte: monthEnd } } }),
    db.quote.count({ where: { businessId, sentAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),
    db.customer.count({ where: { businessId } }),
    db.customer.count({ where: { businessId, createdAt: { gte: monthStart } } }),
    db.appointment.findMany({
      where: { businessId, startsAt: { gte: todayStart, lte: todayEnd }, status: { not: 'cancelado' } },
      orderBy: { startsAt: 'asc' },
      include: { customer: { select: { name: true, phone: true } }, service: { select: { name: true } } },
    }),
    db.activity.findMany({ where: { businessId }, orderBy: { createdAt: 'desc' }, take: 7 }),
    db.task.findMany({
      where: { businessId, OR: [{ done: false }, { doneAt: { gte: todayStart } }] },
      orderBy: [{ done: 'asc' }, { dueAt: 'asc' }],
      take: 8,
      include: { customer: { select: { name: true } } },
    }),
    db.quote.count({ where: { businessId, status: 'enviado' } }),
    db.order.count({ where: { businessId, status: 'novo' } }),
    // Últimos 6 meses de faturamento (pedidos + orçamentos aprovados)
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
          value: Math.round((orders._sum.total ?? 0) + (quotes._sum.total ?? 0)),
        };
      }),
    ),
  ]);

  const revenueMonth = (monthOrders._sum.total ?? 0) + (monthQuotesApproved._sum.total ?? 0);
  const revenuePrev = (prevOrders._sum.total ?? 0) + (prevQuotesApproved._sum.total ?? 0);
  const revenueDelta = revenuePrev > 0 ? Math.round(((revenueMonth - revenuePrev) / revenuePrev) * 100) : null;
  const quotesDelta =
    prevQuotesSentCount > 0 ? Math.round(((quotesSentCount - prevQuotesSentCount) / prevQuotesSentCount) * 100) : null;

  const publicCatalog = `${appUrl()}/catalogo/${business.slug}`;
  const publicBooking = `${appUrl()}/agendar/${business.slug}`;

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
            {greeting(user.name)} 👋
          </h1>
          <p className="mt-1.5 text-sm text-white/45">
            {todayAppointments.length > 0
              ? `Você tem ${todayAppointments.length} ${todayAppointments.length === 1 ? 'atendimento' : 'atendimentos'} hoje.`
              : 'Nenhum atendimento marcado para hoje.'}
            {pendingQuotes > 0 && ` ${pendingQuotes} ${pendingQuotes === 1 ? 'orçamento aguarda' : 'orçamentos aguardam'} resposta.`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/orcamentos/novo" size="sm">
            <FileText className="h-3.5 w-3.5" />
            Novo orçamento
          </ButtonLink>
          <ButtonLink href="/ia" variant="subtle" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Criar conteúdo
          </ButtonLink>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Vendas do mês"
          value={brl(revenueMonth)}
          delta={revenueDelta != null ? { value: `${revenueDelta}%`, positive: revenueDelta >= 0 } : undefined}
          hint={`${monthOrders._count} pedidos · ${monthQuotesApproved._count} orçamentos aprovados`}
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0}
        />
        <StatCard
          label="Orçamentos enviados"
          value={String(quotesSentCount)}
          delta={quotesDelta != null ? { value: `${quotesDelta}%`, positive: quotesDelta >= 0 } : undefined}
          hint={pendingQuotes > 0 ? `${pendingQuotes} aguardando resposta` : 'Nenhum pendente'}
          icon={<FileText className="h-4 w-4" />}
          delay={0.06}
        />
        <StatCard
          label="Clientes"
          value={String(customersCount)}
          delta={newCustomersMonth > 0 ? { value: String(newCustomersMonth), positive: true } : undefined}
          hint={
            plan.limits.maxCustomers > 0
              ? `${customersCount} de ${plan.limits.maxCustomers} do plano ${plan.name}`
              : `${newCustomersMonth} novos neste mês`
          }
          icon={<Users className="h-4 w-4" />}
          delay={0.12}
        />
        <StatCard
          label="Agendamentos hoje"
          value={String(todayAppointments.length)}
          hint={newOrders > 0 ? `${newOrders} pedidos novos no catálogo` : 'Nenhum pedido novo'}
          icon={<Calendar className="h-4 w-4" />}
          delay={0.18}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Gráfico */}
        <FadeIn className="lg:col-span-2" delay={0.05}>
          <Card>
            <CardHeader
              title="Vendas dos últimos 6 meses"
              description="Pedidos do catálogo somados aos orçamentos aprovados"
              icon={<TrendingUp className="h-4 w-4" />}
              action={
                <Link
                  href="/financeiro"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))]"
                >
                  Ver relatório
                  <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            <SalesAreaChart data={salesHistory} />
          </Card>
        </FadeIn>

        {/* Agenda de hoje */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader
              title="Agenda de hoje"
              description={new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(now)}
              icon={<Clock className="h-4 w-4" />}
              action={
                <Link
                  href="/agenda"
                  className="text-[12px] font-semibold text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))]"
                >
                  Ver agenda
                </Link>
              }
            />

            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Calendar className="mb-3 h-8 w-8 text-white/15" />
                <p className="text-[13px] text-white/45">Nenhum horário marcado para hoje.</p>
                <ButtonLink href="/agenda?novo=1" variant="subtle" size="sm" className="mt-4">
                  Criar compromisso
                </ButtonLink>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
                  >
                    <div className="w-11 shrink-0 text-center">
                      <p className="font-display text-[13px] font-semibold text-white">
                        {formatTime(appointment.startsAt)}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-white">
                        {appointment.customer?.name ?? appointment.guestName ?? appointment.title}
                      </p>
                      <p className="truncate text-[11px] text-white/40">
                        {appointment.service?.name ?? appointment.title}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} map={APPOINTMENT_STATUS} />
                    {(appointment.customer?.phone || appointment.guestPhone) && (
                      <WhatsAppSend
                        phone={appointment.customer?.phone ?? appointment.guestPhone}
                        message={appointmentMessage({
                          customerName: appointment.customer?.name ?? appointment.guestName,
                          serviceName: appointment.service?.name,
                          startsAt: appointment.startsAt,
                          businessName: business.name,
                        })}
                        size="icon-sm"
                        variant="ghost"
                        iconOnly
                        label="Confirmar pelo WhatsApp"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </FadeIn>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Atividades recentes */}
        <FadeIn className="lg:col-span-2" delay={0.15}>
          <Card>
            <CardHeader
              title="Atividades recentes"
              description="Tudo que aconteceu no seu negócio"
              icon={<Clock className="h-4 w-4" />}
            />

            {activities.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-white/40">
                Assim que você começar a usar os módulos, o histórico aparece aqui.
              </p>
            ) : (
              <ol className="relative space-y-4 pl-1">
                {activities.map((activity, i) => {
                  const meta = ACTIVITY_ICONS[activity.type] ?? {
                    icon: Sparkles,
                    tone: 'text-white/50 border-white/10 bg-white/[0.04]',
                  };
                  const Icon = meta.icon;
                  return (
                    <li key={activity.id} className="relative flex gap-3.5">
                      {i < activities.length - 1 && (
                        <span className="absolute left-[17px] top-9 h-[calc(100%-14px)] w-px bg-white/[0.06]" />
                      )}
                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-[13.5px] font-medium leading-snug text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="mt-0.5 truncate text-[12px] text-white/45">{activity.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 pt-1.5 text-[11px] text-white/25">
                        {relativeTime(activity.createdAt)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </FadeIn>

        {/* Tarefas + links públicos */}
        <div className="space-y-4">
          <FadeIn delay={0.2}>
            <TodayTasks
              tasks={tasks.map((t) => ({
                id: t.id,
                title: t.title,
                done: t.done,
                priority: t.priority,
                dueAt: t.dueAt,
                customerName: t.customer?.name ?? null,
              }))}
            />
          </FadeIn>

          <FadeIn delay={0.25}>
            <Card>
              <CardHeader title="Suas páginas públicas" icon={<Link2 className="h-4 w-4" />} />
              <div className="space-y-2.5">
                <PublicLink
                  label="Catálogo online"
                  href={`/catalogo/${business.slug}`}
                  url={publicCatalog}
                  icon={<ShoppingBag className="h-4 w-4" />}
                />
                <PublicLink
                  label="Página de agendamento"
                  href={`/agendar/${business.slug}`}
                  url={publicBooking}
                  icon={<Calendar className="h-4 w-4" />}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <WhatsAppSend
                  message={`Olá! Esse é o nosso catálogo completo, dá uma olhada: ${publicCatalog}`}
                  label="Enviar catálogo"
                  size="sm"
                />
                {business.instagram && (
                  <a
                    href={`https://instagram.com/${business.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 text-[13px] font-medium text-white/75 transition hover:bg-white/[0.1]"
                  >
                    <Instagram className="h-3.5 w-3.5" />
                    {business.instagram}
                  </a>
                )}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </>
  );
}

function PublicLink({
  label,
  href,
  url,
  icon,
}: {
  label: string;
  href: string;
  url: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-[rgb(var(--brand-500)/0.25)] hover:bg-[rgb(var(--brand-500))]/[0.06]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-white">{label}</span>
        <span className="block truncate text-[11px] text-white/35">{url.replace(/^https?:\/\//, '')}</span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/25 transition group-hover:text-[rgb(var(--brand-300))]" />
    </a>
  );
}
