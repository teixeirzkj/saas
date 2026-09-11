'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { useActionState } from 'react';

import { Button, ButtonLink } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';

import { forgotPasswordAction, resetPasswordAction, type ActionState } from '../actions';

const initialState: ActionState = {};

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.ok) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <h1 className="font-display text-[26px] font-semibold leading-tight text-white">Verifique seu e-mail</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">{state.message}</p>

        {state.token && (
          <div className="mt-6 rounded-2xl border border-nexo-500/20 bg-nexo-500/[0.06] p-4">
            <p className="text-[12px] font-semibold text-nexo-200">Ambiente de desenvolvimento</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/45">
              Nenhum provedor de e-mail está configurado, então o link aparece aqui para o fluxo continuar
              utilizável:
            </p>
            <ButtonLink href={`/recuperar-senha?token=${state.token}`} variant="subtle" size="sm" className="mt-3">
              Abrir link de redefinição
            </ButtonLink>
          </div>
        )}

        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para o login
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white">
        Recuperar senha
      </h1>
      <p className="mt-2 text-sm text-white/45">
        Informe o e-mail da sua conta e enviaremos as instruções para criar uma nova senha.
      </p>

      <form action={action} className="mt-8 space-y-4">
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
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Enviar instruções
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para o login
      </Link>
    </motion.div>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  if (state.ok) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <h1 className="font-display text-[26px] font-semibold leading-tight text-white">Senha alterada</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">{state.message}</p>
        <ButtonLink href="/login" size="lg" className="mt-7" fullWidth>
          Ir para o login
        </ButtonLink>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-nexo-500/25 bg-nexo-500/10 text-nexo-200">
        <KeyRound className="h-5 w-5" />
      </span>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white">
        Criar nova senha
      </h1>
      <p className="mt-2 text-sm text-white/45">Escolha uma senha com pelo menos 8 caracteres.</p>

      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />

        {state.error && (
          <div
            className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-[13px] text-red-200"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}

        <PasswordInput
          label="Nova senha"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          error={state.errors?.password}
          required
        />
        <PasswordInput
          label="Confirmar nova senha"
          name="confirm"
          autoComplete="new-password"
          placeholder="Repita a senha"
          error={state.errors?.confirm}
          required
        />

        <Button type="submit" size="lg" fullWidth loading={pending}>
          Salvar nova senha
        </Button>
      </form>
    </motion.div>
  );
}
