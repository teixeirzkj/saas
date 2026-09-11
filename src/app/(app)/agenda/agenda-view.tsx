'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Plus,
  Scissors,
  Settings2,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { APPOINTMENT_STATUS, MONTHS, WEEKDAYS } from '@/lib/constants';
import { addDays, brl, cn, formatTime, isoDate, startOfDay, startOfWeek } from '@/lib/utils';
import { appointmentMessage } from '@/lib/whatsapp';

import { AppointmentModal } from './appointment-modal';
import { ServicesPanel } from './services-panel';

export type Appointment = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  notes: string | null;
  source: string;
  guestName: string | null;
  guestPhone: string | null;
  reminderSentAt: Date | null;
  customerId: string | null;
  serviceId: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  service: { id: string; name: string; color: string; durationMin: number } | null;
};

export type Service = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  color: string;
  active: boolean;
  description: string | null;
};

type View = 'dia' | 'semana' | 'mes';

export function AgendaView({
  businessName,
  slug,
  appUrl,
  bookingEnabled,
  template,
  referenceDate,
  initialView,
  openNew,
  presetCustomerId,
  appointments,
  services,
  customers,
}: {
  businessName: string;
  slug: string;
  appUrl: string;
  bookingEnabled: boolean;
  template: string | null;
  referenceDate: string;
  initialView: View;
  openNew: boolean;
  presetCustomerId?: string;
  appointments: Appointment[];
  services: Service[];
  customers: { id: string; name: string; phone: string | null }[];
}) {
  const router = useRouter();
  const { success } = useToast();
  const [view, setView] = useState<View>(initialView);
  const [cursor, setCursor] = useState(() => new Date(`${referenceDate}T12:00:00`));
  const [modal, setModal] = useState<{ open: boolean; appointment?: Appointment; date?: Date }>({
    open: openNew,
    date: openNew ? new Date() : undefined,
  });
  const [servicesOpen, setServicesOpen] = useState(false);

  const bookingUrl = `${appUrl}/agendar/${slug}`;

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const key = isoDate(new Date(appointment.startsAt));
      const list = map.get(key) ?? [];
      list.push(appointment);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const move = (direction: 1 | -1) => {
    setCursor((current) => {
      if (view === 'dia') return addDays(current, direction);
      if (view === 'semana') return addDays(current, direction * 7);
      return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    });
  };

  const goToday = () => setCursor(new Date());

  const periodLabel = useMemo(() => {
    if (view === 'dia') {
      return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(cursor);
    }
    if (view === 'semana') {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      const sameMonth = start.getMonth() === end.getMonth();
      return sameMonth
        ? `${start.getDate()} – ${end.getDate()} de ${MONTHS[start.getMonth()]}`
        : `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
    }
    return `${MONTHS[cursor.getMonth()]} de ${cursor.getFullYear()}`;
  }, [cursor, view]);

  const activeServices = services.filter((s) => s.active);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Organize seus horários e deixe o cliente agendar sozinho."
        action={
          <>
            <Button variant="secondary" onClick={() => setServicesOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Serviços
              <Badge className="ml-1">{activeServices.length}</Badge>
            </Button>
            <Button onClick={() => setModal({ open: true, date: cursor })}>
              <Plus className="h-4 w-4" />
              Novo compromisso
            </Button>
          </>
        }
      >
        {/* Link público */}
        <Card className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
                <Link2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white">
                  Sua página de agendamento
                  {!bookingEnabled && (
                    <Badge tone="warning" className="ml-2">
                      Desativada
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/40">{bookingUrl.replace(/^https?:\/\//, '')}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(bookingUrl);
                  success('Link copiado');
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </Button>
              <ButtonAnchor href={`/agendar/${slug}`} variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </ButtonAnchor>
              <WhatsAppSend
                message={`Olá! Você pode escolher o melhor horário direto por aqui: ${bookingUrl}`}
                label="Enviar link"
                size="sm"
              />
            </div>
          </div>
        </Card>

        {/* Navegação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button size="icon-sm" variant="secondary" onClick={() => move(-1)} aria-label="Período anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="icon-sm" variant="secondary" onClick={() => move(1)} aria-label="Próximo período">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={goToday}>
              Hoje
            </Button>
            <span className="ml-1 truncate text-[14px] font-medium capitalize text-white">{periodLabel}</span>
          </div>

          <Tabs
            size="sm"
            items={[
              { value: 'dia', label: 'Dia' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes', label: 'Mês' },
            ]}
            value={view}
            onChange={(v) => setView(v as View)}
            className="sm:w-auto"
          />
        </div>
      </PageHeader>

      {services.length === 0 ? (
        <EmptyState
          icon={<Scissors className="h-6 w-6" />}
          title="Cadastre seus serviços para começar"
          description="Com os serviços cadastrados, o NEXO calcula a duração de cada horário e monta sua página pública de agendamento."
          action={
            <Button onClick={() => setServicesOpen(true)}>
              <Plus className="h-4 w-4" />
              Cadastrar primeiro serviço
            </Button>
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'dia' && (
              <DayView
                date={cursor}
                appointments={byDay.get(isoDate(cursor)) ?? []}
                businessName={businessName}
                template={template}
                onCreate={(date) => setModal({ open: true, date })}
                onEdit={(appointment) => setModal({ open: true, appointment })}
              />
            )}

            {view === 'semana' && (
              <WeekView
                cursor={cursor}
                byDay={byDay}
                onCreate={(date) => setModal({ open: true, date })}
                onEdit={(appointment) => setModal({ open: true, appointment })}
                onSelectDay={(date) => {
                  setCursor(date);
                  setView('dia');
                }}
              />
            )}

            {view === 'mes' && (
              <MonthView
                cursor={cursor}
                byDay={byDay}
                onSelectDay={(date) => {
                  setCursor(date);
                  setView('dia');
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AppointmentModal
        open={modal.open}
        onClose={() => {
          setModal({ open: false });
          if (openNew) router.replace('/agenda');
        }}
        appointment={modal.appointment}
        defaultDate={modal.date}
        services={services}
        customers={customers}
        presetCustomerId={presetCustomerId}
        businessName={businessName}
        template={template}
      />

      <ServicesPanel open={servicesOpen} onClose={() => setServicesOpen(false)} services={services} />
    </>
  );
}

// ------------------------------------------------------------------ visualização: dia

function DayView({
  date,
  appointments,
  businessName,
  template,
  onCreate,
  onEdit,
}: {
  date: Date;
  appointments: Appointment[];
  businessName: string;
  template: string | null;
  onCreate: (date: Date) => void;
  onEdit: (appointment: Appointment) => void;
}) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  const totalValue = sorted
    .filter((a) => a.status !== 'cancelado')
    .reduce((sum) => sum, 0);

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<CalendarIcon className="h-6 w-6" />}
        title="Nenhum horário marcado neste dia"
        description="Aproveite para criar um compromisso ou compartilhar sua página de agendamento."
        action={
          <Button onClick={() => onCreate(date)}>
            <Plus className="h-4 w-4" />
            Criar compromisso
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((appointment, i) => (
        <motion.div
          key={appointment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'surface surface-hover flex gap-4 p-4',
            appointment.status === 'cancelado' && 'opacity-50',
          )}
        >
          {/* Faixa colorida do serviço */}
          <div
            className="w-1 shrink-0 rounded-full"
            style={{ background: appointment.service?.color ?? '#8B2FFF' }}
          />

          <div className="w-16 shrink-0 sm:w-20">
            <p className="font-display text-[15px] font-semibold text-white">{formatTime(appointment.startsAt)}</p>
            <p className="mt-0.5 text-[11px] text-white/35">até {formatTime(appointment.endsAt)}</p>
          </div>

          <button onClick={() => onEdit(appointment)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-[14px] font-medium text-white">
              {appointment.customer?.name ?? appointment.guestName ?? appointment.title}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-white/45">
              {appointment.service?.name ?? appointment.title}
            </p>
            {appointment.notes && (
              <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-white/30">{appointment.notes}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={appointment.status} map={APPOINTMENT_STATUS} />
              {appointment.source === 'publico' && <Badge tone="purple">Página pública</Badge>}
              {appointment.reminderSentAt && <Badge>Lembrete enviado</Badge>}
            </div>
          </button>

          <div className="flex shrink-0 flex-col gap-2">
            {(appointment.customer?.phone || appointment.guestPhone) && (
              <WhatsAppSend
                phone={appointment.customer?.phone ?? appointment.guestPhone}
                message={appointmentMessage({
                  template: template ?? undefined,
                  customerName: appointment.customer?.name ?? appointment.guestName,
                  serviceName: appointment.service?.name,
                  startsAt: new Date(appointment.startsAt),
                  businessName,
                })}
                size="icon-sm"
                variant="ghost"
                iconOnly
                label="Confirmar pelo WhatsApp"
              />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ visualização: semana

function WeekView({
  cursor,
  byDay,
  onCreate,
  onEdit,
  onSelectDay,
}: {
  cursor: Date;
  byDay: Map<string, Appointment[]>;
  onCreate: (date: Date) => void;
  onEdit: (appointment: Appointment) => void;
  onSelectDay: (date: Date) => void;
}) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const today = isoDate(new Date());

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
      {days.map((day) => {
        const key = isoDate(day);
        const items = (byDay.get(key) ?? []).sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
        const isToday = key === today;

        return (
          <div
            key={key}
            className={cn(
              'surface flex min-h-[168px] flex-col p-3',
              isToday && 'border-[rgb(var(--brand-500)/0.3)] bg-[rgb(var(--brand-500))]/[0.05]',
            )}
          >
            <button onClick={() => onSelectDay(day)} className="mb-2.5 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {WEEKDAYS[day.getDay()]}
              </p>
              <p
                className={cn(
                  'font-display text-[17px] font-semibold leading-none',
                  isToday ? 'text-[rgb(var(--brand-200))]' : 'text-white',
                )}
              >
                {day.getDate()}
              </p>
            </button>

            <div className="flex-1 space-y-1.5">
              {items.length === 0 ? (
                <button
                  onClick={() => onCreate(day)}
                  className="flex h-full min-h-[80px] w-full items-center justify-center rounded-lg border border-dashed border-white/[0.07] text-[11px] text-white/25 transition-all hover:border-[rgb(var(--brand-500)/0.3)] hover:text-[rgb(var(--brand-300))]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              ) : (
                items.map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={() => onEdit(appointment)}
                    className={cn(
                      'w-full rounded-lg border p-2 text-left transition-all hover:brightness-125',
                      appointment.status === 'cancelado' && 'opacity-45',
                    )}
                    style={{
                      borderColor: `${appointment.service?.color ?? '#8B2FFF'}33`,
                      background: `${appointment.service?.color ?? '#8B2FFF'}14`,
                    }}
                  >
                    <p className="text-[10.5px] font-semibold text-white/85">{formatTime(appointment.startsAt)}</p>
                    <p className="mt-0.5 truncate text-[11px] leading-snug text-white/65">
                      {appointment.customer?.name ?? appointment.guestName ?? appointment.title}
                    </p>
                    {appointment.service && (
                      <p className="truncate text-[10px] text-white/35">{appointment.service.name}</p>
                    )}
                  </button>
                ))
              )}
            </div>

            {items.length > 0 && (
              <button
                onClick={() => onCreate(day)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/[0.07] py-1.5 text-[10px] text-white/25 transition-all hover:border-[rgb(var(--brand-500)/0.3)] hover:text-[rgb(var(--brand-300))]"
              >
                <Plus className="h-3 w-3" />
                Adicionar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ visualização: mês

function MonthView({
  cursor,
  byDay,
  onSelectDay,
}: {
  cursor: Date;
  byDay: Map<string, Appointment[]>;
  onSelectDay: (date: Date) => void;
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const cells = Array.from({ length: 42 }).map((_, i) => addDays(gridStart, i));
  const today = isoDate(new Date());

  return (
    <Card className="p-3 sm:p-4">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white/30">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const key = isoDate(day);
          const items = byDay.get(key) ?? [];
          const active = items.filter((a) => a.status !== 'cancelado');
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = key === today;

          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={cn(
                'flex min-h-[62px] flex-col items-center rounded-lg border p-1.5 transition-all sm:min-h-[84px] sm:items-start sm:p-2',
                inMonth ? 'border-white/[0.05] bg-white/[0.015]' : 'border-transparent opacity-30',
                isToday && 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500))]/[0.08]',
                'hover:border-[rgb(var(--brand-500)/0.3)] hover:bg-[rgb(var(--brand-500))]/[0.06]',
              )}
            >
              <span
                className={cn(
                  'text-[12px] font-semibold',
                  isToday ? 'text-[rgb(var(--brand-200))]' : inMonth ? 'text-white/75' : 'text-white/40',
                )}
              >
                {day.getDate()}
              </span>

              {active.length > 0 && (
                <>
                  {/* Mobile: pontinhos. Desktop: primeiros títulos. */}
                  <span className="mt-1 flex gap-0.5 sm:hidden">
                    {active.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: a.service?.color ?? '#8B2FFF' }}
                      />
                    ))}
                  </span>

                  <span className="mt-1 hidden w-full space-y-0.5 sm:block">
                    {active.slice(0, 2).map((a) => (
                      <span
                        key={a.id}
                        className="block truncate rounded px-1 py-0.5 text-[9.5px] leading-tight"
                        style={{
                          background: `${a.service?.color ?? '#8B2FFF'}1f`,
                          color: a.service?.color ?? '#B48CFF',
                        }}
                      >
                        {formatTime(a.startsAt)} {a.customer?.name?.split(' ')[0] ?? a.guestName?.split(' ')[0] ?? ''}
                      </span>
                    ))}
                    {active.length > 2 && (
                      <span className="block px-1 text-[9px] text-white/35">+{active.length - 2} mais</span>
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
