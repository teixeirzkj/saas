'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  Loader2,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

type Result = {
  id: string;
  type: 'cliente' | 'orcamento' | 'pedido' | 'agendamento' | 'produto' | 'negociacao';
  title: string;
  subtitle?: string;
  href: string;
};

const TYPE_META: Record<Result['type'], { icon: typeof Users; label: string }> = {
  cliente: { icon: Users, label: 'Cliente' },
  orcamento: { icon: FileText, label: 'Orçamento' },
  pedido: { icon: ShoppingBag, label: 'Pedido' },
  agendamento: { icon: Calendar, label: 'Agendamento' },
  produto: { icon: ShoppingBag, label: 'Produto' },
  negociacao: { icon: TrendingUp, label: 'Negociação' },
};

const QUICK_ACTIONS: Result[] = [
  { id: 'q1', type: 'orcamento', title: 'Criar novo orçamento', href: '/orcamentos/novo' },
  { id: 'q2', type: 'cliente', title: 'Cadastrar cliente', href: '/clientes?novo=1' },
  { id: 'q3', type: 'agendamento', title: 'Novo compromisso', href: '/agenda?novo=1' },
  { id: 'q4', type: 'negociacao', title: 'Ver painel do CRM', href: '/crm' },
  { id: 'q5', type: 'produto', title: 'Gerenciar catálogo', href: '/catalogo' },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Falha na busca');
        const data = (await res.json()) as { results: Result[] };
        setResults(data.results);
        setCursor(0);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const items = useMemo(() => (query.trim().length < 2 ? QUICK_ACTIONS : results), [query, results]);

  const go = (item: Result) => {
    onClose();
    router.push(item.href);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, items.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      }
      if (e.key === 'Enter' && items[cursor]) {
        e.preventDefault();
        go(items[cursor]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: -14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/97 shadow-lift backdrop-blur-2xl"
        role="dialog"
        aria-label="Busca global"
      >
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
          <Search className="h-4 w-4 shrink-0 text-white/35" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, orçamentos, pedidos, produtos..."
            className="h-14 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[rgb(var(--brand-300))]" />}
          <button
            onClick={onClose}
            aria-label="Fechar busca"
            className="shrink-0 rounded-lg p-1.5 text-white/35 transition hover:bg-white/[0.07] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {query.trim().length < 2 && (
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">
              Ações rápidas
            </p>
          )}

          {items.length === 0 && !loading && query.trim().length >= 2 && (
            <div className="px-4 py-10 text-center">
              <Sparkles className="mx-auto mb-3 h-5 w-5 text-white/20" />
              <p className="text-[13px] text-white/45">
                Nada encontrado para <span className="text-white">&ldquo;{query}&rdquo;</span>
              </p>
              <p className="mt-1 text-[11px] text-white/25">Tente o nome do cliente, o número do orçamento ou do pedido.</p>
            </div>
          )}

          {items.map((item, i) => {
            const Icon = TYPE_META[item.type].icon;
            return (
              <button
                key={item.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  i === cursor ? 'bg-[rgb(var(--brand-500)/0.12)]' : 'hover:bg-white/[0.04]',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    i === cursor
                      ? 'border-[rgb(var(--brand-500)/0.3)] bg-[rgb(var(--brand-500)/0.15)] text-[rgb(var(--brand-200))]'
                      : 'border-white/[0.07] bg-white/[0.03] text-white/45',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-white">{item.title}</span>
                  {item.subtitle && (
                    <span className="mt-0.5 block truncate text-[11.5px] text-white/40">{item.subtitle}</span>
                  )}
                </span>
                <span className="shrink-0 rounded-md border border-white/[0.07] bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-white/35">
                  {TYPE_META[item.type].label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-white/[0.06] bg-ink-950/40 px-4 py-2.5 text-[10px] text-white/30">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5">Enter</kbd> abrir
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5">Esc</kbd> fechar
          </span>
        </div>
      </motion.div>
    </div>
  );
}
