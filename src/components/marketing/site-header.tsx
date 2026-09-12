'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Logo } from '@/components/shared/logo';
import { ButtonAnchor, ButtonLink } from '@/components/ui/button';
import { salesLink } from '@/lib/whatsapp';

const LINKS = [
  { href: '/#produto', label: 'Produto' },
  { href: '/planos', label: 'Preços' },
  { href: '/#recursos', label: 'Recursos' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo href="/" />

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13.5px] font-medium text-white/60 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <ButtonLink href="/dashboard" size="sm">
              Ir para o painel
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Entrar
              </ButtonLink>
              <ButtonAnchor href={salesLink()} size="sm">
                Começar agora
              </ButtonAnchor>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="rounded-xl p-2 text-white/60 transition hover:bg-white/[0.07] hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col border-l border-white/[0.08] bg-ink-950/98 p-5 backdrop-blur-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <Logo href="/" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar menu"
                  className="rounded-xl p-2 text-white/50 hover:bg-white/[0.07] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-[15px] font-medium text-white/75 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-auto space-y-2 pt-6">
                {isLoggedIn ? (
                  <ButtonLink href="/dashboard" fullWidth>
                    Ir para o painel
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonAnchor href={salesLink()} fullWidth>
                      Começar agora
                    </ButtonAnchor>
                    <ButtonLink href="/login" variant="secondary" fullWidth>
                      Entrar
                    </ButtonLink>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
