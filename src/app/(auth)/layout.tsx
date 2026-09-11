import Link from 'next/link';
import { ArrowLeft, Calendar, FileText, MessageCircle, Sparkles, TrendingUp } from 'lucide-react';

import { Logo } from '@/components/shared/logo';

const HIGHLIGHTS = [
  { icon: FileText, label: 'Orçamentos profissionais em minutos' },
  { icon: Calendar, label: 'Agenda com página pública de agendamento' },
  { icon: TrendingUp, label: 'CRM visual para não perder venda' },
  { icon: MessageCircle, label: 'WhatsApp integrado em todo o sistema' },
  { icon: Sparkles, label: 'Conteúdo para Instagram gerado com IA' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen">
      {/* Coluna de conteúdo */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-8 lg:w-[52%] lg:px-14">
        <div className="mb-10 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao site
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-[420px] lg:mx-auto">{children}</div>
        </div>

        <p className="mt-10 text-center text-xs text-white/30 lg:text-left">
          © {new Date().getFullYear()} NEXO · Tudo que seu negócio precisa em um só lugar.
        </p>
      </div>

      {/* Painel lateral de prova de valor */}
      <aside className="relative hidden overflow-hidden border-l border-white/[0.06] bg-ink-900/40 lg:flex lg:w-[48%] lg:flex-col lg:justify-center lg:px-14">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 animate-pulse-glow rounded-full bg-nexo-600/25 blur-[100px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 animate-pulse-glow rounded-full bg-nexo-800/30 blur-[110px]" />

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-nexo-500/25 bg-nexo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-nexo-200">
            5 ferramentas · 1 plataforma
          </span>

          <h2 className="mt-6 font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-white">
            Seu negócio organizado em um só lugar.
          </h2>

          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            Pare de perder cliente no meio de cinco aplicativos diferentes. O NEXO reúne tudo que você usa todos os
            dias em um único painel.
          </p>

          <ul className="mt-9 space-y-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3.5 text-sm text-white/70">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-nexo-500/20 bg-nexo-500/10 text-nexo-200">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-white/[0.07] bg-ink-950/50 p-5 backdrop-blur-xl">
            <p className="text-sm italic leading-relaxed text-white/60">
              &ldquo;É como ter vários funcionários digitais para organizar meu negócio, pagando uma única
              assinatura.&rdquo;
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
