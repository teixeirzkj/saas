'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Logo } from '@/components/shared/logo';
import { ButtonLink } from '@/components/ui/button';

export function ReturnView({
  success,
  planName,
  amountLabel,
}: {
  success: boolean;
  planName: string;
  amountLabel: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <Logo href={null} size="sm" />
        </div>

        <div className="surface p-7 text-center">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={`relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${
              success ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-red-500/25 bg-red-500/10'
            }`}
          >
            <span
              className={`absolute inset-0 animate-pulse-glow rounded-2xl blur-xl ${
                success ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}
            />
            {success ? (
              <CheckCircle2 className="relative h-7 w-7 text-emerald-300" />
            ) : (
              <XCircle className="relative h-7 w-7 text-red-300" />
            )}
          </motion.span>

          <h1 className="font-display text-[24px] font-semibold text-white">
            {success ? 'Assinatura ativada!' : 'Pagamento não confirmado'}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/50">
            {success
              ? `O plano ${planName} (${amountLabel}/mês) já está ativo e todos os recursos foram liberados.`
              : 'Não conseguimos confirmar o pagamento. Tente novamente ou fale com o suporte.'}
          </p>

          <ButtonLink href={success ? '/dashboard' : '/planos'} size="lg" fullWidth className="mt-7">
            {success ? 'Ir para o painel' : 'Ver planos novamente'}
          </ButtonLink>
        </div>
      </motion.div>
    </div>
  );
}
