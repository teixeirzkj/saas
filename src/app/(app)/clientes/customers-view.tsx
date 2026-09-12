'use client';

import { useRouter } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { WhatsAppSend } from '@/components/shared/whatsapp-send';
import { BulkSendButton } from './bulk-send';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/input';
import { EmptyState, PageHeader, Progress } from '@/components/ui/misc';
import { CellStack, MobileCard, TBody, TD, TH, THead, TR, Table } from '@/components/ui/table';
import { FilterPills } from '@/components/ui/tabs';
import { CUSTOMER_STATUS } from '@/lib/constants';
import { brl, formatPhone, relativeTime } from '@/lib/utils';

import { CustomerFormModal } from './customer-form';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  status: string;
  source: string | null;
  totalValue: number;
  lastActivityAt: Date | null;
  counts: { quotes: number; orders: number; appointments: number };
};

export function CustomersView({
  customers,
  total,
  statusCounts,
  query,
  status,
  openNew,
  limit,
  planName,
  planCode,
  businessName,
}: {
  customers: Customer[];
  total: number;
  statusCounts: Record<string, number>;
  query: string;
  status: string;
  openNew: boolean;
  limit: number;
  planName: string;
  planCode: string;
  businessName: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [formOpen, setFormOpen] = useState(openNew);

  // Debounce da busca via query string (mantém a URL compartilhável)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (status !== 'todos') params.set('status', status);
      const qs = params.toString();
      if (search !== query) router.replace(qs ? `/clientes?${qs}` : '/clientes');
    }, 320);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const pills = useMemo(
    () => [
      { value: 'todos', label: 'Todos', count: total },
      ...Object.entries(CUSTOMER_STATUS).map(([value, meta]) => ({
        value,
        label: meta.label,
        count: statusCounts[value] ?? 0,
      })),
    ],
    [statusCounts, total],
  );

  const setStatus = (value: string) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (value !== 'todos') params.set('status', value);
    const qs = params.toString();
    router.replace(qs ? `/clientes?${qs}` : '/clientes');
  };

  const nearLimit = limit > 0 && total >= limit * 0.8;

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Um cadastro só, usado por todos os módulos do NEXO."
        action={
          <>
            <BulkSendButton customers={customers} businessName={businessName} planCode={planCode} />
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail ou empresa..."
            className="sm:max-w-md"
          />
          <FilterPills items={pills} value={status} onChange={setStatus} />

          {nearLimit && (
            <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">
                  {total} de {limit} clientes do plano {planName}
                </p>
                <Progress value={total} max={limit} className="mt-2 max-w-xs" />
              </div>
              <Button variant="subtle" size="sm" onClick={() => router.push('/planos')}>
                Liberar clientes ilimitados
              </Button>
            </div>
          )}
        </div>
      </PageHeader>

      {customers.length === 0 ? (
        query || status !== 'todos' ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Nenhum cliente encontrado"
            description="Tente outro termo de busca ou remova os filtros aplicados."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  router.replace('/clientes');
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="Você ainda não possui nenhum cliente."
            description="Cadastre o primeiro cliente e ele já estará disponível para orçamentos, agenda, pedidos e CRM."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Cadastrar primeiro cliente
              </Button>
            }
          />
        )
      ) : (
        <>
          {/* Desktop: tabela */}
          <div className="hidden lg:block">
            <Table>
              <THead>
                <TR>
                  <TH>Cliente</TH>
                  <TH>Contato</TH>
                  <TH>Última atividade</TH>
                  <TH align="right">Valor total</TH>
                  <TH>Situação</TH>
                  <TH align="right">Ações</TH>
                </TR>
              </THead>
              <TBody>
                {customers.map((customer, i) => (
                  <TR key={customer.id} index={i} onClick={() => router.push(`/clientes/${customer.id}`)}>
                    <TD>
                      <CellStack
                        title={customer.name}
                        subtitle={
                          customer.company ??
                          ([
                            customer.counts.quotes ? `${customer.counts.quotes} orç.` : null,
                            customer.counts.orders ? `${customer.counts.orders} pedidos` : null,
                            customer.counts.appointments ? `${customer.counts.appointments} agend.` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') ||
                            'Sem histórico ainda')
                        }
                      />
                    </TD>
                    <TD>
                      <p className="text-[13px] text-white/75">{formatPhone(customer.phone)}</p>
                      {customer.email && <p className="mt-0.5 text-xs text-white/35">{customer.email}</p>}
                    </TD>
                    <TD>
                      <span className="text-[13px] text-white/55">{relativeTime(customer.lastActivityAt)}</span>
                    </TD>
                    <TD align="right">
                      <span className="font-display text-[14px] font-semibold text-white">
                        {brl(customer.totalValue)}
                      </span>
                    </TD>
                    <TD>
                      <StatusBadge status={customer.status} map={CUSTOMER_STATUS} />
                    </TD>
                    <TD align="right">
                      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
                        {customer.phone && (
                          <WhatsAppSend
                            phone={customer.phone}
                            message={`Olá, ${customer.name.split(' ')[0]}! Tudo bem?`}
                            size="icon-sm"
                            variant="ghost"
                            iconOnly
                            label="Falar com cliente"
                          />
                        )}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 lg:hidden">
            {customers.map((customer, i) => (
              <MobileCard key={customer.id} index={i} onClick={() => router.push(`/clientes/${customer.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{customer.name}</p>
                    <p className="mt-0.5 text-[12px] text-white/40">{formatPhone(customer.phone)}</p>
                  </div>
                  <StatusBadge status={customer.status} map={CUSTOMER_STATUS} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/30">Valor total</p>
                    <p className="font-display text-[15px] font-semibold text-white">{brl(customer.totalValue)}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    {customer.phone && (
                      <WhatsAppSend
                        phone={customer.phone}
                        message={`Olá, ${customer.name.split(' ')[0]}! Tudo bem?`}
                        size="sm"
                        label="WhatsApp"
                      />
                    )}
                  </div>
                </div>

                {(customer.counts.quotes > 0 || customer.counts.orders > 0 || customer.counts.appointments > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {customer.counts.quotes > 0 && <Badge>{customer.counts.quotes} orçamentos</Badge>}
                    {customer.counts.orders > 0 && <Badge>{customer.counts.orders} pedidos</Badge>}
                    {customer.counts.appointments > 0 && <Badge>{customer.counts.appointments} agendamentos</Badge>}
                  </div>
                )}
              </MobileCard>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-white/25">
            Mostrando {customers.length} de {total} clientes
          </p>
        </>
      )}

      <CustomerFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          if (openNew) router.replace('/clientes');
        }}
        onSaved={(id) => router.push(`/clientes/${id}`)}
      />
    </>
  );
}
