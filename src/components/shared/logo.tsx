import Link from 'next/link';

import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-nexo-400 via-nexo-600 to-nexo-900 shadow-[0_6px_20px_-8px_rgba(139,47,255,0.9)]',
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.5),transparent_58%)]" />
      {/* Nós conectados: a marca são dois pontos ligados por uma diagonal */}
      <svg viewBox="0 0 24 24" className="relative h-[18px] w-[18px] text-white" fill="none">
        <path d="M7 17V7l10 10V7" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = '/',
  showText = true,
  size = 'md',
}: {
  className?: string;
  href?: string | null;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const marks = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' };
  const texts = { sm: 'text-[15px]', md: 'text-[17px]', lg: 'text-xl' };

  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={marks[size]} />
      {showText && (
        <span className={cn('font-display font-bold tracking-[-0.02em] text-white', texts[size])}>
          NEXO
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="transition-opacity hover:opacity-80" aria-label="NEXO — início">
      {content}
    </Link>
  );
}
