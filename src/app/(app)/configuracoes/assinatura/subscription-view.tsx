'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, Check, CreditCard, X } from 'lucide-react';
import { useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonLink } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/misc';
import { useToast } from '@/components/ui/toast';
import { brlCents, formatDate } from '@/lib/utils';
import { useState } from 'react';

import { cancelPlan, resumePlan } from '../actions';

export function SubscriptionView({
  planCode,
  planName,
  priceCents,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  limits,
  payments,
}: {
  planCode: string;
  planName: string;
  priceCents: number;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  limits: { maxCustomers: number; maxQuotes: number; maxProducts: number; maxUsers: number; aiCredits: number };
  payments: { id: string; amountCents: number; status: string; createdAt: Date; paidAt: Date | null }[];
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const statusLabel: Record<string, string> = {
    active: 'Ativa',
    trialing: 'Período de teste',
    past_due: 'Pagamento pendente',
    canceled: 'Cancelada',
  };

  const paymentStatusLabel: Record<string, string> = {
    paid: 'Pago',
    pending: 'Pendente',
    failed: 'Falhou',
    refunded: 'Reembolsado',
  };

  return (
    <>
      <PageHeader title="Assinatura" description="Gerencie seu plano e forma de pagamento." />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Plano atual" icon={<CreditCard className="h-4 w-4" />} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-[20px] font-semibold text-white">{planName}</p>
                <Badge tone={status === 'active' ? 'success' : status === 'past_due' ? 'danger' : 'neutral'}>
                  {statusLabel[status] ?? status}
                </Badge>
                {cancelAtPeriodEnd && <Badge tone="warning">Cancela ao fim do período</Badge>}
              </div>
              <p className="mt-1.5 text-[13px] text-white/45">
                {priceCents === 0 ? 'Gratuito' : `${brlCents(priceCents)}/mês`}
                {currentPeriodEnd &&
                  ` · próxima cobrança em ${formatDate(currentPeriodEnd)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {planCode !== 'business' && (
                <ButtonLink href="/planos" variant="subtle">
                  <ArrowUpRight className="h-4 w-4" />
                  Fazer upgrade
                </ButtonLink>
              )}
              {planCode !== 'free' && !cancelAtPeriodEnd && (
                <Button variant="ghost" onClick={() => setConfirmCancel(true)}>
                  <X className="h-4 w-4" />
                  Cancelar assinatura
                </Button>
              )}
              {cancelAtPeriodEnd && (
                <Button
                  variant="secondary"
                  loading={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await resumePlan();
                      if (result.error) return error('Não foi possível reativar', result.error);
                      success('Assinatura reativada');
                      router.refresh();
                    })
                  }
                >
                  <Check className="h-4 w-4" />
                  Reativar assinatura
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-5">
            <Limit label="Clientes" value={limits.maxCustomers} />
            <Limit label="Orçamentos/mês" value={limits.maxQuotes} />
            <Limit label="Produtos" value={limits.maxProducts} />
            <Limit label="Usuários" value={limits.maxUsers} />
            <Limit label="Créditos de IA" value={limits.aiCredits} suffix="/mês" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Histórico de pagamentos" />
          {payments.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/40">Nenhum pagamento registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {payments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] text-white/80">{formatDate(payment.createdAt)}</p>
                    {payment.paidAt && <p className="text-[11px] text-white/35">Pago em {formatDate(payment.paidAt)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[13px] font-semibold text-white">{brlCents(payment.amountCents)}</span>
                    <Badge tone={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'danger' : 'neutral'}>
                      {paymentStatusLabel[payment.status] ?? payment.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancelar sua assinatura?"
        description="Você continua com acesso completo até o fim do período já pago. Depois disso, sua conta volta para o plano Grátis."
        confirmLabel="Cancelar assinatura"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await cancelPlan();
            if (result.error) return error('Não foi possível cancelar', result.error);
            success('Assinatura cancelada. Você mantém acesso até o fim do período.');
            setConfirmCancel(false);
            router.refresh();
          })
        }
      />
    </>
  );
}

function Limit({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 font-display text-[15px] font-semibold text-white">
        {value < 0 ? 'Ilimitado' : `${value}${suffix ?? ''}`}
      </p>
    </div>
  );
}
