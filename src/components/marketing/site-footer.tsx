import Link from 'next/link';
import { Instagram, MessageCircle } from 'lucide-react';

import { Logo } from '@/components/shared/logo';

const COLUMNS = [
  {
    title: 'Produto',
    links: [
      { href: '/#produto', label: 'Módulos' },
      { href: '/planos', label: 'Preços' },
      { href: '/#recursos', label: 'Recursos' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { href: '/#faq', label: 'FAQ' },
      { href: '/contato', label: 'Contato' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/termos', label: 'Termos de uso' },
      { href: '/privacidade', label: 'Privacidade' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo href="/" />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/45">
              Tudo que seu negócio precisa em um só lugar.
            </p>
            <div className="mt-5 flex gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:border-nexo-500/30 hover:text-nexo-200"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[12px] font-semibold uppercase tracking-wider text-white/35">{col.title}</p>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[13.5px] text-white/55 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[12px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NEXO. Todos os direitos reservados.</p>
          <p>Feito para pequenos negócios, prestadores e profissionais autônomos.</p>
        </div>
      </div>
    </footer>
  );
}
