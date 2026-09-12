'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Ban, Search, ShieldAlert, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/misc';
import { brl, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Account = {
  id: string;
  name: string;
  slug: string;
  segment: string;
  blocked: boolean;
  createdAt: Date;
  owner: { name: string; email: string; lastLoginAt: Date | null } | null;
  customerCount: number;
  plan: {
    code: string;
    name: string;
    priceCents: number;
    status: string;
    currentPeriodEnd: Date;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Em dia',
  trialing: 'Em teste',
  past_due: 'Devendo',
  canceled: 'Cancelado',
};

export function AdminDashboard({
  accounts,
  totalMrr,
  overdueCount,
  blockedCount,
}: {
  accounts: Account[];
  totalMrr: number;
  overdueCount: number;
  blockedCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.slug.toLowerCase().includes(term) ||
        a.owner?.email.toLowerCase().includes(term),
    );
  }, [accounts, search]);

  const now = new Date();

  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-[24px] font-semibold text-white">Contas</h1>
        <p className="text-sm text-white/45">{accounts.length} negócios cadastrados na plataforma.</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/50">MRR (contas em dia)</span>
            <Wallet className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 font-display text-[22px] font-semibold text-white">{brl(totalMrr / 100)}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/50">Contas devendo</span>
            <AlertTriangle className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2 font-display text-[22px] font-semibold text-white">{overdueCount}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/50">Contas bloqueadas</span>
            <Ban className="h-4 w-4 text-red-300" />
          </div>
          <p className="mt-2 font-display text-[22px] font-semibold text-white">{blockedCount}</p>
        </Card>
      </div>

      <SearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, link ou e-mail do responsável..."
        className="mb-4 max-w-md"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhuma conta encontrada" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead className="border-b border-white/[0.06] bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Negócio
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((account) => {
                  const overdue =
                    !account.blocked &&
                    account.plan &&
                    account.plan.currentPeriodEnd < now &&
                    account.plan.status !== 'canceled';

                  return (
                    <tr
                      key={account.id}
                      onClick={() => router.push(`/admin/contas/${account.id}`)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-white">{account.name}</p>
                        <p className="mt-0.5 text-xs text-white/35">
                          /{account.slug} · {account.customerCount} clientes · desde{' '}
                          {formatDate(account.createdAt, { month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-white/70">
                        {account.owner ? (
                          <>
                            <p>{account.owner.name}</p>
                            <p className="mt-0.5 text-xs text-white/35">{account.owner.email}</p>
                          </>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-white/70">{account.plan?.name ?? '—'}</td>
                      <td className={cn('px-4 py-3.5', overdue ? 'font-medium text-red-300' : 'text-white/60')}>
                        {account.plan ? formatDate(account.plan.currentPeriodEnd) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {account.blocked && (
                            <Badge tone="danger">
                              <ShieldAlert className="h-3 w-3" />
                              Bloqueada
                            </Badge>
                          )}
                          {!account.blocked && overdue && <Badge tone="warning">Devendo</Badge>}
                          {!account.blocked && !overdue && account.plan && (
                            <Badge tone="success">{STATUS_LABEL[account.plan.status] ?? account.plan.status}</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
