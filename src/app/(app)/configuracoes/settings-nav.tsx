'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, CreditCard, Plug, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/configuracoes', label: 'Minha empresa', icon: Building2 },
  { href: '/configuracoes/perfil', label: 'Perfil', icon: User },
  { href: '/configuracoes/assinatura', label: 'Assinatura', icon: CreditCard },
  { href: '/configuracoes/integracoes', label: 'Integrações', icon: Plug },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors',
                active
                  ? 'border border-[rgb(var(--brand-500)/0.25)] bg-[rgb(var(--brand-500)/0.12)] text-[rgb(var(--brand-100))]'
                  : 'text-white/50 hover:bg-white/[0.05] hover:text-white/85',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
