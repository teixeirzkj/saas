'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowRight,
  Calendar,
  Check,
  FileText,
  Instagram,
  MessageCircle,
  PlayCircle,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import { DashboardMock } from '@/components/marketing/dashboard-mock';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { ButtonAnchor, ButtonLink } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/misc';
import { PLANS, planPriceLabel } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { salesLink } from '@/lib/whatsapp';

// ------------------------------------------------------------------ dados das seções

const PROBLEMS = [
  { icon: MessageCircle, title: 'Clientes espalhados no WhatsApp', description: 'Cada conversa em um lugar, sem histórico e sem controle.' },
  { icon: FileText, title: 'Orçamentos feitos manualmente', description: 'Word, calculadora e cópia e cola — sem contar os erros.' },
  { icon: Calendar, title: 'Agenda desorganizada', description: 'Caderno, agenda de papel ou grupo de WhatsApp para marcar horário.' },
  { icon: TrendingUp, title: 'Vendas sem acompanhamento', description: 'Sem saber quem está prestes a fechar ou quem já esfriou.' },
  { icon: Instagram, title: 'Falta de conteúdo para o Instagram', description: 'Sem tempo e sem ideia do que postar toda semana.' },
  { icon: ShoppingBag, title: 'Informações espalhadas em vários apps', description: 'Cada ferramenta guarda um pedaço do seu negócio.' },
];

const MODULES = [
  {
    key: 'orcamentos',
    name: 'Nexo Orçamentos',
    icon: FileText,
    description: 'Crie orçamentos profissionais em poucos minutos e envie direto para seus clientes.',
    features: ['Cálculo automático', 'Geração de PDF', 'Envio pelo WhatsApp', 'Status: rascunho, enviado, aprovado, recusado'],
  },
  {
    key: 'agenda',
    name: 'Nexo Agenda',
    icon: Calendar,
    description: 'Organize seus horários e permita que seus clientes façam agendamentos sozinhos.',
    features: ['Visão diária, semanal e mensal', 'Página pública de agendamento', 'Confirmação pelo WhatsApp', 'Serviços com duração e preço'],
  },
  {
    key: 'catalogo',
    name: 'Nexo Catálogo',
    icon: ShoppingBag,
    description: 'Catálogo digital para restaurantes, lojas e prestadores — com carrinho e pedidos.',
    features: ['Produtos com foto e adicionais', 'Carrinho de compras', 'Pedido direto pelo WhatsApp', 'Painel de acompanhamento'],
  },
  {
    key: 'crm',
    name: 'Nexo CRM',
    icon: TrendingUp,
    description: 'CRM visual em formato Kanban para nunca mais perder uma venda.',
    features: ['Arraste clientes entre etapas', 'Tarefas e lembretes', 'Histórico e notas', 'Botão de WhatsApp direto'],
  },
  {
    key: 'ia',
    name: 'Nexo IA',
    icon: Sparkles,
    description: 'Gere posts, legendas, anúncios e roteiros para redes sociais em segundos.',
    features: ['8 tipos de conteúdo', 'Calendário de conteúdo', 'Copiar, editar e regenerar', 'Pronto para o Instagram'],
  },
];

const TESTIMONIAL = {
  quote:
    'É como ter vários funcionários digitais para organizar meu negócio, mas pagando uma única assinatura.',
  name: 'Usuária NEXO',
  role: 'Studio de beleza',
};

const FAQ = [
  { q: 'Preciso instalar algum programa?', a: 'Não. A plataforma funciona diretamente pelo navegador.' },
  { q: 'Funciona no celular?', a: 'Sim, o NEXO foi desenhado para funcionar perfeitamente no celular.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem burocracia.' },
  {
    q: 'Posso usar para qualquer tipo de negócio?',
    a: 'Sim. A plataforma foi desenvolvida para pequenos negócios, prestadores e profissionais autônomos.',
  },
];

// ------------------------------------------------------------------ página

export function LandingView({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader isLoggedIn={isLoggedIn} />

      {/* ---------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden pb-10 pt-8 sm:pb-28 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute -left-32 -top-20 h-96 w-96 animate-pulse-glow rounded-full bg-nexo-600/25 blur-[120px]" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 animate-pulse-glow rounded-full bg-nexo-800/25 blur-[120px]" />

        {/* Globo no celular — atrás do texto, bem apagado, some antes do mockup */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] lg:hidden">
          <div
            className="absolute inset-0"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 48%, transparent 92%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 48%, transparent 92%)',
            }}
          >
            <Image
              src="/images/hero-globe.png"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 0px, 100vw"
              className="object-cover object-center opacity-40"
            />
          </div>
          <div className="absolute inset-0 bg-ink-950/55" />
        </div>

        {/* Globo — fica no fundo, do lado direito, se fundindo com o preto do site */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[62%] lg:block"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 22%, black 42%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 22%, black 42%, black 78%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        >
          <Image
            src="/images/hero-globe.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 0px"
            className="object-cover opacity-80"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
            <div className="text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-nexo-500/25 bg-nexo-500/10 px-3.5 py-1.5 text-[12px] font-semibold text-nexo-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                5 ferramentas. 1 plataforma.
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="gradient-text mt-4 text-balance font-display text-[30px] font-semibold leading-[1.1] tracking-tight sm:mt-6 sm:text-[52px] lg:text-[50px] xl:text-[56px]"
              >
                Tudo que seu negócio precisa. Em um só lugar.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto mt-3 max-w-2xl text-pretty text-[14.5px] leading-relaxed text-white/55 sm:mt-5 sm:text-[18px] lg:mx-0"
              >
                Organize clientes, orçamentos, agenda, vendas e conteúdo em uma plataforma simples, rápida e
                inteligente.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3 lg:justify-start"
              >
                <ButtonAnchor href={salesLink()} size="lg">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </ButtonAnchor>
                <ButtonLink href="#produto" variant="outline" size="lg">
                  <PlayCircle className="h-4 w-4" />
                  Ver como funciona
                </ButtonLink>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.32 }}
                className="mt-3 text-[11.5px] text-white/30 sm:text-[12.5px]"
              >
                Planos a partir de R$ 19,90/mês · Fale com a gente pelo WhatsApp
              </motion.p>
            </div>
          </div>
        </div>

        <div className="relative mt-8 px-4 sm:mt-16 sm:px-6">
          <DashboardMock />
        </div>
      </section>

      {/* ---------------------------------------------------------- PROBLEMA */}
      <section className="border-t border-white/[0.06] bg-ink-900/30 py-12 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-xl text-center">
            <h2 className="text-balance font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[36px]">
              Pare de administrar seu negócio no improviso.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/50">
              Se qualquer um destes problemas parece familiar, é hora de organizar tudo em um só lugar.
            </p>
          </FadeIn>

          <Stagger className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <StaggerItem key={problem.title}>
                <div className="surface h-full p-3.5 sm:p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 sm:h-10 sm:w-10">
                    <problem.icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </span>
                  <p className="mt-3 text-[13px] font-semibold text-white sm:mt-4 sm:text-[14.5px]">{problem.title}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-white/45 sm:mt-1.5 sm:text-[13px]">
                    {problem.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------------------------------------------------------- MÓDULOS */}
      <section id="produto" className="scroll-mt-20 py-12 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-nexo-500/25 bg-nexo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-nexo-200">
              O produto
            </span>
            <h2 className="mt-5 text-balance font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[36px]">
              Uma plataforma. Cinco ferramentas.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/50">
              Todos os módulos compartilham o mesmo cadastro de clientes — a experiência é de um único produto.
            </p>
          </FadeIn>

          <div id="recursos" className="mt-14 scroll-mt-20 space-y-6">
            {MODULES.map((module, i) => (
              <FadeIn key={module.key} delay={i * 0.05}>
                <div
                  className={cn(
                    'surface flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center',
                    i % 2 === 1 && 'lg:flex-row-reverse',
                  )}
                >
                  <div className="flex-1">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-nexo-500/25 bg-nexo-500/12 text-nexo-200">
                      <module.icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-[20px] font-semibold text-white">{module.name}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/50">{module.description}</p>

                    <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                      {module.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-[13px] text-white/65">
                          <Check className="h-3.5 w-3.5 shrink-0 text-nexo-300" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Mini-mockup do módulo */}
                  <div className="flex-1">
                    <ModulePreview module={module} />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- PROVA SOCIAL */}
      <section className="border-y border-white/[0.06] bg-ink-900/30 py-10 sm:py-20">
        <FadeIn className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="text-balance font-display text-[22px] font-medium italic leading-relaxed text-white/80 sm:text-[26px]">
            &ldquo;{TESTIMONIAL.quote}&rdquo;
          </p>
          <p className="mt-5 text-[13px] font-medium text-white/40">
            {TESTIMONIAL.name} · {TESTIMONIAL.role}
          </p>
        </FadeIn>
      </section>

      {/* ---------------------------------------------------------- PLANOS */}
      <section className="py-12 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-xl text-center">
            <h2 className="text-balance font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[36px]">
              Planos simples para crescer com você.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-white/50">
              Menos aplicativos. Mais controle. Fale com a gente e comece ainda hoje.
            </p>
          </FadeIn>

          <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <StaggerItem key={plan.code}>
                <div
                  className={cn(
                    'relative flex h-full flex-col rounded-3xl border p-6',
                    plan.highlight
                      ? 'ring-gradient border-nexo-500/30 bg-gradient-to-b from-nexo-900/40 to-ink-900/60 shadow-glow'
                      : 'surface border-white/[0.07]',
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-nexo-500 to-nexo-400 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow-sm">
                      Mais popular
                    </span>
                  )}
                  <p className="text-[13px] font-semibold uppercase tracking-wider text-nexo-300">{plan.name}</p>
                  <div className="mt-3 flex items-end gap-1.5">
                    <span className="font-display text-[32px] font-semibold leading-none text-white">
                      {planPriceLabel(plan)}
                    </span>
                    {plan.priceCents > 0 && <span className="pb-1 text-[12px] text-white/40">/mês</span>}
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-[13px] text-white/65">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nexo-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <ButtonAnchor
                    href={salesLink(plan.name)}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    fullWidth
                    className="mt-6"
                  >
                    Começar agora
                  </ButtonAnchor>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn delay={0.15} className="mt-8 text-center">
            <ButtonLink href="/planos" variant="ghost">
              Ver comparação completa dos planos
              <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </FadeIn>
        </div>
      </section>

      {/* ---------------------------------------------------------- FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-white/[0.06] bg-ink-900/30 py-12 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <FadeIn className="text-center">
            <h2 className="font-display text-[28px] font-semibold text-white">Perguntas frequentes</h2>
          </FadeIn>
          <Stagger className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2">
            {FAQ.map((item) => (
              <StaggerItem key={item.q}>
                <div className="surface h-full p-4 sm:p-5">
                  <p className="text-[13.5px] font-medium text-white sm:text-[14.5px]">{item.q}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50 sm:mt-2 sm:text-[13.5px]">
                    {item.a}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---------------------------------------------------------- CTA FINAL */}
      <section className="py-12 sm:py-28">
        <FadeIn className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="ring-gradient relative overflow-hidden rounded-3xl bg-gradient-to-br from-nexo-900/50 to-ink-900/60 p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 animate-pulse-glow rounded-full bg-nexo-500/25 blur-[100px]" />
            <h2 className="relative text-balance font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[36px]">
              Seu negócio organizado em um só lugar.
            </h2>
            <p className="relative mt-4 text-[15px] leading-relaxed text-white/55">
              Clientes, vendas, agenda e marketing. Sem complicação.
            </p>
            <div className="relative mt-8 flex justify-center">
              <ButtonAnchor href={salesLink()} size="lg">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </ButtonAnchor>
            </div>
          </div>
        </FadeIn>
      </section>

      <SiteFooter />
    </div>
  );
}

// ------------------------------------------------------------------ mini-mockups por módulo

function ModulePreview({ module }: { module: (typeof MODULES)[number] }) {
  if (module.key === 'orcamentos') {
    return (
      <div className="surface p-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <p className="text-[12px] font-semibold text-white">Orçamento #1042</p>
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            Aprovado
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            ['Corte + hidratação', 'R$ 140,00'],
            ['Design de sobrancelha', 'R$ 45,00'],
          ].map(([desc, price]) => (
            <div key={desc} className="flex justify-between text-[11.5px] text-white/60">
              <span>{desc}</span>
              <span className="text-white/85">{price}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
          <span className="text-[12px] font-medium text-white/60">Total</span>
          <span className="font-display text-[16px] font-semibold text-white">R$ 185,00</span>
        </div>
      </div>
    );
  }

  if (module.key === 'agenda') {
    return (
      <div className="surface p-4">
        <p className="mb-3 text-[12px] font-semibold text-white">Hoje, 12 de setembro</p>
        <div className="space-y-2">
          {[
            ['09:00', 'Corte masculino', 'Rafael'],
            ['11:00', 'Coloração completa', 'Marina'],
            ['14:30', 'Escova + hidratação', 'Juliana'],
          ].map(([time, service, client]) => (
            <div key={time} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2">
              <span className="w-10 shrink-0 font-display text-[12px] font-semibold text-nexo-200">{time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] text-white/80">{service}</p>
                <p className="truncate text-[10px] text-white/35">{client}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (module.key === 'catalogo') {
    return (
      <div className="surface grid grid-cols-2 gap-2 p-4">
        {['Kit Hidratação', 'Óleo de Argan', 'Botox Capilar', 'Pacote Noiva'].map((name, i) => (
          <div key={name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="mb-2 aspect-square rounded-lg bg-gradient-to-br from-nexo-600/25 to-nexo-900/40" />
            <p className="truncate text-[11px] font-medium text-white/80">{name}</p>
            <p className="text-[11px] font-semibold text-nexo-200">{['R$ 159,90', 'R$ 79,90', 'R$ 129,90', 'R$ 790,00'][i]}</p>
          </div>
        ))}
      </div>
    );
  }

  if (module.key === 'crm') {
    return (
      <div className="surface flex gap-2 overflow-hidden p-4">
        {['Novo Lead', 'Negociação', 'Vendido'].map((stage) => (
          <div key={stage} className="w-1/3 shrink-0 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">{stage}</p>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
              <p className="text-[10.5px] text-white/75">Pacote mensal</p>
              <p className="mt-1 text-[10px] font-semibold text-nexo-200">R$ 480,00</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-nexo-300" />
        <p className="text-[12px] font-semibold text-white">Post para Instagram</p>
      </div>
      <p className="text-[11.5px] leading-relaxed text-white/60">
        Você não precisa de mais tempo. Precisa de menos improviso. Na Studio Aurora, isso funciona assim...
      </p>
      <p className="mt-2 text-[10.5px] text-nexo-300/80">#studioaurora #cabelosaudavel #beleza</p>
    </div>
  );
}
