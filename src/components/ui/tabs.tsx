'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

import { cn } from '@/lib/utils';

export type TabItem = { value: string; label: string; count?: number; icon?: React.ReactNode };

/** Tabs com indicador animado (layoutId do Framer Motion). */
export function Tabs({
  items,
  value,
  onChange,
  className,
  size = 'md',
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const layoutId = useId();

  return (
    <div
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-ink-900/60 p-1',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative shrink-0 rounded-xl font-medium transition-colors duration-200',
              size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]',
              active ? 'text-white' : 'text-white/45 hover:text-white/75',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-xl border border-[rgb(var(--brand-500)/0.25)] bg-[rgb(var(--brand-500)/0.14)]"
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {item.icon}
              {item.label}
              {item.count != null && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                    active ? 'bg-[rgb(var(--brand-500)/0.25)] text-[rgb(var(--brand-100))]' : 'bg-white/[0.07] text-white/45',
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Pílulas de filtro simples (sem indicador animado). */
export function FilterPills({
  items,
  value,
  onChange,
}: {
  items: TabItem[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200',
              active
                ? 'border-[rgb(var(--brand-500)/0.4)] bg-[rgb(var(--brand-500)/0.16)] text-[rgb(var(--brand-100))]'
                : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/15 hover:text-white/80',
            )}
          >
            {item.label}
            {item.count != null && <span className="ml-1.5 opacity-60">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
