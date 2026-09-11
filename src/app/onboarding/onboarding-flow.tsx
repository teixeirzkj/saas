'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Check,
  FileText,
  PartyPopper,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useActionState, useState } from 'react';

import { Logo, LogoMark } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GOALS, SEGMENTS } from '@/lib/constants';

import { completeOnboarding, type OnboardingState } from './actions';

const GOAL_ICONS: Record<string, typeof Users> = {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Sparkles,
};

const initialState: OnboardingState = {};

export function OnboardingFlow({
  userName,
  businessName: initialBusinessName,
  segment: initialSegment,
}: {
  userName: string;
  businessName: string;
  segment: string;
}) {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [segment, setSegment] = useState(initialSegment);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  const steps = ['Negócio', 'Segmento', 'Objetivos', 'Pronto'];

  const toggleGoal = (value: string) =>
    setGoals((set) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-pulse-glow rounded-full bg-nexo-600/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 animate-pulse-glow rounded-full bg-nexo-800/30 blur-[110px]" />

      <div className="relative w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo href={null} />
        </div>

        {/* Progresso */}
        <div className="mb-8 flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-all duration-500',
                  i <= step ? 'bg-gradient-to-r from-nexo-500 to-nexo-300' : 'bg-white/[0.07]',
                )}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="surface p-6 sm:p-8"
            >
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-nexo-500/25 bg-nexo-500/10 text-nexo-200">
                <Building2 className="h-5 w-5" />
              </span>
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                Olá, {userName.split(' ')[0]}! Qual é o nome do seu negócio?
              </h1>
              <p className="mt-2 text-[13.5px] text-white/45">
                É assim que seus clientes vão te reconhecer em todo o sistema.
              </p>

              <Input
                className="mt-6"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex.: Studio Aurora"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && businessName.trim() && setStep(1)}
              />

              <Button
                size="lg"
                fullWidth
                className="mt-6"
                disabled={!businessName.trim()}
                onClick={() => setStep(1)}
              >
                Continuar
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="surface p-6 sm:p-8"
            >
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                Qual é o seu segmento?
              </h1>
              <p className="mt-2 text-[13.5px] text-white/45">
                A NEXO se adapta ao seu negócio: cores, ícones e até a organização do
                painel mudam para combinar com o seu tipo de negócio.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {SEGMENTS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSegment(option.value)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border p-3.5 text-left text-[13.5px] font-medium transition-all',
                      segment === option.value
                        ? 'border-white/25 bg-white/[0.06] text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/15 hover:text-white/85',
                    )}
                    style={segment === option.value ? { borderColor: `${option.preview}80` } : undefined}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                      style={{ background: `${option.preview}22` }}
                    >
                      {option.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: option.preview }}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[11.5px] text-white/30">
                Você pode trocar isso depois em Configurações → Minha empresa, sem perder nenhum dado.
              </p>

              <div className="mt-6 flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  Voltar
                </Button>
                <Button fullWidth onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="surface p-6 sm:p-8"
            >
              <h1 className="font-display text-[24px] font-semibold leading-tight text-white">
                O que você mais precisa organizar?
              </h1>
              <p className="mt-2 text-[13.5px] text-white/45">Escolha quantas opções quiser.</p>

              <div className="mt-6 space-y-2.5">
                {GOALS.map((goal) => {
                  const Icon = GOAL_ICONS[goal.icon] ?? Sparkles;
                  const active = goals.has(goal.value);
                  return (
                    <button
                      key={goal.value}
                      onClick={() => toggleGoal(goal.value)}
                      className={cn(
                        'flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all',
                        active
                          ? 'border-nexo-500/40 bg-nexo-500/16'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                          active
                            ? 'border-nexo-400/40 bg-nexo-500/25 text-nexo-100'
                            : 'border-white/10 bg-white/[0.04] text-white/40',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className={cn('flex-1 text-[13.5px] font-medium', active ? 'text-white' : 'text-white/65')}>
                        {goal.label}
                      </span>
                      {active && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nexo-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button fullWidth onClick={() => setStep(3)}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="surface p-6 text-center sm:p-8"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-nexo-500/25 bg-nexo-500/10"
              >
                <span className="absolute inset-0 animate-pulse-glow rounded-2xl bg-nexo-500/20 blur-xl" />
                <PartyPopper className="relative h-7 w-7 text-nexo-200" />
              </motion.span>

              <h1 className="font-display text-[24px] font-semibold text-white">Tudo pronto.</h1>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/50">
                Vamos organizar o {businessName || 'seu negócio'}. Seu painel já está te esperando com tudo
                configurado.
              </p>

              {state.error && <p className="mt-4 text-[13px] text-red-300">{state.error}</p>}

              <form action={formAction} className="mt-7">
                <input type="hidden" name="businessName" value={businessName} />
                <input type="hidden" name="segment" value={segment} />
                {Array.from(goals).map((goal) => (
                  <input key={goal} type="hidden" name="goals" value={goal} />
                ))}
                <Button type="submit" size="lg" fullWidth loading={pending}>
                  Entrar no painel
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
