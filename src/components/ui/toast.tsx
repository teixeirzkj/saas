'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (input: { title: string; description?: string; type?: ToastType }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" />,
  error: <XCircle className="h-[18px] w-[18px] text-red-400" />,
  warning: <AlertTriangle className="h-[18px] w-[18px] text-amber-400" />,
  info: <Info className="h-[18px] w-[18px] text-[rgb(var(--brand-300))]" />,
};

const accents: Record<ToastType, string> = {
  success: 'border-emerald-500/25',
  error: 'border-red-500/25',
  warning: 'border-amber-500/25',
  info: 'border-[rgb(var(--brand-500)/0.3)]',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = 'info' }: { title: string; description?: string; type?: ToastType }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((list) => [...list.slice(-3), { id, title, description, type }]);
      setTimeout(() => dismiss(id), type === 'error' ? 6500 : 4200);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, type: 'success' }),
      error: (title, description) => toast({ title, description, type: 'error' }),
      info: (title, description) => toast({ title, description, type: 'info' }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border bg-ink-900/95 p-4 shadow-lift backdrop-blur-xl',
                accents[t.type],
              )}
              role="status"
            >
              <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.description && <p className="mt-0.5 text-xs leading-relaxed text-white/55">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fechar"
                className="shrink-0 rounded-lg p-1 text-white/35 transition hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}
