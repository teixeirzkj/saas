'use client';

import { ArrowRight, Check, Lock, Megaphone, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Drawer } from '@/components/ui/modal';
import { planAllows } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { salesLink, waLink } from '@/lib/whatsapp';

type Customer = { id: string; name: string; phone: string | null; status: string };

const DEFAULT_MESSAGE = 'Olá, {cliente}! Tudo bem? Aqui é da {empresa} — passando para avisar sobre uma novidade especial para você.';

/**
 * "Disparo em massa": recurso exclusivo do plano Negócio. Não existe API
 * oficial de WhatsApp configurada (decisão consciente do projeto — ver
 * CLAUDE.md), então isso não é um envio automático de verdade: monta uma fila
 * de links wa.me personalizados por cliente e deixa você percorrer um por um,
 * cada aba abrindo com a mensagem já pronta pra só apertar enviar.
 */
export function BulkSendButton({
  customers,
  businessName,
  planCode,
}: {
  customers: Customer[];
  businessName: string;
  planCode: string;
}) {
  const [open, setOpen] = useState(false);
  const allowed = planAllows(planCode, 'bulkSend');

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Megaphone className="h-4 w-4" />
        Disparo em massa
        {!allowed && <Lock className="h-3.5 w-3.5 opacity-60" />}
      </Button>

      <BulkSendDrawer
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        businessName={businessName}
        allowed={allowed}
      />
    </>
  );
}

function BulkSendDrawer({
  open,
  onClose,
  customers,
  businessName,
  allowed,
}: {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  businessName: string;
  allowed: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set(['lead', 'ativo', 'inativo']));
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [started, setStarted] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const withPhone = useMemo(() => customers.filter((c) => c.phone && statusFilter.has(c.status)), [customers, statusFilter]);

  const toggleStatus = (status: string) =>
    setStatusFilter((set) => {
      const next = new Set(set);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  const current = withPhone[cursor];
  const currentMessage = current
    ? message.replaceAll('{cliente}', current.name.split(' ')[0]).replaceAll('{empresa}', businessName)
    : '';

  const reset = () => {
    setStarted(false);
    setCursor(0);
    setSentIds(new Set());
  };

  return (
    <Drawer
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Disparo em massa"
      description="Fila de mensagens personalizadas pelo WhatsApp"
    >
      {!allowed ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--brand-500)/0.25)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-[14px] font-medium text-white">Recurso do plano Negócio</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/45">
            Disparo em massa, automações de follow-up e clientes/orçamentos ilimitados fazem parte do plano Negócio.
          </p>
          <ButtonAnchor href={salesLink('Negócio')} variant="subtle" className="mt-5">
            Falar sobre upgrade
          </ButtonAnchor>
        </div>
      ) : !started ? (
        <div className="space-y-5">
          <div>
            <span className="label">Enviar para</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'lead', label: 'Leads' },
                { value: 'ativo', label: 'Ativos' },
                { value: 'inativo', label: 'Inativos' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all',
                    statusFilter.has(s.value)
                      ? 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500)/0.16)] text-[rgb(var(--brand-100))]'
                      : 'border-white/[0.08] bg-white/[0.02] text-white/50',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="hint">{withPhone.length} clientes com telefone cadastrado receberão a mensagem.</p>
          </div>

          <Textarea
            label="Mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            hint="Use {cliente} para o primeiro nome e {empresa} para o nome do seu negócio."
          />

          <Button fullWidth size="lg" disabled={withPhone.length === 0} onClick={() => setStarted(true)}>
            Iniciar disparo ({withPhone.length})
          </Button>
        </div>
      ) : withPhone.length === 0 || cursor >= withPhone.length ? (
        <div className="flex flex-col items-center py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
            <Check className="h-5 w-5" />
          </span>
          <p className="text-[14px] font-medium text-white">Fila concluída!</p>
          <p className="mt-2 text-[13px] text-white/45">{sentIds.size} conversas abertas nesta sessão.</p>
          <Button variant="secondary" className="mt-5" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Novo disparo
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between text-[12.5px] text-white/45">
            <span>
              Contato {cursor + 1} de {withPhone.length}
            </span>
            <Badge tone="purple">{sentIds.size} enviados</Badge>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[14px] font-medium text-white">{current.name}</p>
            <p className="mt-0.5 text-[12.5px] text-white/40">{formatPhoneLocal(current.phone)}</p>
            <div className="mt-3 whitespace-pre-line rounded-lg bg-black/20 p-3 text-[13px] leading-relaxed text-white/75">
              {currentMessage}
            </div>
          </div>

          <ButtonAnchor
            href={waLink(current.phone, currentMessage)}
            variant="whatsapp"
            size="lg"
            fullWidth
            onClick={() => setSentIds((set) => new Set(set).add(current.id))}
          >
            Abrir conversa e enviar
          </ButtonAnchor>

          <Button variant="secondary" fullWidth onClick={() => setCursor((c) => c + 1)}>
            {cursor + 1 >= withPhone.length ? 'Concluir' : 'Próximo contato'}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Drawer>
  );
}

function formatPhoneLocal(phone: string | null) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
