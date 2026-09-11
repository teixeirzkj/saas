'use client';

import { useRouter } from 'next/navigation';
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { StatusBadge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { SearchInput } from '@/components/ui/input';
import { EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import { ConfirmDialog } from '@/components/ui/modal';
import { CellStack, MobileCard, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { FilterPills } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { QUOTE_STATUS } from '@/lib/constants';
import { brl, formatDate } from '@/lib/utils';
import { quoteMessage } from '@/lib/whatsapp';

import { deleteQuote, duplicateQuote, markQuoteSent, setQuoteStatus } from './actions';

type Quote = {
  id: string;
  number: number;
  title: string;
  status: string;
  total: number;
  createdAt: Date;
  validUntil: Date | null;
  publicToken: string;
  itemCount: number;
  customer: { id: string; name: string; phone: string | null } | null;
};

export function QuotesView({
  businessName,
  appUrl,
  template,
  quotes,
  statusCounts,
  total,
  approvedValue,
  pendingValue,
  status,
  query,
  monthCount,
  monthLimit,
  planName,
}: {
  businessName: string;
  appUrl: string;
  template: string | null;
  quotes: Quote[];
  statusCounts: Record<string, number>;
  total: number;
  approvedValue: number;
  pendingValue: number;
  status: string;
  query: string;
  monthCount: number;
  monthLimit: number;
  planName: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Quote | null>(null);
  const { success, error } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search === query) return;
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (status !== 'todos') params.set('status', status);
      const qs = params.toString();
      router.replace(qs ? `/orcamentos?${qs}` : '/orcamentos');
    }, 320);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = (value: string) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (value !== 'todos') params.set('status', value);
    const qs = params.toString();
    router.replace(qs ? `/orcamentos?${qs}` : '/orcamentos');
  };

  const pills = [
    { value: 'todos', label: 'Todos', count: total },
    ...Object.entries(QUOTE_STATUS).map(([value, meta]) => ({
      value,
      label: meta.label,
      count: statusCounts[value] ?? 0,
    })),
  ];

  const changeStatus = (id: string, next: 'rascunho' | 'enviado' | 'aprovado' | 'recusado') =>
    startTransition(async () => {
      const result = await setQuoteStatus(id, next);
      if (result?.error) return error('Não foi possível atualizar', result.error);
      success(`Orçamento marcado como ${QUOTE_STATUS[next].label.toLowerCase()}`);
      router.refresh();
    });

  const publicLink = (token: string) => `${appUrl}/orcamento/${token}`;

  const limitReached = monthLimit > 0 && monthCount >= monthLimit;

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Crie, envie pelo WhatsApp e acompanhe a resposta do cliente."
        action={
          limitReached ? (
            <ButtonLink href="/planos" variant="subtle">
              Liberar orçamentos ilimitados
            </ButtonLink>
          ) : (
            <ButtonLink href="/orcamentos/novo">
              <Plus className="h-4 w-4" />
              Novo orçamento
            </ButtonLink>
          )
        }
      >
        <div className="space-y-3">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryTile label="Aprovados" value={brl(approvedValue)} tone="text-emerald-300" />
            <SummaryTile label="Aguardando resposta" value={brl(pendingValue)} tone="text-[rgb(var(--brand-200))]" />
            <SummaryTile
              label="Criados neste mês"
              value={monthLimit > 0 ? `${monthCount} / ${monthLimit}` : String(monthCount)}
              tone="text-white"
              footer={
                monthLimit > 0 ? (
                  <Progress value={monthCount} max={monthLimit} className="mt-2" />
                ) : undefined
              }
            />
          </div>

          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou cliente..."
            className="sm:max-w-md"
          />
          <FilterPills items={pills} value={status} onChange={setStatus} />

          {limitReached && (
            <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-white/70">
                Você atingiu o limite de {monthLimit} orçamentos por mês do plano {planName}.
              </p>
              <ButtonLink href="/planos" variant="subtle" size="sm">
                Ver planos
              </ButtonLink>
            </div>
          )}
        </div>
      </PageHeader>

      {quotes.length === 0 ? (
        query || status !== 'todos' ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Nenhum orçamento encontrado"
            description="Ajuste a busca ou remova os filtros para ver todos os orçamentos."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  router.replace('/orcamentos');
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="Você ainda não possui nenhum orçamento."
            description="Monte um orçamento profissional em poucos minutos, gere o PDF e envie direto pelo WhatsApp."
            actionLabel="Criar primeiro orçamento"
            actionHref="/orcamentos/novo"
          />
        )
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block">
            <Table>
              <THead>
                <TR>
                  <TH>Orçamento</TH>
                  <TH>Cliente</TH>
                  <TH>Criado em</TH>
                  <TH>Validade</TH>
                  <TH align="right">Total</TH>
                  <TH>Status</TH>
                  <TH align="right">Ações</TH>
                </TR>
              </THead>
              <TBody>
                {quotes.map((quote, i) => (
                  <TR key={quote.id} index={i} onClick={() => router.push(`/orcamentos/${quote.id}`)}>
                    <TD>
                      <CellStack
                        title={`#${quote.number} · ${quote.title}`}
                        subtitle={`${quote.itemCount} ${quote.itemCount === 1 ? 'item' : 'itens'}`}
                      />
                    </TD>
                    <TD>
                      <span className="text-[13px] text-white/75">{quote.customer?.name ?? 'Sem cliente'}</span>
                    </TD>
                    <TD>
                      <span className="text-[13px] text-white/50">{formatDate(quote.createdAt)}</span>
                    </TD>
                    <TD>
                      <ValidityCell validUntil={quote.validUntil} status={quote.status} />
                    </TD>
                    <TD align="right">
                      <span className="font-display text-[14px] font-semibold text-white">{brl(quote.total)}</span>
                    </TD>
                    <TD>
                      <StatusBadge status={quote.status} map={QUOTE_STATUS} />
                    </TD>
                    <TD align="right">
                      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
                        {quote.customer?.phone && (
                          <WhatsAppSend
                            phone={quote.customer.phone}
                            message={quoteMessage({
                              template: template ?? undefined,
                              customerName: quote.customer.name,
                              businessName,
                              link: publicLink(quote.publicToken),
                              total: quote.total,
                            })}
                            size="icon-sm"
                            variant="ghost"
                            iconOnly
                            label="Enviar orçamento"
                            onSent={() => startTransition(async () => void (await markQuoteSent(quote.id)))}
                          />
                        )}
                        <QuoteMenu
                          quote={quote}
                          publicLink={publicLink(quote.publicToken)}
                          onStatus={changeStatus}
                          onDelete={() => setToDelete(quote)}
                          onDuplicate={() =>
                            startTransition(async () => {
                              const result = await duplicateQuote(quote.id);
                              if (result.error) return error('Não foi possível duplicar', result.error);
                              success('Orçamento duplicado');
                              if (result.id) router.push(`/orcamentos/${result.id}`);
                            })
                          }
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 lg:hidden">
            {quotes.map((quote, i) => (
              <MobileCard key={quote.id} index={i}>
                <div
                  onClick={() => router.push(`/orcamentos/${quote.id}`)}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      #{quote.number} · {quote.title}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-white/40">
                      {quote.customer?.name ?? 'Sem cliente'} · {formatDate(quote.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={quote.status} map={QUOTE_STATUS} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Total</p>
                    <p className="font-display text-[16px] font-semibold text-white">{brl(quote.total)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {quote.customer?.phone && (
                      <WhatsAppSend
                        phone={quote.customer.phone}
                        message={quoteMessage({
                          template: template ?? undefined,
                          customerName: quote.customer.name,
                          businessName,
                          link: publicLink(quote.publicToken),
                          total: quote.total,
                        })}
                        size="sm"
                        label="Enviar"
                        onSent={() => startTransition(async () => void (await markQuoteSent(quote.id)))}
                      />
                    )}
                    <QuoteMenu
                      quote={quote}
                      publicLink={publicLink(quote.publicToken)}
                      onStatus={changeStatus}
                      onDelete={() => setToDelete(quote)}
                      onDuplicate={() =>
                        startTransition(async () => {
                          const result = await duplicateQuote(quote.id);
                          if (result.error) return error('Não foi possível duplicar', result.error);
                          success('Orçamento duplicado');
                          if (result.id) router.push(`/orcamentos/${result.id}`);
                        })
                      }
                    />
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title={toDelete ? `Excluir orçamento #${toDelete.number}?` : ''}
        description="O orçamento e todos os seus itens serão removidos. Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            if (!toDelete) return;
            const result = await deleteQuote(toDelete.id);
            if (result?.error) return error('Não foi possível excluir', result.error);
            success('Orçamento excluído');
            setToDelete(null);
            router.refresh();
          })
        }
      />
    </>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  footer,
}: {
  label: string;
  value: string;
  tone: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="surface p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/30">{label}</p>
      <p className={`mt-1.5 font-display text-[18px] font-semibold ${tone}`}>{value}</p>
      {footer}
    </div>
  );
}

function ValidityCell({ validUntil, status }: { validUntil: Date | null; status: string }) {
  if (!validUntil) return <span className="text-[13px] text-white/30">--</span>;

  const expired = new Date(validUntil) < new Date();
  const relevant = status === 'enviado' || status === 'rascunho';

  return (
    <span className={`text-[13px] ${expired && relevant ? 'font-medium text-red-300' : 'text-white/50'}`}>
      {expired && relevant ? 'Vencido · ' : ''}
      {formatDate(validUntil)}
    </span>
  );
}

function QuoteMenu({
  quote,
  publicLink,
  onStatus,
  onDelete,
  onDuplicate,
}: {
  quote: Quote;
  publicLink: string;
  onStatus: (id: string, status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado') => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { success } = useToast();

  return (
    <Dropdown
      width="w-56"
      trigger={
        <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
          <MoreVertical className="h-4 w-4" />
        </Button>
      }
    >
      {(close) => (
        <>
          <DropdownItem
            icon={<ExternalLink className="h-4 w-4" />}
            onClick={() => {
              close();
              window.open(`/orcamento/${quote.publicToken}`, '_blank');
            }}
          >
            Ver como o cliente vê
          </DropdownItem>
          <DropdownItem
            icon={<Copy className="h-4 w-4" />}
            onClick={async () => {
              await navigator.clipboard.writeText(publicLink);
              success('Link copiado');
              close();
            }}
          >
            Copiar link público
          </DropdownItem>
          <DropdownItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); onDuplicate(); }}>
            Duplicar orçamento
          </DropdownItem>

          <DropdownSeparator />

          {quote.status !== 'enviado' && (
            <DropdownItem icon={<Send className="h-4 w-4" />} onClick={() => { close(); onStatus(quote.id, 'enviado'); }}>
              Marcar como enviado
            </DropdownItem>
          )}
          {quote.status !== 'aprovado' && (
            <DropdownItem icon={<Check className="h-4 w-4" />} onClick={() => { close(); onStatus(quote.id, 'aprovado'); }}>
              Marcar como aprovado
            </DropdownItem>
          )}
          {quote.status !== 'recusado' && (
            <DropdownItem icon={<X className="h-4 w-4" />} onClick={() => { close(); onStatus(quote.id, 'recusado'); }}>
              Marcar como recusado
            </DropdownItem>
          )}

          <DropdownSeparator />

          <DropdownItem icon={<Trash2 className="h-4 w-4" />} danger onClick={() => { close(); onDelete(); }}>
            Excluir orçamento
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}
