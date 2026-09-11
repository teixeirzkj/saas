'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MobileSidebar, Sidebar } from '@/components/layout/sidebar';
import { buildMobileNav, buildNavItems, isActive, type NavKey } from '@/components/layout/nav-items';
import { MobileNav, Topbar, type NotificationItem } from '@/components/layout/topbar';

export function AppShell({
  user,
  business,
  plan,
  navOrder,
  catalogLabel,
  notifications,
  unreadCount,
  markAllRead,
  children,
}: {
  user: { name: string; email: string; avatarUrl: string | null };
  business: { name: string; slug: string };
  plan: { name: string; code: string; aiUsed: number; aiCredits: number };
  /**
   * Dados de tema puramente serializáveis (strings/arrays) — a montagem da
   * navegação em si (que carrega componentes de ícone do lucide-react) roda
   * aqui no client, nunca no Server Component pai. Ícones de componente não
   * podem atravessar a fronteira Server → Client como prop.
   */
  navOrder: NavKey[];
  catalogLabel: string;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = useMemo(
    () => buildNavItems(navOrder, { catalogo: catalogLabel }),
    [navOrder, catalogLabel],
  );
  const mobileNavItems = useMemo(() => buildMobileNav(navItems), [navItems]);

  const mobileItems = mobileNavItems.map((item) => {
    const Icon = item.icon;
    return {
      href: item.href,
      label: item.short ?? item.label,
      icon: <Icon className="h-[19px] w-[19px]" />,
      active: isActive(pathname, item.href),
    };
  });

  return (
    <div className="min-h-screen">
      <Sidebar navItems={navItems} plan={plan} />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} navItems={navItems} plan={plan} />

      <div className="lg:pl-[248px]">
        <Topbar
          user={user}
          business={business}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenMenu={() => setMenuOpen(true)}
          onMarkAllRead={markAllRead}
        />

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:pb-12">{children}</main>
      </div>

      <MobileNav items={mobileItems} />
    </div>
  );
}
