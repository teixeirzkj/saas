'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Check, CheckCircle2, Download, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Logo } from '@/components/shared/logo';
import { QuoteDocument, type BusinessInfo, type QuoteDocumentData } from '@/components/shared/quote-document';
import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { brl, formatDate } from '@/lib/utils';

import { respondToQuote } from './actions';

export function PublicQuoteView({
  token,
  quote,
  business,
}: {
  token: string;
  quote: QuoteDocumentData;
  business: BusinessInfo;
}) {
  const router = useRouter();
  const { error } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<'aprovado' | 'recusado' | null>(null);

  const answered = quote.status === 'aprovado' || quote.status === 'recusado';
  const expired = Boolean(quote.validUntil && new Date(quote.validUntil) < new Date());

  const respond = (decision: 'aprovado' | 'recusado') =>
    startTransition(async () => {
      const result = await respondToQuote(token, decision);
      setConfirm(null);
      if (result.error) return error('Não foi possível registrar', result.error);
      router.refresh();
    });

  return (
    <div className="min-h-screen">
      <header className="no-print glass sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo href={null} size="sm" />
          <Button variant="ghost" size="sm" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5" />
            Baixar PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {/* Estado da resposta */}
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`no-print mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              quote.status === 'aprovado'
                ? 'border-emerald-500/25 bg-emerald-500/10'
                : 'border-red-500/25 bg-red-500/10'
            }`}
          >
            {quote.status === 'aprovado' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            )}
            <div>
              <p className="text-sm font-semibold text-white">
                {quote.status === 'aprovado' ? 'Orçamento aprovado' : 'Orçamento recusado'}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                {quote.status === 'aprovado'
                  ? `A ${business.name} já foi avisada e vai entrar em contato com você.`
                  : `A ${business.name} foi avisada. Se mudar de ideia, fale com eles pelo WhatsApp.`}
              </p>
            </div>
          </motion.div>
        )}

        {!answered && expired && (
          <div className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-white">Prazo de validade vencido</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                Este orçamento era válido até {formatDate(quote.validUntil)}. Fale com a {business.name} para
                receber os valores atualizados.
              </p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <QuoteDocument quote={quote} business={business} />
        </motion.div>

        {/* Ações do cliente */}
        {!answered && !expired && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="no-print surface mt-5 p-5 sm:p-6"
          >
            <h3 className="font-display text-[17px] font-semibold text-white">O que você decide?</h3>
            <p className="mt-1.5 text-sm text-white/50">
              Sua resposta é registrada na hora e a {business.name} recebe o aviso.
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Button size="lg" fullWidth loading={pending} onClick={() => setConfirm('aprovado')}>
                <Check className="h-4 w-4" />
                Aprovar orçamento de {brl(quote.total)}
              </Button>
              <Button variant="outline" size="lg" loading={pending} onClick={() => setConfirm('recusado')}>
                <X className="h-4 w-4" />
                Recusar
              </Button>
            </div>

            {(business.whatsapp || business.phone) && (
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <p className="mb-2.5 text-[13px] text-white/50">Ficou com alguma dúvida antes de decidir?</p>
                <WhatsAppSend
                  phone={business.whatsapp ?? business.phone}
                  message={`Olá! Estou vendo o orçamento #${quote.number} e tenho uma dúvida.`}
                  label={`Falar com ${business.name}`}
                />
              </div>
            )}
          </motion.div>
        )}

        {answered && (business.whatsapp || business.phone) && (
          <div className="no-print mt-5 flex justify-center">
            <WhatsAppSend
              phone={business.whatsapp ?? business.phone}
              message={`Olá! Acabei de responder o orçamento #${quote.number}.`}
              label={`Falar com ${business.name}`}
            />
          </div>
        )}

        <p className="no-print mt-8 text-center text-[11px] text-white/25">
          Documento gerado pelo NEXO · Tudo que seu negócio precisa em um só lugar.
        </p>
      </main>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'aprovado' ? 'Aprovar este orçamento?' : 'Recusar este orçamento?'}
        description={
          confirm === 'aprovado'
            ? `Você confirma o valor de ${brl(quote.total)}. A empresa receberá o aviso imediatamente.`
            : 'A empresa será avisada de que você não seguiu com esta proposta.'
        }
        confirmLabel={confirm === 'aprovado' ? 'Sim, aprovar' : 'Sim, recusar'}
        danger={confirm === 'recusado'}
        loading={pending}
        onConfirm={() => confirm && respond(confirm)}
      />
    </div>
  );
}
