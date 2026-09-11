'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Copy, Download, ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';

import { CopyButton, WhatsAppSend } from '@/components/shared/whatsapp-send';
import { QuoteDocument, type BusinessInfo, type QuoteDocumentData } from '@/components/shared/quote-document';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { QUOTE_STATUS } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';
import { quoteMessage } from '@/lib/whatsapp';

import { deleteQuote, markQuoteSent, setQuoteStatus } from '../actions';

type Quote = QuoteDocumentData & {
  id: string;
  publicToken: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  customer: (QuoteDocumentData['customer'] & { id: string }) | null;
};

export function QuoteDetail({
  quote,
  business,
  appUrl,
  template,
}: {
  quote: Quote;
  business: BusinessInfo;
  appUrl: string;
  template: string | null;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const publicLink = `${appUrl}/orcamento/${quote.publicToken}`;

  const changeStatus = (next: 'rascunho' | 'enviado' | 'aprovado' | 'recusado') =>
    startTransition(async () => {
      const result = await setQuoteStatus(quote.id, next);
      if (result?.error) return error('Não foi possível atualizar', result.error);
      success(`Marcado como ${QUOTE_STATUS[next].label.toLowerCase()}`);
      router.refresh();
    });

  return (
    <>
      <div className="no-print">
        <Link
          href="/orcamentos"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Todos os orçamentos
        </Link>

        {/* Barra de ações */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-white">
                Orçamento #{quote.number}
              </h1>
              <StatusBadge status={quote.status} map={QUOTE_STATUS} />
            </div>
            <p className="mt-1.5 text-sm text-white/45">
              {quote.customer?.name ?? 'Sem cliente vinculado'}
              {quote.sentAt && ` · enviado em ${formatDateTime(quote.sentAt)}`}
              {quote.respondedAt && ` · respondido em ${formatDateTime(quote.respondedAt)}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <WhatsAppSend
              phone={quote.customer?.phone}
              message={quoteMessage({
                template: template ?? undefined,
                customerName: quote.customer?.name,
                businessName: business.name,
                link: publicLink,
                total: quote.total,
              })}
              label="Enviar pelo WhatsApp"
              onSent={() => startTransition(async () => void (await markQuoteSent(quote.id)))}
            />

            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Gerar PDF
            </Button>

            <Button variant="secondary" onClick={() => router.push(`/orcamentos/${quote.id}/editar`)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>

            <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mudança rápida de status */}
        <Card className="mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white">Situação do orçamento</p>
              <p className="mt-0.5 text-xs text-white/40">
                Atualize conforme a resposta do cliente — o dashboard e o histórico acompanham.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {quote.status !== 'enviado' && (
                <Button variant="secondary" size="sm" loading={pending} onClick={() => changeStatus('enviado')}>
                  Marcar enviado
                </Button>
              )}
              {quote.status !== 'aprovado' && (
                <Button variant="success" size="sm" loading={pending} onClick={() => changeStatus('aprovado')}>
                  <Check className="h-3.5 w-3.5" />
                  Aprovado
                </Button>
              )}
              {quote.status !== 'recusado' && (
                <Button variant="danger" size="sm" loading={pending} onClick={() => changeStatus('recusado')}>
                  <X className="h-3.5 w-3.5" />
                  Recusado
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Link público */}
        <Card className="mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white">Link para o cliente</p>
              <p className="mt-1 truncate text-xs text-white/40">{publicLink}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <CopyButton value={publicLink} label="Copiar link" />
              <ButtonAnchor href={`/orcamento/${quote.publicToken}`} variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </ButtonAnchor>
            </div>
          </div>
        </Card>
      </div>

      {/* Documento */}
      <QuoteDocument quote={quote} business={business} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Excluir orçamento #${quote.number}?`}
        description="O orçamento e todos os seus itens serão removidos permanentemente."
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteQuote(quote.id);
            if (result?.error) return error('Não foi possível excluir', result.error);
            success('Orçamento excluído');
            router.push('/orcamentos');
          })
        }
      />
    </>
  );
}
