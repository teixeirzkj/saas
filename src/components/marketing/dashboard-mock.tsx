'use client';

import { motion } from 'framer-motion';
import { Calendar, FileText, ShoppingBag, TrendingUp, Users } from 'lucide-react';

import { SalesAreaChart } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

const FAKE_SALES = [
  { label: 'Abr', value: 4200 },
  { label: 'Mai', value: 5100 },
  { label: 'Jun', value: 4800 },
  { label: 'Jul', value: 6300 },
  { label: 'Ago', value: 7100 },
  { label: 'Set', value: 8400 },
];

const FAKE_STATS = [
  { label: 'Vendas do mês', value: 'R$ 8.420', icon: TrendingUp },
  { label: 'Orçamentos enviados', value: '18', icon: FileText },
  { label: 'Clientes', value: '142', icon: Users },
  { label: 'Agendamentos hoje', value: '6', icon: Calendar },
];

const FAKE_ACTIVITY = [
  { title: 'Novo cliente cadastrado', time: '2 min' },
  { title: 'Orçamento #1042 aprovado', time: '18 min' },
  { title: 'Novo pedido recebido', time: '1 h' },
];

/**
 * Demonstração visual do dashboard usada no hero da landing page.
 * Reaproveita os componentes reais do design system (StatCard/chart) com
 * dados fictícios — nada de imagem estática ou screenshot externo.
 */
export function DashboardMock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="surface relative mx-auto w-full max-w-3xl overflow-hidden p-4 shadow-lift sm:p-6"
      style={{ perspective: 1200 }}
    >
      {/* Barra de janela */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="ml-3 rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/25">
          nexo.app/dashboard
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-[15px] font-semibold text-white">Bom dia, João 👋</p>
          <p className="mt-0.5 text-[11px] text-white/35">Studio Aurora</p>
        </div>
        <Badge tone="purple">Plano Profissional</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {FAKE_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <stat.icon className="h-3.5 w-3.5 text-nexo-300" />
            <p className="mt-2 font-display text-[16px] font-semibold text-white">{stat.value}</p>
            <p className="mt-0.5 text-[10px] text-white/35">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:col-span-2"
        >
          <p className="mb-1 text-[11px] font-medium text-white/50">Vendas dos últimos 6 meses</p>
          <SalesAreaChart data={FAKE_SALES} height={140} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <p className="mb-2 text-[11px] font-medium text-white/50">Atividades recentes</p>
          <ul className="space-y-2.5">
            {FAKE_ACTIVITY.map((item) => (
              <li key={item.title} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-nexo-400" />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-white/60">{item.title}</span>
                <span className="shrink-0 text-[9.5px] text-white/25">{item.time}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Ícones dos módulos flutuando ao redor */}
      <FloatingIcon icon={ShoppingBag} className="-right-4 -top-4 hidden sm:flex" delay={1.1} />
      <FloatingIcon icon={FileText} className="-left-4 top-1/3 hidden sm:flex" delay={1.25} />
    </motion.div>
  );
}

function FloatingIcon({
  icon: Icon,
  className,
  delay,
}: {
  icon: typeof ShoppingBag;
  className: string;
  delay: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
      }}
      className={`absolute z-10 h-11 w-11 items-center justify-center rounded-2xl border border-nexo-500/25 bg-ink-900/90 text-nexo-200 shadow-glow-sm backdrop-blur-xl ${className}`}
    >
      <Icon className="m-auto h-5 w-5" />
    </motion.span>
  );
}
