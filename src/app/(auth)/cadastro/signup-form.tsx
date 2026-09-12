'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Building2, Check, Mail, User } from 'lucide-react';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, PasswordInput, Select } from '@/components/ui/input';
import { SEGMENTS } from '@/lib/constants';
import { getPlan } from '@/lib/plans';

import { signupAction, type ActionState } from '../actions';

const initialState: ActionState = {};

const BENEFITS = ['7 dias de teste grátis', 'Pronto para usar em 2 minutos', 'Cancele quando quiser'];

export function SignupForm({ plan }: { plan?: string }) {
  const [state, action, pending] = useActionState(signupAction, initialState);
  const selectedPlan = plan && plan !== 'free' ? getPlan(plan) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white">
        Comece a organizar seu negócio
      </h1>
      <p className="mt-2 text-sm text-white/45">
        {selectedPlan
          ? `Crie sua conta para continuar com o plano ${selectedPlan.name}.`
          : 'Crie sua conta e teste grátis por 7 dias. Leva menos de 2 minutos.'}
      </p>

      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-[12px] text-white/50">
            <Check className="h-3.5 w-3.5 text-nexo-300" />
            {b}
          </li>
        ))}
      </ul>

      <form action={action} className="mt-7 space-y-4">
        {selectedPlan && <input type="hidden" name="plan" value={selectedPlan.code} />}

        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-[13px] text-red-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </motion.div>
        )}

        <Input
          label="Seu nome"
          name="name"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          icon={<User className="h-4 w-4" />}
          error={state.errors?.name}
          required
        />

        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@seunegocio.com"
          icon={<Mail className="h-4 w-4" />}
          error={state.errors?.email}
          required
        />

        <PasswordInput
          label="Senha"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          hint="Use ao menos 8 caracteres."
          error={state.errors?.password}
          required
        />

        <Input
          label="Nome do negócio"
          name="businessName"
          placeholder="Ex.: Studio Aurora"
          icon={<Building2 className="h-4 w-4" />}
          error={state.errors?.businessName}
          required
        />

        <Select
          label="Segmento"
          name="segment"
          defaultValue="outro"
          options={SEGMENTS.map((s) => ({ value: s.value, label: s.label }))}
          error={state.errors?.segment}
        />

        <Button type="submit" size="lg" fullWidth loading={pending}>
          Criar minha conta
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Ao criar a conta você concorda com os{' '}
          <Link href="/termos" className="text-white/50 underline decoration-white/20 hover:text-white/70">
            Termos de uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" className="text-white/50 underline decoration-white/20 hover:text-white/70">
            Política de privacidade
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        Já tem conta?{' '}
        <Link href="/login" className="font-semibold text-nexo-300 transition hover:text-nexo-200">
          Entrar
        </Link>
      </p>
    </motion.div>
  );
}
