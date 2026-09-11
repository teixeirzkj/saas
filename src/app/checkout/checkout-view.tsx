'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Lock, ShieldCheck } from 'lucide-react';
import { useTransition } from 'react';

import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { planPriceLabel, type PlanDefinition } from '@/lib/plans';

import { startCheckout } from './actions';

export function CheckoutView({ plan }: { plan: PlanDefinition }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo href="/" size="sm" />
          <button
            onClick={() => router.push('/planos')}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Trocar plano
          </button>
        </div>

        <div className="surface p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-nexo-300">Assinatura</p>
          <h1 className="mt-1.5 font-display text-[22px] font-semibold text-white">Plano {plan.name}</h1>
          <p className="mt-1.5 text-[13.5px] text-white/50">{plan.description}</p>

          <div className="mt-6 flex items-end gap-1.5 border-y border-white/[0.06] py-5">
            <span className="font-display text-[34px] font-semibold leading-none text-white">
              {planPriceLabel(plan)}
            </span>
            {plan.priceCents > 0 && <span className="pb-1 text-[13px] text-white/40">/mês</span>}
          </div>

          <ul className="mt-5 space-y-2.5">
            {plan.features.slice(0, 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[13px] text-white/65">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexo-300" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            fullWidth
            className="mt-7"
            loading={pending}
            onClick={() => startTransition(() => startCheckout(plan.code))}
          >
            <Lock className="h-4 w-4" />
            {plan.priceCents === 0 ? 'Ativar plano grátis' : `Pagar ${planPriceLabel(plan)}/mês`}
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-white/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamento processado com segurança. Cancele quando quiser.
          </p>
        </div>
      </div>
    </div>
  );
}
