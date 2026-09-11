import { AppShell } from '@/components/layout/app-shell';
import { ThemeStyle } from '@/components/theme/theme-style';
import { requireBusiness } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTheme } from '@/lib/themes';

import { markAllNotificationsRead } from './actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business, plan, subscription } = await requireBusiness();

  // Só dados serializáveis atravessam a fronteira Server → Client aqui: a
  // montagem do menu (que carrega componentes de ícone) roda dentro do
  // AppShell, no client. Ver comentário na assinatura de AppShell.
  const theme = getTheme(business.segment);

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, title: true, body: true, type: true, href: true, read: true, createdAt: true },
    }),
    db.notification.count({ where: { businessId: business.id, read: false } }),
  ]);

  return (
    <>
      <ThemeStyle theme={theme} brandColor={business.brandColor} />
      <AppShell
        user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
        business={{ name: business.name, slug: business.slug }}
        plan={{
          name: plan.name,
          code: plan.code,
          aiUsed: subscription?.aiUsed ?? 0,
          aiCredits: plan.limits.aiCredits,
        }}
        navOrder={theme.navOrder}
        catalogLabel={theme.terminology.catalogLabel}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllNotificationsRead}
      >
        {children}
      </AppShell>
    </>
  );
}
