'use client';

import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Tabela responsiva: no desktop vira <table>, no mobile os componentes que a usam
 * renderizam MobileCard (as tabelas "viram cards" conforme o requisito de UX).
 */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('surface overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-white/[0.06] bg-white/[0.02]">{children}</thead>;
}

export function TH({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/40',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/[0.04]">{children}</tbody>;
}

export function TR({
  children,
  onClick,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  index?: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.025, 0.3) }}
      onClick={onClick}
      className={cn('transition-colors', onClick && 'cursor-pointer hover:bg-white/[0.03]', className)}
    >
      {children}
    </motion.tr>
  );
}

export function TD({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <td
      className={cn(
        'px-4 py-3.5 text-white/75',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

/** Cartão usado no lugar da linha da tabela em telas pequenas. */
export function MobileCard({
  children,
  onClick,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn('surface p-4', onClick && 'cursor-pointer active:scale-[0.99]', className)}
    >
      {children}
    </motion.div>
  );
}

export function CellStack({ title, subtitle }: { title: React.ReactNode; subtitle?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-white">{title}</p>
      {subtitle && <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>}
    </div>
  );
}
