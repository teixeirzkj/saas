import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'purple' | 'success' | 'danger' | 'warning' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/[0.06] text-white/60',
  purple: 'border-[rgb(var(--brand-500)/0.3)] bg-[rgb(var(--brand-500)/0.12)] text-[rgb(var(--brand-200))]',
  success: 'border-emerald-500/25 bg-emerald-500/12 text-emerald-300',
  danger: 'border-red-500/25 bg-red-500/12 text-red-300',
  warning: 'border-amber-500/25 bg-amber-500/12 text-amber-300',
  info: 'border-sky-500/25 bg-sky-500/12 text-sky-300',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Badge a partir de mapas de status (QUOTE_STATUS, ORDER_STATUS, etc.) */
export function StatusBadge({
  status,
  map,
  className,
}: {
  status: string;
  map: Record<string, { label: string; tone: string }>;
  className?: string;
}) {
  const item = map[status] ?? { label: status, tone: 'neutral' };
  return (
    <Badge tone={item.tone as Tone} className={className} dot>
      {item.label}
    </Badge>
  );
}
