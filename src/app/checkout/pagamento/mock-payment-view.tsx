'use client';

import { motion } from 'framer-motion';
import { CreditCard, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { approveMockPayment } from '../actions';

/**
 * Sandbox local de pagamento — substitui o checkout de um gateway real quando
 * PAYMENT_PROVIDER=mock. Simula a tela de aprovação (Pix ou cartão) para que o
 * fluxo de assinatura funcione de ponta a ponta em desenvolvimento.
 */
export function MockPaymentView({
  paymentId,
  planName,
  amountLabel,
}: {
  paymentId: string;
  planName: string;
  amountLabel: string;
}) {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo href={null} size="sm" />
        </div>

        <div className="surface p-6 sm:p-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Ambiente de testes</p>
              <p className="mt-1 text-[13px] text-white/50">
                Plano {planName} · {amountLabel}/mês
              </p>
            </div>
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-amber-300">
              Sandbox
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod('pix')}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-xl border text-[13.5px] font-medium transition-all',
                method === 'pix'
                  ? 'border-nexo-500/40 bg-nexo-500/16 text-nexo-100'
                  : 'border-white/[0.08] bg-white/[0.02] text-white/50',
              )}
            >
              <QrCode className="h-4 w-4" />
              Pix
            </button>
            <button
              onClick={() => setMethod('card')}
              className={cn(
                'flex h-11 items-center justify-center gap-2 rounded-xl border text-[13.5px] font-medium transition-all',
                method === 'card'
                  ? 'border-nexo-500/40 bg-nexo-500/16 text-nexo-100'
                  : 'border-white/[0.08] bg-white/[0.02] text-white/50',
              )}
            >
              <CreditCard className="h-4 w-4" />
              Cartão
            </button>
          </div>

          <div className="mt-5">
            {method === 'pix' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
              >
                <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-white p-3">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(45deg, #111 0, #111 4px, #fff 4px, #fff 8px), repeating-linear-gradient(-45deg, #111 0, #111 4px, transparent 4px, transparent 8px)',
                    }}
                  />
                </div>
                <p className="mt-4 text-center text-[12.5px] text-white/45">
                  Escaneie o código para simular o pagamento via Pix.
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <Input label="Número do cartão" placeholder="0000 0000 0000 0000" defaultValue="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Validade" placeholder="MM/AA" defaultValue="12/30" />
                  <Input label="CVV" placeholder="123" defaultValue="123" />
                </div>
                <Input label="Nome no cartão" placeholder="Como está no cartão" />
              </motion.div>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            fullWidth
            className="mt-6"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                await approveMockPayment(paymentId);
              })
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? 'Confirmando pagamento...' : `Confirmar pagamento de ${amountLabel}`}
          </Button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Nenhum dado real é processado neste ambiente.
          </p>
        </div>
      </div>
    </div>
  );
}
