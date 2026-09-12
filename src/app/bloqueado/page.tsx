import type { Metadata } from 'next';

import { logoutAction } from '@/app/(auth)/actions';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { ButtonAnchor } from '@/components/ui/button';
import { getAuthContext } from '@/lib/auth';
import { waLink } from '@/lib/whatsapp';

export const metadata: Metadata = { title: 'Conta bloqueada' };

export default async function BlockedPage() {
  const ctx = await getAuthContext();
  const reason = ctx?.business?.blockedReason;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo href={null} />
        </div>

        <div className="surface p-7">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </span>

          <h1 className="font-display text-[22px] font-semibold text-white">Sua conta está bloqueada</h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/55">
            {reason || 'O acesso ao painel foi temporariamente suspenso. Fale com o suporte para regularizar.'}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <ButtonAnchor href={waLink('74999188851', 'Olá! Minha conta na NEXO está bloqueada, pode me ajudar?')} variant="whatsapp" size="lg">
              Falar no WhatsApp
            </ButtonAnchor>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="lg" fullWidth>
                Sair
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
