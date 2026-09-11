'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
  width = 'w-56',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: 'left' | 'right';
  className?: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/97 p-1.5 shadow-lift backdrop-blur-2xl',
              width,
              align === 'right' ? 'right-0' : 'left-0',
            )}
            role="menu"
          >
            {typeof children === 'function' ? children(close) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  children,
  icon,
  onClick,
  danger,
  className,
  disabled,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors disabled:opacity-40',
        danger ? 'text-red-300 hover:bg-red-500/12' : 'text-white/75 hover:bg-white/[0.07] hover:text-white',
        className,
      )}
    >
      {icon && <span className="shrink-0 opacity-70">{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1.5 h-px bg-white/[0.07]" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">{children}</p>;
}
