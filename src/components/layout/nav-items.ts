import {
  Calendar,
  FileText,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

/**
 * Este arquivo é client-safe de propósito (sem `import 'server-only'`): Sidebar,
 * Topbar e AppShell são Client Components. A lógica de tema (`src/lib/themes.ts`)
 * roda só no server — o layout do painel monta a navegação já pronta chamando
 * `buildNavItems`/`buildMobileNav` com os dados do tema (`navOrder`/`terminology`,
 * que são apenas strings/arrays simples) e passa o resultado como prop.
 */

export type NavKey =
  | 'dashboard'
  | 'orcamentos'
  | 'agenda'
  | 'catalogo'
  | 'crm'
  | 'ia'
  | 'clientes'
  | 'financeiro'
  | 'configuracoes';

export type NavItem = {
  key: NavKey;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Rótulo curto usado no menu inferior do mobile */
  short?: string;
  group: 'principal' | 'modulos' | 'gestao';
};

/** Navegação base, na ordem padrão (tema "outro"/NEXO). */
export const BASE_NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard', short: 'Início', icon: LayoutDashboard, group: 'principal' },
  { key: 'orcamentos', href: '/orcamentos', label: 'Orçamentos', short: 'Orç.', icon: FileText, group: 'modulos' },
  { key: 'agenda', href: '/agenda', label: 'Agenda', short: 'Agenda', icon: Calendar, group: 'modulos' },
  { key: 'catalogo', href: '/catalogo', label: 'Catálogo', short: 'Catálogo', icon: ShoppingBag, group: 'modulos' },
  { key: 'crm', href: '/crm', label: 'CRM', short: 'CRM', icon: TrendingUp, group: 'modulos' },
  { key: 'ia', href: '/ia', label: 'Nexo IA', short: 'IA', icon: Sparkles, group: 'modulos' },
  { key: 'clientes', href: '/clientes', label: 'Clientes', short: 'Clientes', icon: Users, group: 'gestao' },
  { key: 'financeiro', href: '/financeiro', label: 'Financeiro', short: 'Financ.', icon: Wallet, group: 'gestao' },
  { key: 'configuracoes', href: '/configuracoes', label: 'Configurações', short: 'Config.', icon: Settings, group: 'gestao' },
];

export const GROUP_LABELS: Record<NavItem['group'], string> = {
  principal: '',
  modulos: 'Módulos',
  gestao: 'Gestão',
};

export function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Monta a navegação para um tema: reordena os módulos (grupo "modulos") segundo
 * `navOrder` do tema — "Agenda" antes de "Catálogo" para uma barbearia, "Catálogo"
 * primeiro para um restaurante, etc. — e troca os rótulos conforme a terminologia
 * do nicho (ex.: "Catálogo" vira "Cardápio"). "Principal" e "Gestão" não mudam de
 * posição entre si, só o conteúdo do meio.
 */
export function buildNavItems(navOrder: NavKey[], labelOverrides: Partial<Record<NavKey, string>> = {}): NavItem[] {
  const withLabels = BASE_NAV_ITEMS.map((item) => {
    const override = labelOverrides[item.key];
    if (!override) return item;
    return { ...item, label: override, short: override };
  });

  const principal = withLabels.filter((i) => i.group === 'principal');
  const gestao = withLabels.filter((i) => i.group === 'gestao');

  const modulos = withLabels
    .filter((i) => i.group === 'modulos')
    .slice()
    .sort((a, b) => {
      const ia = navOrder.indexOf(a.key);
      const ib = navOrder.indexOf(b.key);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  return [...principal, ...modulos, ...gestao];
}

/** Menu inferior do mobile: Dashboard + os 3 módulos priorizados pelo tema + Clientes. */
export function buildMobileNav(navItems: NavItem[]): NavItem[] {
  const dashboard = navItems.find((i) => i.key === 'dashboard')!;
  const modulos = navItems.filter((i) => i.group === 'modulos').slice(0, 3);
  const clientes = navItems.find((i) => i.key === 'clientes')!;
  return [dashboard, ...modulos, clientes];
}
