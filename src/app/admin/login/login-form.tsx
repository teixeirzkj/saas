'use client';

import { AlertCircle } from 'lucide-react';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, PasswordInput } from '@/components/ui/input';

import { adminLoginAction, type AdminLoginState } from './actions';

const initialState: AdminLoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-[13px] text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <Input label="E-mail" name="email" type="email" autoComplete="email" required error={state.errors?.email} />
      <PasswordInput label="Senha" name="password" autoComplete="current-password" required error={state.errors?.password} />

      <Button type="submit" size="lg" fullWidth loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
