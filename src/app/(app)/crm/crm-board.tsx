'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, MoreVertical, Plus, Search, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { SearchInput } from '@/components/ui/input';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { DEAL_STAGES, type DealStage } from '@/lib/constants';
import { brl, cn, relativeTime } from '@/lib/utils';

import { moveDeal } from './actions';
import { DealModal } from './deal-modal';

export type Deal = {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  source: string | null;
  notes: string | null;
  lastInteractionAt: Date | null;
  customer: { id: string; name: string; phone: string | null } | null;
  tasks: { id: string; title: string; done: boolean; dueAt: Date | null }[];
  notesList: { id: string; content: string; createdAt: Date; authorName: string | null }[];
};

export function CrmBoard({
  businessName,
  deals,
  customers,
  openNew,
  presetCustomerId,
  openDealId,
}: {
  businessName: string;
  deals: Deal[];
  customers: { id: string; name: string; phone: string | null }[];
  openNew: boolean;
  presetCustomerId?: string;
  openDealId?: string;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; deal?: Deal; defaultStage?: DealStage }>({
    open: openNew || Boolean(openDealId),
    deal: openDealId ? deals.find((d) => d.id === openDealId) : undefined,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return deals;
    const term = search.toLowerCase();
    return deals.filter(
      (d) => d.title.toLowerCase().includes(term) || d.customer?.name.toLowerCase().includes(term),
    );
  }, [deals, search]);

  const totalPipeline = deals
    .filter((d) => !['vendido', 'pos_venda'].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);
  const totalWon = deals.filter((d) => d.stage === 'vendido' || d.stage === 'pos_venda').reduce((sum, d) => sum + d.value, 0);

  const handleDrop = (stage: DealStage) => {
    setDragOverStage(null);
    if (!dragging) return;
    const deal = deals.find((d) => d.id === dragging);
    setDragging(null);
    if (!deal || deal.stage === stage) return;

    startTransition(async () => {
      const result = await moveDeal(dragging, stage);
      if (result.error) return error('Não foi possível mover', result.error);
      success(`Movido para ${DEAL_STAGES.find((s) => s.value === stage)?.label}`);
      router.refresh();
    });
  };

  return (
    <>
      <PageHeader
        title="CRM"
        description="Acompanhe suas negociações do primeiro contato até a venda."
        action={
          <Button onClick={() => setModal({ open: true, defaultStage: 'novo_lead' })}>
            <Plus className="h-4 w-4" />
            Nova negociação
          </Button>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SummaryTile label="Em andamento" value={brl(totalPipeline)} tone="text-[rgb(var(--brand-200))]" />
          <SummaryTile label="Vendido" value={brl(totalWon)} tone="text-emerald-300" />
          <SummaryTile label="Negociações" value={String(deals.length)} tone="text-white" />
        </div>

        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título ou cliente..."
          className="mt-3 sm:max-w-md"
        />
      </PageHeader>

      {deals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-6 w-6" />}
          title="Nenhuma negociação ainda"
          description="Crie sua primeira negociação e acompanhe o funil de vendas visualmente."
          action={
            <Button onClick={() => setModal({ open: true, defaultStage: 'novo_lead' })}>
              <Plus className="h-4 w-4" />
              Criar primeira negociação
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-2">
          {DEAL_STAGES.map((stage) => {
            const items = filtered
              .filter((d) => d.stage === stage.value)
              .sort((a, b) => a.title.localeCompare(b.title));
            const stageValue = items.reduce((sum, d) => sum + d.value, 0);

            return (
              <div
                key={stage.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStage(stage.value);
                }}
                onDragLeave={() => setDragOverStage((s) => (s === stage.value ? null : s))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stage.value);
                }}
                className="flex min-w-0 flex-col lg:w-[270px] lg:shrink-0"
              >
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                  <p className="text-[12.5px] font-semibold text-white/70">{stage.label}</p>
                  <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/40">
                    {items.length}
                  </span>
                </div>

                <div
                  className={cn(
                    'flex flex-1 flex-col gap-2 rounded-2xl border p-2 transition-colors lg:min-h-[260px]',
                    dragOverStage === stage.value
                      ? 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500))]/[0.06]'
                      : 'border-white/[0.05] bg-white/[0.015]',
                  )}
                >
                  {stageValue > 0 && (
                    <p className="px-1 text-[11px] font-medium text-white/30">{brl(stageValue)}</p>
                  )}

                  <AnimatePresence initial={false}>
                    {items.map((deal) => (
                      <motion.div
                        key={deal.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: dragging === deal.id ? 1.02 : 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        draggable
                        onDragStart={() => setDragging(deal.id)}
                        onDragEnd={() => setDragging(null)}
                        className={cn(
                          'surface surface-hover cursor-grab p-3 active:cursor-grabbing',
                          dragging === deal.id && 'opacity-50',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setModal({ open: true, deal })}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-[13px] font-medium text-white">{deal.title}</p>
                            {deal.customer && (
                              <p className="mt-0.5 truncate text-[11.5px] text-white/40">{deal.customer.name}</p>
                            )}
                          </button>
                          <DealMenu deal={deal} onEdit={() => setModal({ open: true, deal })} onMove={handleDrop} />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-display text-[13px] font-semibold text-[rgb(var(--brand-200))]">
                            {brl(deal.value)}
                          </span>
                          {deal.customer?.phone && (
                            <WhatsAppSend
                              phone={deal.customer.phone}
                              message={`Olá, ${deal.customer.name.split(' ')[0]}! Tudo bem? Sobre ${deal.title}...`}
                              size="icon-sm"
                              variant="ghost"
                              iconOnly
                              label="Falar com cliente"
                            />
                          )}
                        </div>

                        {deal.tasks.filter((t) => !t.done).length > 0 && (
                          <p className="mt-1.5 text-[10.5px] text-white/30">
                            {deal.tasks.filter((t) => !t.done).length} tarefa(s) pendente(s)
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {items.length === 0 && (
                    <p className="py-6 text-center text-[11px] text-white/20">Arraste um card aqui</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DealModal
        open={modal.open}
        onClose={() => {
          setModal({ open: false });
          if (openNew || openDealId) router.replace('/crm');
        }}
        deal={modal.deal}
        defaultStage={modal.defaultStage}
        customers={customers}
        presetCustomerId={presetCustomerId}
        businessName={businessName}
      />
    </>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="surface p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/30">{label}</p>
      <p className={`mt-1.5 font-display text-[18px] font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

/** Menu com atalho para mover de estágio — alternativa ao drag-and-drop no mobile. */
function DealMenu({
  deal,
  onEdit,
  onMove,
}: {
  deal: Deal;
  onEdit: () => void;
  onMove: (stage: DealStage) => void;
}) {
  return (
    <Dropdown
      width="w-48"
      trigger={
        <button
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-lg p-1 text-white/25 transition hover:bg-white/[0.07] hover:text-white"
          aria-label="Mais ações"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      }
    >
      {(close) => (
        <>
          <DropdownItem onClick={() => { close(); onEdit(); }}>Ver detalhes</DropdownItem>
          <div className="my-1.5 h-px bg-white/[0.07]" />
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">
            Mover para
          </p>
          {DEAL_STAGES.filter((s) => s.value !== deal.stage).map((s) => (
            <DropdownItem key={s.value} onClick={() => { close(); onMove(s.value); }}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  );
}
