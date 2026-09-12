'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, CheckCircle2, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button, ButtonAnchor } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input, Select, Switch, Textarea } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { SEGMENTS } from '@/lib/constants';
import { PLANS } from '@/lib/plans';
import { brl, brlCents, formatDate, formatDateTime, isoDate, relativeTime } from '@/lib/utils';

import { deleteBusinessAccount, markPaid, toggleBlock, updateSubscription } from '@/app/admin/actions';

type Business = {
  id: string;
  name: string;
  slug: string;
  segment: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  blocked: boolean;
  blockedReason: string | null;
  blockedAt: Date | null;
  adminNotes: string | null;
  createdAt: Date;
  counts: { customers: number; quotes: number; orders: number; appointments: number };
};

type UserRow = { id: string; name: string; email: string; role: string; lastLoginAt: Date | null; createdAt: Date };
type SubscriptionRow = { planCode: string; status: string; currentPeriodEnd: Date; cancelAtPeriodEnd: boolean };
type PaymentRow = {
  id: string;
  amountCents: number;
  status: string;
  provider: string;
  paidAt: Date | null;
  createdAt: Date;
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Em dia',
  trialing: 'Em teste',
  past_due: 'Devendo',
  canceled: 'Cancelado',
};

export function AccountDetail({
  business,
  users,
  subscription,
  payments,
}: {
  business: Business;
  users: UserRow[];
  subscription: SubscriptionRow | null;
  payments: PaymentRow[];
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const overdue = subscription && subscription.currentPeriodEnd < new Date() && subscription.status !== 'canceled';
  const segmentLabel = SEGMENTS.find((s) => s.value === business.segment)?.label ?? business.segment;
  const owner = users.find((u) => u.role === 'owner') ?? users[0];

  const submitSubscription = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateSubscription(business.id, formData);
      if (result.errors) {
        setErrors(result.errors);
        return error('Verifique os campos', Object.values(result.errors)[0]);
      }
      if (result.error) return error('Não foi possível salvar', result.error);
      setErrors({});
      success('Assinatura atualizada');
      router.refresh();
    });
  };

  return (
    <>
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todas as contas
      </Link>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] font-semibold text-white">{business.name}</h1>
            {business.blocked && <Badge tone="danger">Bloqueada</Badge>}
            {!business.blocked && overdue && <Badge tone="warning">Devendo</Badge>}
          </div>
          <p className="mt-1 text-[13px] text-white/45">
            {segmentLabel} · /{business.slug} · criada {relativeTime(business.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonAnchor href={`/catalogo/${business.slug}`} variant="ghost" size="sm">
            <ExternalLink className="h-3.5 w-3.5" />
            Ver catálogo
          </ButtonAnchor>
          <Button
            variant={business.blocked ? 'success' : 'danger'}
            size="sm"
            onClick={() => (business.blocked ? runBlockToggle() : setConfirmBlock(true))}
          >
            {business.blocked ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Desbloquear
              </>
            ) : (
              <>
                <Ban className="h-3.5 w-3.5" />
                Bloquear
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Clientes" value={business.counts.customers} />
        <MiniStat label="Orçamentos" value={business.counts.quotes} />
        <MiniStat label="Pedidos" value={business.counts.orders} />
        <MiniStat label="Agendamentos" value={business.counts.appointments} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assinatura e pagamento" description="Controlado manualmente pelo admin." />

          <form action={submitSubscription} className="space-y-4">
            <Select
              label="Plano"
              name="planCode"
              defaultValue={subscription?.planCode ?? 'free'}
              options={PLANS.map((p) => ({
                value: p.code,
                label: `${p.name} — R$ ${(p.priceCents / 100).toFixed(2).replace('.', ',')}/mês`,
              }))}
            />

            <Select
              label="Situação"
              name="status"
              defaultValue={subscription?.status ?? 'trialing'}
              options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
              error={errors.status}
            />

            <Input
              label="Próximo vencimento"
              name="dueDate"
              type="date"
              defaultValue={subscription ? isoDate(new Date(subscription.currentPeriodEnd)) : isoDate(new Date())}
              error={errors.dueDate}
              required
            />

            <Textarea
              label="Observação sobre pagamento"
              name="adminNotes"
              defaultValue={business.adminNotes ?? ''}
              placeholder="Ex.: combinado Pix todo dia 5, aguardando confirmação..."
              rows={2}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="submit" variant="secondary" fullWidth loading={pending}>
                Salvar assinatura
              </Button>
              <Button
                type="button"
                fullWidth
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await markPaid(business.id);
                    if (result.error) return error('Não foi possível marcar', result.error);
                    success('Marcado como pago — vencimento +30 dias');
                    router.refresh();
                  })
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar como pago (+30 dias)
              </Button>
            </div>
          </form>

          {payments.length > 0 && (
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Histórico de pagamentos
              </p>
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-white/55">
                      {formatDate(p.createdAt)} · {p.provider === 'manual' ? 'Manual (admin)' : p.provider}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-white">{brlCents(p.amountCents)}</span>
                      <Badge tone={p.status === 'paid' ? 'success' : 'neutral'}>{p.status}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Responsável" />
            {owner ? (
              <div className="space-y-1">
                <p className="text-[14px] font-medium text-white">{owner.name}</p>
                <p className="text-[13px] text-white/50">{owner.email}</p>
                <p className="mt-2 text-[12px] text-white/35">
                  Último acesso: {owner.lastLoginAt ? formatDateTime(owner.lastLoginAt) : 'nunca entrou'}
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-white/40">Nenhum usuário nessa conta.</p>
            )}

            {users.length > 1 && (
              <div className="mt-3 border-t border-white/[0.06] pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                  Outros usuários ({users.length - 1})
                </p>
                <ul className="space-y-1.5">
                  {users
                    .filter((u) => u.id !== owner?.id)
                    .map((u) => (
                      <li key={u.id} className="text-[13px] text-white/55">
                        {u.name} · {u.email}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Contato" />
            <div className="space-y-1.5 text-[13px] text-white/60">
              {business.whatsapp && <p>WhatsApp: {business.whatsapp}</p>}
              {business.phone && <p>Telefone: {business.phone}</p>}
              {business.email && <p>E-mail: {business.email}</p>}
              {!business.whatsapp && !business.phone && !business.email && (
                <p className="text-white/30">Nenhum contato cadastrado.</p>
              )}
            </div>
          </Card>

          {business.blocked && (
            <Card className="border-red-500/20">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-300/70">Conta bloqueada</p>
              <p className="mt-1.5 text-[13px] text-white/60">{business.blockedReason}</p>
              {business.blockedAt && (
                <p className="mt-1 text-[11px] text-white/30">Desde {formatDateTime(business.blockedAt)}</p>
              )}
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmBlock}
        onClose={() => setConfirmBlock(false)}
        title={`Bloquear "${business.name}"?`}
        description="O responsável não vai conseguir entrar no painel até você desbloquear."
        confirmLabel="Bloquear conta"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await toggleBlock(business.id, blockReason);
            if (result.error) return error('Não foi possível bloquear', result.error);
            success('Conta bloqueada');
            setConfirmBlock(false);
            router.refresh();
          })
        }
      >
        <Textarea
          label="Motivo (opcional, o cliente vê essa mensagem)"
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          placeholder="Ex.: pagamento em atraso há mais de 15 dias"
          rows={2}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Excluir "${business.name}" para sempre?`}
        description="Todos os clientes, orçamentos, pedidos, agendamentos e conteúdo dessa conta serão apagados permanentemente. Essa ação não pode ser desfeita."
        confirmLabel="Excluir tudo"
        danger
        loading={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteBusinessAccount(business.id);
            if (result?.error) error('Não foi possível excluir', result.error);
          })
        }
      />
    </>
  );

  function runBlockToggle() {
    startTransition(async () => {
      const result = await toggleBlock(business.id);
      if (result.error) return error('Não foi possível atualizar', result.error);
      success('Conta desbloqueada');
      router.refresh();
    });
  }
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-3.5">
      <p className="text-[11px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 font-display text-[18px] font-semibold text-white">{value}</p>
    </div>
  );
}
