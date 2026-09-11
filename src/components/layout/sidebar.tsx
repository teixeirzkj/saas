'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, X, Zap } from 'lucide-react';
import { useEffect } from 'react';

import { Logo } from '@/components/shared/logo';
import { Progress } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

import { GROUP_LABELS, isActive, type NavItem } from './nav-items';

type PlanInfo = { name: string; code: string; aiUsed: number; aiCredits: number };

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200',
        active ? 'text-white' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/85',
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-xl border border-[rgb(var(--brand-500)/0.25)] bg-gradient-to-r from-[rgb(var(--brand-500)/0.18)] to-[rgb(var(--brand-500))]/[0.04]"
        />
      )}
      <Icon
        className={cn(
          'relative h-[18px] w-[18px] shrink-0 transition-colors',
          active ? 'text-[rgb(var(--brand-300))]' : 'text-white/40 group-hover:text-white/70',
        )}
      />
      <span className="relative truncate">{item.label}</span>
      {active && <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-400))] shadow-glow-sm" />}
    </Link>
  );
}

function SidebarContent({
  navItems,
  plan,
  onNavigate,
}: {
  navItems: NavItem[];
  plan: PlanInfo;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups: NavItem['group'][] = ['principal', 'modulos', 'gestao'];
  const showUpgrade = plan.code !== 'business';

  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const items = navItems.filter((i) => i.group === group);
          return (
            <div key={group}>
              {GROUP_LABELS[group] && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/25">
                  {GROUP_LABELS[group]}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Uso da IA + upgrade */}
      <div className="border-t border-white/[0.06] p-3">
        {plan.aiCredits > 0 && (
          <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-medium text-white/55">Nexo IA</span>
              <span className="font-semibold text-white/75">
                {plan.aiUsed}/{plan.aiCredits}
              </span>
            </div>
            <Progress value={plan.aiUsed} max={plan.aiCredits} />
          </div>
        )}

        {showUpgrade ? (
          <Link
            href="/planos"
            onClick={onNavigate}
            className="ring-gradient group block rounded-xl bg-gradient-to-br from-[rgb(var(--brand-600)/0.25)] to-[rgb(var(--brand-900)/0.3)] p-3.5 transition-all duration-300 hover:from-[rgb(var(--brand-500)/0.3)]"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-[rgb(var(--brand-300))]" />
              <span className="text-[12px] font-semibold text-white">Plano {plan.name}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">
              {plan.code === 'free'
                ? 'Libere clientes e orçamentos ilimitados.'
                : 'Mais IA, automações e equipe no plano Negócio.'}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--brand-200))]">
              Fazer upgrade
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="text-[11px] font-semibold text-white/70">Plano {plan.name}</p>
            <p className="mt-0.5 text-[10px] text-white/35">Todos os recursos liberados</p>
          </div>
        )}
      </div>
    </>
  );
}

/** Sidebar fixa (desktop). */
export function Sidebar({ navItems, plan }: { navItems: NavItem[]; plan: PlanInfo }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/[0.06] bg-ink-950/80 backdrop-blur-2xl lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-white/[0.06] px-5">
        <Logo href="/dashboard" />
      </div>
      <SidebarContent navItems={navItems} plan={plan} />
    </aside>
  );
}

/** Sidebar retrátil (mobile/tablet). */
export function MobileSidebar({
  open,
  onClose,
  navItems,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  plan: PlanInfo;
}) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
    // fecha ao navegar
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 flex w-[272px] flex-col border-r border-white/[0.07] bg-ink-950/97 backdrop-blur-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
              <Logo href="/dashboard" />
              <button
                onClick={onClose}
                aria-label="Fechar menu"
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent navItems={navItems} plan={plan} onNavigate={onClose} />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
