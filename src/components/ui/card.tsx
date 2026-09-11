'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';

export function Card({
  className,
  hover,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div className={cn('surface p-5', hover && 'surface-hover', className)} {...props}>
      {children}
    </div>
  );
}

/** Card animado — entrada suave, opcionalmente escalonada por índice. */
export function MotionCard({
  className,
  hover = true,
  delay = 0,
  children,
  ...props
}: HTMLMotionProps<'div'> & { hover?: boolean; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn('surface p-5', hover && 'surface-hover', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.25)] bg-[rgb(var(--brand-500)/0.12)] text-[rgb(var(--brand-200))]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-white">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-white/45">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Card de métrica do dashboard. */
export function StatCard({
  label,
  value,
  delta,
  icon,
  hint,
  delay = 0,
  href,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  hint?: string;
  delay?: number;
  href?: string;
}) {
  const content = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <span className="text-[13px] font-medium text-white/50">{label}</span>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--brand-500)/0.2)] bg-[rgb(var(--brand-500)/0.1)] text-[rgb(var(--brand-200))]">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2.5">
        <span className="font-display text-[26px] font-semibold leading-none tracking-tight text-white">{value}</span>
        {delta && (
          <span
            className={cn(
              'mb-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
              delta.positive ? 'bg-emerald-500/12 text-emerald-300' : 'bg-red-500/12 text-red-300',
            )}
          >
            {delta.positive ? '+' : ''}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-white/35">{hint}</p>}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="surface surface-hover p-5"
    >
      {href ? (
        <a href={href} className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );
}
