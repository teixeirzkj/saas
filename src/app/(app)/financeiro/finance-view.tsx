'use client';

import { Download, FileText, Package, TrendingUp, Users } from 'lucide-react';

import { Card, CardHeader, StatCard } from '@/components/ui/card';
import { ChartLegend, DonutChart, SalesAreaChart, SimpleBarChart } from '@/components/ui/chart';
import { EmptyState, PageHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { brl } from '@/lib/utils';

export function FinanceView({
  monthRevenue,
  prevRevenue,
  orderCount,
  quoteCount,
  orderRevenue,
  quoteRevenue,
  monthly,
  byPayment,
  topProducts,
  topCustomers,
}: {
  monthRevenue: number;
  prevRevenue: number;
  orderCount: number;
  quoteCount: number;
  orderRevenue: number;
  quoteRevenue: number;
  monthly: { label: string; value: number }[];
  byPayment: { label: string; value: number }[];
  topProducts: { label: string; value: number; quantity: number }[];
  topCustomers: { id: string; name: string; totalValue: number }[];
}) {
  const delta = prevRevenue > 0 ? Math.round(((monthRevenue - prevRevenue) / prevRevenue) * 100) : null;

  const exportCsv = () => {
    const rows = [
      ['Mês', 'Faturamento'],
      ...monthly.map((m) => [m.label, String(m.value)]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-nexo.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Acompanhe suas vendas de orçamentos e do catálogo em um só lugar."
        action={
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Faturamento do mês"
          value={brl(monthRevenue)}
          delta={delta != null ? { value: `${delta}%`, positive: delta >= 0 } : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Vendas do catálogo"
          value={brl(orderRevenue)}
          hint={`${orderCount} ${orderCount === 1 ? 'pedido' : 'pedidos'}`}
          icon={<Package className="h-4 w-4" />}
          delay={0.06}
        />
        <StatCard
          label="Orçamentos aprovados"
          value={brl(quoteRevenue)}
          hint={`${quoteCount} ${quoteCount === 1 ? 'orçamento' : 'orçamentos'}`}
          icon={<FileText className="h-4 w-4" />}
          delay={0.12}
        />
        <StatCard
          label="Ticket médio"
          value={brl(orderCount + quoteCount > 0 ? monthRevenue / (orderCount + quoteCount) : 0)}
          icon={<Users className="h-4 w-4" />}
          delay={0.18}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Faturamento dos últimos 6 meses"
            description="Orçamentos aprovados + pedidos do catálogo"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <SalesAreaChart data={monthly} />
        </Card>

        <Card>
          <CardHeader title="Por forma de pagamento" description="Pedidos deste mês" icon={<Package className="h-4 w-4" />} />
          {byPayment.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-white/40">Nenhum pedido este mês ainda.</p>
          ) : (
            <>
              <DonutChart data={byPayment} currency />
              <ChartLegend data={byPayment} />
            </>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Produtos mais vendidos" icon={<Package className="h-4 w-4" />} />
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/40">Nenhuma venda registrada ainda.</p>
          ) : (
            <SimpleBarChart data={topProducts} currency height={220} />
          )}
        </Card>

        <Card>
          <CardHeader title="Melhores clientes" description="Por valor total gerado" icon={<Users className="h-4 w-4" />} />
          {topCustomers.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-white/40">Nenhum cliente com histórico de valor ainda.</p>
          ) : (
            <ul className="space-y-2.5">
              {topCustomers.map((customer, i) => (
                <li key={customer.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[11px] font-semibold text-white/50">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-white/80">{customer.name}</span>
                  <span className="shrink-0 font-display text-[13px] font-semibold text-[rgb(var(--brand-200))]">
                    {brl(customer.totalValue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
