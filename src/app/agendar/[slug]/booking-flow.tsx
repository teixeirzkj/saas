'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Instagram,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';

import { Logo, LogoMark } from '@/components/shared/logo';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { WEEKDAYS, WEEKDAYS_LONG, MONTHS } from '@/lib/constants';
import {
  addDays,
  addMinutes,
  brl,
  cn,
  formatLongDate,
  isoDate,
  minutesToTime,
  startOfDay,
  timeToMinutes,
} from '@/lib/utils';
import { bookingMessage, waLink } from '@/lib/whatsapp';

import { createPublicBooking } from './actions';

type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  color: string;
};

type Business = {
  name: string;
  slug: string;
  logoUrl: string | null;
  about: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  whatsapp: string | null;
  instagram: string | null;
  workdayStart: string;
  workdayEnd: string;
  workdays: number[];
  slotMin: number;
};

const STEPS = ['Serviço', 'Data', 'Horário', 'Seus dados'];

export function BookingFlow({
  business,
  services,
  busy,
  bookingCta = 'Confirmar agendamento',
}: {
  business: Business;
  services: Service[];
  busy: { start: string; end: string }[];
  bookingCta?: string;
}) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [done, setDone] = useState<{ startsAt: string; serviceName: string; name: string; phone: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { error } = useToast();

  const service = services.find((s) => s.id === serviceId) ?? null;

  const busyRanges = useMemo(
    () => busy.map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() })),
    [busy],
  );

  /** Horários livres do dia escolhido, respeitando duração do serviço e janela de trabalho. */
  const slots = useMemo(() => {
    if (!date || !service) return [];

    const dayStart = new Date(`${date}T00:00:00`);
    const openMin = timeToMinutes(business.workdayStart);
    const closeMin = timeToMinutes(business.workdayEnd);
    const now = Date.now();
    const result: { time: string; available: boolean }[] = [];

    for (let minute = openMin; minute + service.durationMin <= closeMin; minute += business.slotMin) {
      const start = addMinutes(dayStart, minute);
      const end = addMinutes(start, service.durationMin);
      const startMs = start.getTime();

      const overlaps = busyRanges.some((range) => startMs < range.end && end.getTime() > range.start);
      const inPast = startMs < now;

      result.push({ time: minutesToTime(minute), available: !overlaps && !inPast });
    }

    return result;
  }, [date, service, business.workdayStart, business.workdayEnd, business.slotMin, busyRanges]);

  const availableCount = slots.filter((s) => s.available).length;

  // Calendário do mês, apenas dias úteis futuros
  const monthCells = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const gridStart = addDays(startOfDay(first), -first.getDay());
    const today = startOfDay(new Date());

    return Array.from({ length: 42 }).map((_, i) => {
      const day = addDays(gridStart, i);
      const inMonth = day.getMonth() === monthCursor.getMonth();
      const isPast = day < today;
      const isWorkday = business.workdays.includes(day.getDay());
      const withinRange = day <= addDays(today, 60);

      return {
        date: day,
        key: isoDate(day),
        inMonth,
        selectable: inMonth && !isPast && isWorkday && withinRange,
      };
    });
  }, [monthCursor, business.workdays]);

  const submit = (formData: FormData) => {
    if (!serviceId || !date || !time) return;

    formData.set('slug', business.slug);
    formData.set('serviceId', serviceId);
    formData.set('date', date);
    formData.set('time', time);

    const name = String(formData.get('name') ?? '');
    const phone = String(formData.get('phone') ?? '');

    startTransition(async () => {
      const result = await createPublicBooking(formData);

      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) {
        setErrors({});
        return error('Não foi possível agendar', result.error);
      }

      setErrors({});
      if (result.appointment) {
        setDone({
          startsAt: result.appointment.startsAt,
          serviceName: result.appointment.serviceName,
          name,
          phone,
        });
      }
    });
  };

  // ---------------------------------------------------------------- confirmação

  if (done) {
    const startsAt = new Date(done.startsAt);
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="surface w-full max-w-md p-7 text-center sm:p-8"
        >
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"
          >
            <span className="absolute inset-0 animate-pulse-glow rounded-2xl bg-emerald-500/20 blur-xl" />
            <CheckCircle2 className="relative h-7 w-7 text-emerald-300" />
          </motion.span>

          <h1 className="font-display text-[24px] font-semibold leading-tight text-white">Horário reservado!</h1>
          <p className="mt-2.5 text-sm leading-relaxed text-white/50">
            {business.name} recebeu seu agendamento e vai confirmar com você.
          </p>

          <div className="mt-6 space-y-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left">
            <Row label="Serviço" value={done.serviceName} />
            <Row label="Data" value={formatLongDate(startsAt)} />
            <Row
              label="Horário"
              value={startsAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            />
            <Row label="Nome" value={done.name} />
          </div>

          {business.whatsapp && (
            <ButtonAnchor
              href={waLink(
                business.whatsapp,
                bookingMessage({
                  businessName: business.name,
                  customerName: done.name,
                  serviceName: done.serviceName,
                  startsAt,
                  phone: done.phone,
                }),
              )}
              variant="whatsapp"
              size="lg"
              fullWidth
              className="mt-6"
            >
              Confirmar pelo WhatsApp
            </ButtonAnchor>
          )}

          <button
            onClick={() => {
              setDone(null);
              setStep(0);
              setServiceId(null);
              setDate(null);
              setTime(null);
            }}
            className="mt-4 text-[13px] font-medium text-white/40 transition hover:text-white"
          >
            Fazer outro agendamento
          </button>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------- fluxo

  return (
    <div className="min-h-screen">
      {/* Cabeçalho do negócio */}
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 animate-pulse-glow rounded-full bg-[rgb(var(--brand-600)/0.2)] blur-[100px]" />

        <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-start gap-4">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={business.name}
                className="h-14 w-14 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <LogoMark className="h-14 w-14" />
            )}

            <div className="min-w-0">
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-white sm:text-[26px]">
                {business.name}
              </h1>
              {business.about && (
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/50">{business.about}</p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-white/40">
                {business.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[business.address, business.city].filter(Boolean).join(' · ')}
                  </span>
                )}
                {business.instagram && (
                  <span className="flex items-center gap-1.5">
                    <Instagram className="h-3.5 w-3.5" />
                    {business.instagram}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {/* Progresso */}
        <div className="mb-7 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div className="flex-1">
                <div
                  className={cn(
                    'h-1 rounded-full transition-all duration-500',
                    i <= step ? 'bg-gradient-to-r from-[rgb(var(--brand-500))] to-[rgb(var(--brand-300))]' : 'bg-white/[0.07]',
                  )}
                />
                <p
                  className={cn(
                    'mt-2 text-[10.5px] font-medium transition-colors',
                    i <= step ? 'text-[rgb(var(--brand-200))]' : 'text-white/25',
                  )}
                >
                  {i + 1}. {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* Passo 1: serviço */}
          {step === 0 && (
            <motion.section
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display text-[19px] font-semibold text-white">Qual serviço você quer?</h2>
              <p className="mt-1.5 text-sm text-white/45">Escolha uma opção para ver os horários livres.</p>

              <div className="mt-5 space-y-2.5">
                {services.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setServiceId(option.id);
                      setStep(1);
                    }}
                    className={cn(
                      'surface surface-hover flex w-full items-center gap-4 p-4 text-left',
                      serviceId === option.id && 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500))]/[0.07]',
                    )}
                  >
                    <span
                      className="h-10 w-1 shrink-0 rounded-full"
                      style={{ background: option.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-medium text-white">{option.name}</span>
                      {option.description && (
                        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-white/45">
                          {option.description}
                        </span>
                      )}
                      <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/35">
                        <Clock className="h-3 w-3" />
                        {option.durationMin} minutos
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-display text-[16px] font-semibold text-white">
                        {brl(option.price)}
                      </span>
                      <ChevronRight className="ml-auto mt-1 h-4 w-4 text-white/25" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* Passo 2: data */}
          {step === 1 && (
            <motion.section
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display text-[19px] font-semibold text-white">Escolha o dia</h2>
              <p className="mt-1.5 text-sm text-white/45">
                {service?.name} · {service?.durationMin} minutos
              </p>

              <div className="surface mt-5 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Mês anterior"
                    onClick={() =>
                      setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <p className="text-[14px] font-medium text-white">
                    {MONTHS[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                  </p>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Próximo mês"
                    onClick={() =>
                      setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-white/30"
                    >
                      {day}
                    </div>
                  ))}

                  {monthCells.map((cell) => (
                    <button
                      key={cell.key}
                      disabled={!cell.selectable}
                      onClick={() => {
                        setDate(cell.key);
                        setTime(null);
                        setStep(2);
                      }}
                      className={cn(
                        'flex h-11 items-center justify-center rounded-xl text-[13.5px] font-medium transition-all sm:h-12',
                        !cell.inMonth && 'opacity-0',
                        cell.selectable
                          ? 'border border-white/[0.07] bg-white/[0.02] text-white/80 hover:border-[rgb(var(--brand-500)/0.4)] hover:bg-[rgb(var(--brand-500))]/[0.1] hover:text-white'
                          : 'cursor-not-allowed text-white/15',
                        date === cell.key && 'border-[rgb(var(--brand-400)/0.6)] bg-[rgb(var(--brand-500)/0.25)] text-white',
                      )}
                    >
                      {cell.date.getDate()}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-center text-[11px] text-white/30">
                  Atendemos {business.workdays.map((d) => WEEKDAYS[d]).join(', ')} · {business.workdayStart} às{' '}
                  {business.workdayEnd}
                </p>
              </div>
            </motion.section>
          )}

          {/* Passo 3: horário */}
          {step === 2 && date && (
            <motion.section
              key="time"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display text-[19px] font-semibold text-white">Escolha o horário</h2>
              <p className="mt-1.5 text-sm text-white/45">
                {WEEKDAYS_LONG[new Date(`${date}T12:00:00`).getDay()]}, {formatLongDate(new Date(`${date}T12:00:00`))}
              </p>

              {availableCount === 0 ? (
                <div className="surface mt-5 px-6 py-12 text-center">
                  <Calendar className="mx-auto mb-3 h-8 w-8 text-white/15" />
                  <p className="text-[14px] font-medium text-white">Nenhum horário livre neste dia</p>
                  <p className="mt-1.5 text-[13px] text-white/45">Escolha outra data para ver as opções.</p>
                  <Button variant="secondary" className="mt-5" onClick={() => setStep(1)}>
                    Escolher outra data
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => {
                          setTime(slot.time);
                          setStep(3);
                        }}
                        className={cn(
                          'h-12 rounded-xl border text-[14px] font-medium transition-all',
                          slot.available
                            ? 'border-white/[0.08] bg-white/[0.03] text-white/85 hover:border-[rgb(var(--brand-500)/0.45)] hover:bg-[rgb(var(--brand-500))]/[0.12] hover:text-white'
                            : 'cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-white/15 line-through',
                          time === slot.time && 'border-[rgb(var(--brand-400)/0.6)] bg-[rgb(var(--brand-500)/0.25)] text-white',
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-[11.5px] text-white/30">
                    {availableCount} {availableCount === 1 ? 'horário disponível' : 'horários disponíveis'} neste dia
                  </p>
                </>
              )}
            </motion.section>
          )}

          {/* Passo 4: dados */}
          {step === 3 && service && date && time && (
            <motion.section
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display text-[19px] font-semibold text-white">Só falta seu contato</h2>
              <p className="mt-1.5 text-sm text-white/45">Confira o resumo e finalize o agendamento.</p>

              <div className="surface mt-5 space-y-2.5 p-4">
                <Row label="Serviço" value={service.name} />
                <Row label="Data" value={formatLongDate(new Date(`${date}T12:00:00`))} />
                <Row label="Horário" value={`${time} · ${service.durationMin} min`} />
                <div className="h-px bg-white/[0.07]" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/70">Valor</span>
                  <span className="font-display text-[19px] font-semibold text-white">{brl(service.price)}</span>
                </div>
              </div>

              <form action={submit} className="mt-5 space-y-4">
                <Input
                  label="Seu nome"
                  name="name"
                  placeholder="Nome completo"
                  error={errors.name}
                  required
                  autoFocus
                />
                <Input
                  label="Seu telefone (WhatsApp)"
                  name="phone"
                  inputMode="tel"
                  placeholder="(11) 98765-4321"
                  hint="Usamos apenas para confirmar seu horário."
                  error={errors.phone}
                  required
                />
                <Textarea
                  label="Alguma observação?"
                  name="notes"
                  placeholder="Opcional"
                  rows={2}
                  error={errors.notes}
                />

                <Button type="submit" size="lg" fullWidth loading={pending}>
                  <Sparkles className="h-4 w-4" />
                  {bookingCta}
                </Button>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-white/[0.06] pt-6">
          <Logo href="/" size="sm" />
          <p className="text-[11px] text-white/25">Agendamento online por NEXO</p>
        </footer>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[12.5px] text-white/45">{label}</span>
      <span className="text-right text-[13px] font-medium text-white">{value}</span>
    </div>
  );
}
