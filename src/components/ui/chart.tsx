'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { brl, compactNumber } from '@/lib/utils';

const AXIS = { stroke: 'rgba(255,255,255,0.28)', fontSize: 11 };
const GRID = 'rgba(255,255,255,0.05)';

/** Paleta do produto: roxo como cor primária, tons frios/quentes de apoio. */
export const CHART_COLORS = ['#8B2FFF', '#B48CFF', '#5AA9FF', '#2FD98A', '#FFB020', '#FF6B8A'];

function ChartTooltip({
  active,
  payload,
  label,
  currency = true,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.09] bg-ink-900/96 px-3 py-2.5 shadow-lift backdrop-blur-xl">
      {label && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-[13px] font-medium text-white">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color ?? CHART_COLORS[0] }} />
          {entry.name && <span className="text-white/50">{entry.name}:</span>}
          {currency ? brl(entry.value ?? 0) : (entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function SalesAreaChart({
  data,
  height = 260,
  currency = true,
}: {
  data: { label: string; value: number }[];
  height?: number;
  currency?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="nexoArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B2FFF" stopOpacity={0.55} />
              <stop offset="60%" stopColor="#8B2FFF" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#8B2FFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={62}
            tickFormatter={(v) => (currency ? `R$ ${compactNumber(v)}` : compactNumber(v))}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: 'rgba(139,47,255,0.35)' }} />
          <Area
            type="monotone"
            dataKey="value"
            name="Vendas"
            stroke="#B48CFF"
            strokeWidth={2.2}
            fill="url(#nexoArea)"
            dot={false}
            activeDot={{ r: 4, fill: '#B48CFF', stroke: '#180334', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  height = 220,
  currency = false,
}: {
  data: { label: string; value: number }[];
  height?: number;
  currency?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} dy={8} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS} width={58} tickFormatter={(v) => compactNumber(v)} />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ fill: 'rgba(139,47,255,0.08)' }} />
          <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]} maxBarSize={38}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({
  data,
  height = 220,
  currency = false,
}: {
  data: { label: string; value: number }[];
  height?: number;
  currency?: boolean;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={{ height }} className="relative w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold text-white">
          {currency ? brl(total) : compactNumber(total)}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-white/35">Total</span>
      </div>
    </div>
  );
}

export function ChartLegend({ data }: { data: { label: string; value?: number }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {data.map((item, i) => (
        <li key={item.label} className="flex items-center gap-2 text-[12px] text-white/55">
          <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
