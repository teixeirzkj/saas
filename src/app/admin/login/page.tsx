import type { Metadata } from 'next';

import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Admin · Entrar', robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] font-display text-[15px] font-bold text-white">
            N
          </span>
          <p className="mt-3 text-[13px] font-medium uppercase tracking-widest text-white/35">Painel administrativo</p>
        </div>

        <div className="surface p-6">
          <h1 className="font-display text-[20px] font-semibold text-white">Entrar</h1>
          <p className="mt-1.5 text-[13px] text-white/45">Acesso restrito ao dono da plataforma.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
