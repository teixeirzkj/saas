'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'whatsapp' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200 ease-spring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-[rgb(var(--brand-500))] to-[rgb(var(--brand-700))] text-white shadow-[0_8px_28px_-12px_rgba(139,47,255,0.9)] hover:from-[rgb(var(--brand-400))] hover:to-[rgb(var(--brand-600))] hover:shadow-[0_12px_36px_-12px_rgba(139,47,255,1)]',
  secondary: 'bg-white/[0.07] text-white hover:bg-white/[0.12] border border-white/[0.08]',
  subtle: 'bg-[rgb(var(--brand-500)/0.12)] text-[rgb(var(--brand-200))] hover:bg-[rgb(var(--brand-500)/0.2)] border border-[rgb(var(--brand-500)/0.25)]',
  ghost: 'text-white/70 hover:bg-white/[0.06] hover:text-white',
  outline: 'border border-white/12 bg-transparent text-white/85 hover:border-[rgb(var(--brand-400)/0.45)] hover:bg-[rgb(var(--brand-500)/0.1)]',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25',
  success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25',
  whatsapp:
    'bg-[#25D366]/12 text-[#5BEB94] border border-[#25D366]/30 hover:bg-[#25D366]/22 hover:border-[#25D366]/50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-[15px] rounded-2xl',
  icon: 'h-11 w-11',
  'icon-sm': 'h-9 w-9',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
};

export function ButtonLink({ className, variant = 'primary', size = 'md', fullWidth, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    />
  );
}

/** Link externo (WhatsApp, gateway, etc.) com a mesma aparência de botão. */
export function ButtonAnchor({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; fullWidth?: boolean }) {
  return (
    <a
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      target={props.target ?? '_blank'}
      rel={props.rel ?? 'noopener noreferrer'}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-[rgb(var(--brand-300))]', className)} aria-hidden />;
}
