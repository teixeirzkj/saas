'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}

function Portal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

// ------------------------------------------------------------------ Modal

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useLockScroll(open);
  useEscape(open, onClose);

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/[0.08] bg-ink-900/95 shadow-lift backdrop-blur-2xl sm:rounded-2xl',
                widths[size],
              )}
            >
              {(title || description) && (
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5 pb-4">
                  <div className="min-w-0">
                    {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
                    {description && <p className="mt-1 text-xs leading-relaxed text-white/45">{description}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="-mr-1 -mt-1 shrink-0 rounded-xl p-2 text-white/40 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
              {footer && (
                <div className="safe-bottom flex flex-col-reverse gap-2 border-t border-white/[0.06] bg-ink-950/40 p-4 sm:flex-row sm:justify-end">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

// ------------------------------------------------------------------ Drawer

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'left';
}) {
  useLockScroll(open);
  useEscape(open, onClose);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[90]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: side === 'right' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: side === 'right' ? '100%' : '-100%' }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className={cn(
                'absolute top-0 flex h-full w-full max-w-md flex-col border-white/[0.08] bg-ink-900/97 shadow-lift backdrop-blur-2xl',
                side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
              )}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-5">
                <div className="min-w-0">
                  {title && <h2 className="truncate text-base font-semibold text-white">{title}</h2>}
                  {description && <p className="mt-1 text-xs text-white/45">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="-mr-1 -mt-1 shrink-0 rounded-xl p-2 text-white/40 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
              {footer && (
                <div className="safe-bottom flex gap-2 border-t border-white/[0.06] bg-ink-950/40 p-4">{footer}</div>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

// ------------------------------------------------------------------ Confirm

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Tem certeza?',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger,
  loading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  /** Conteúdo extra opcional, renderizado abaixo da descrição (ex.: um campo de motivo). */
  children?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-white/60">
        {description ?? 'Essa ação não pode ser desfeita.'}
      </p>
      {children && <div className="mt-3">{children}</div>}
    </Modal>
  );
}
