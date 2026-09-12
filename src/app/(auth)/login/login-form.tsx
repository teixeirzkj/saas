'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';

import { loginAction, type ActionState } from '../actions';

const initialState: ActionState = {};

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white">
        Bem-vindo de volta
      </h1>
      <p className="mt-2 text-sm text-white/45">Entre para acessar o painel do seu negócio.</p>

      <form action={action} className="mt-8 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

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
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@seunegocio.com"
          icon={<Mail className="h-4 w-4" />}
          error={state.errors?.email}
          required
        />

        <div>
          <PasswordInput
            label="Senha"
            name="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            error={state.errors?.password}
            required
          />
          <div className="mt-2 flex justify-end">
            <Link
              href="/recuperar-senha"
              className="text-[13px] font-medium text-nexo-300 transition hover:text-nexo-200"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth loading={pending}>
          Entrar
          {!pending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-nexo-300 transition hover:text-nexo-200">
          Criar conta
        </Link>
      </p>
    </motion.div>
  );
}
