'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CreditCard,
  ExternalLink,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { logoutAction } from '@/app/(auth)/actions';
import { CommandPalette } from '@/components/layout/command-palette';
import { Avatar } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown';
import { cn, relativeTime } from '@/lib/utils';

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
};

const TYPE_DOTS: Record<string, string> = {
  order: 'bg-sky-400',
  quote: 'bg-[rgb(var(--brand-400))]',
  appointment: 'bg-amber-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  info: 'bg-white/40',
};

export function Topbar({
  user,
  business,
  notifications,
  unreadCount,
  onOpenMenu,
  onMarkAllRead,
}: {
  user: { name: string; email: string; avatarUrl: string | null };
  business: { name: string; slug: string };
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenMenu: () => void;
  onMarkAllRead: () => Promise<void>;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <button
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          className="-ml-1 rounded-xl p-2.5 text-white/55 transition hover:bg-white/[0.07] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Busca global */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="group flex h-10 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-ink-850/50 px-3 text-left text-[13px] text-white/35 transition-all hover:border-[rgb(var(--brand-500)/0.25)] hover:bg-ink-850 md:max-w-sm"
        >
          <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-[rgb(var(--brand-300))]" />
          <span className="flex-1 truncate">Buscar clientes, orçamentos, pedidos...</span>
          <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-white/40 md:block">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ButtonLink href="/ia" variant="subtle" size="sm" className="hidden sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            Criar com IA
          </ButtonLink>

          {/* Ação rápida */}
          <Dropdown
            width="w-52"
            trigger={
              <Button size="icon-sm" variant="primary" aria-label="Criar novo">
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            {(close) => (
              <>
                <DropdownLabel>Criar novo</DropdownLabel>
                <DropdownItem
                  onClick={() => {
                    close();
                    router.push('/orcamentos/novo');
                  }}
                >
                  Orçamento
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    router.push('/agenda?novo=1');
                  }}
                >
                  Compromisso
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    router.push('/clientes?novo=1');
                  }}
                >
                  Cliente
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    router.push('/crm?novo=1');
                  }}
                >
                  Negociação
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    router.push('/catalogo?novo=1');
                  }}
                >
                  Produto
                </DropdownItem>
              </>
            )}
          </Dropdown>

          {/* Notificações */}
          <Dropdown
            width="w-[330px]"
            trigger={
              <button
                aria-label={`Notificações${unreadCount ? ` (${unreadCount} não lidas)` : ''}`}
                className="relative rounded-xl p-2.5 text-white/55 transition hover:bg-white/[0.07] hover:text-white"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[rgb(var(--brand-500))] px-1 text-[9px] font-bold text-white shadow-glow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
          >
            {(close) => (
              <>
                <div className="flex items-center justify-between px-3 pb-2 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Notificações</p>
                  {unreadCount > 0 && (
                    <button
                      disabled={pending}
                      onClick={() => startTransition(async () => void (await onMarkAllRead()))}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--brand-300))] transition hover:text-[rgb(var(--brand-200))] disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Marcar como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-8 text-center text-[13px] text-white/35">
                      Nenhuma notificação por aqui.
                    </p>
                  ) : (
                    notifications.map((n) => <NotificationRow key={n.id} item={n} onNavigate={close} />)
                  )}
                </div>
              </>
            )}
          </Dropdown>

          {/* Perfil */}
          <Dropdown
            width="w-60"
            trigger={
              <button className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white/[0.06]">
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="hidden min-w-0 pr-1 text-left lg:block">
                  <span className="block max-w-[120px] truncate text-[13px] font-medium leading-tight text-white">
                    {user.name}
                  </span>
                  <span className="block max-w-[120px] truncate text-[11px] leading-tight text-white/35">
                    {business.name}
                  </span>
                </span>
              </button>
            }
          >
            {(close) => (
              <>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
                    <p className="truncate text-[11px] text-white/40">{user.email}</p>
                  </div>
                </div>
                <DropdownSeparator />
                <DropdownItem
                  icon={<UserIcon className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    router.push('/configuracoes/perfil');
                  }}
                >
                  Meu perfil
                </DropdownItem>
                <DropdownItem
                  icon={<Settings className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    router.push('/configuracoes');
                  }}
                >
                  Configurações
                </DropdownItem>
                <DropdownItem
                  icon={<CreditCard className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    router.push('/configuracoes/assinatura');
                  }}
                >
                  Assinatura
                </DropdownItem>
                <DropdownSeparator />
                <DropdownLabel>Páginas públicas</DropdownLabel>
                <DropdownItem
                  icon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => window.open(`/catalogo/${business.slug}`, '_blank')}
                >
                  Ver catálogo
                </DropdownItem>
                <DropdownItem
                  icon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => window.open(`/agendar/${business.slug}`, '_blank')}
                >
                  Ver agendamento
                </DropdownItem>
                <DropdownSeparator />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-red-300 transition-colors hover:bg-red-500/12"
                  >
                    <LogOut className="h-4 w-4 opacity-70" />
                    Sair
                  </button>
                </form>
              </>
            )}
          </Dropdown>
        </div>
      </header>

      <AnimatePresence>
        {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      </AnimatePresence>

      <PaletteShortcut onOpen={() => setPaletteOpen(true)} />
    </>
  );
}

function NotificationRow({ item, onNavigate }: { item: NotificationItem; onNavigate: () => void }) {
  const className = cn(
    'flex gap-2.5 rounded-xl px-3 py-2.5 transition-colors',
    item.href && 'cursor-pointer hover:bg-white/[0.05]',
    !item.read && 'bg-[rgb(var(--brand-500))]/[0.05]',
  );

  const body = (
    <>
      <span
        className={cn(
          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
          TYPE_DOTS[item.type] ?? 'bg-white/40',
          item.read && 'opacity-30',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-snug text-white">{item.title}</span>
        {item.body && (
          <span className="mt-0.5 block text-[11.5px] leading-relaxed text-white/45">{item.body}</span>
        )}
        <span className="mt-1 block text-[10px] text-white/25">{relativeTime(item.createdAt)}</span>
      </span>
    </>
  );

  if (!item.href) return <div className={className}>{body}</div>;

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {body}
    </Link>
  );
}

/** Ctrl+K / Cmd+K abre a busca global. */
function PaletteShortcut({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);

  return null;
}

/** Barra de navegação inferior — substitui a sidebar no celular. */
export function MobileNav({ items }: { items: { href: string; label: string; icon: React.ReactNode; active: boolean }[] }) {
  return (
    <nav className="safe-bottom glass fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t lg:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
            item.active ? 'text-[rgb(var(--brand-200))]' : 'text-white/40',
          )}
        >
          {item.active && (
            <motion.span
              layoutId="mobile-nav-active"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-[rgb(var(--brand-400))]"
            />
          )}
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
