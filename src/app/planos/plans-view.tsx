'use client';

import { Check, Minus, Sparkles, X } from 'lucide-react';

import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { ButtonAnchor } from '@/components/ui/button';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/misc';
import { MATRIX_ROWS, PLANS, planPriceLabel } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { salesLink } from '@/lib/whatsapp';

const FAQ = [
  {
    q: 'Preciso instalar algum programa?',
    a: 'Não. A plataforma funciona direto pelo navegador, no computador ou no celular.',
  },
  { q: 'Funciona no celular?', a: 'Sim. Todo o sistema foi desenhado para funcionar perfeitamente no celular.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa e sem burocracia. Você mantém acesso até o fim do período pago.' },
  {
    q: 'Posso usar para qualquer tipo de negócio?',
    a: 'Sim. O NEXO foi desenvolvido para pequenos negócios, prestadores de serviço e profissionais autônomos de qualquer segmento.',
  },
];

export function PlansView({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="min-h-screen">
      <SiteHeader isLoggedIn={isLoggedIn} />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-nexo-500/25 bg-nexo-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-nexo-200">
            <Sparkles className="h-3 w-3" />
            Planos simples para crescer com você
          </span>
          <h1 className="mt-5 font-display text-[32px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[42px]">
            Escolha o plano certo para o seu momento
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/50">
            Fale com a gente pelo WhatsApp e comece ainda hoje. Faça upgrade quando o seu negócio crescer.
          </p>
        </FadeIn>

        <Stagger className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <StaggerItem key={plan.code}>
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-3xl border p-7',
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
                <p className="mt-2 text-[13.5px] text-white/45">{plan.tagline}</p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="font-display text-[40px] font-semibold leading-none text-white">
                    {planPriceLabel(plan)}
                  </span>
                  {plan.priceCents > 0 && <span className="pb-1.5 text-[13px] text-white/40">/mês</span>}
                </div>

                <ButtonAnchor
                  href={salesLink(plan.name)}
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  size="lg"
                  fullWidth
                  className="mt-6"
                >
                  Começar agora
                </ButtonAnchor>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px] text-white/70">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-nexo-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Tabela comparativa */}
        <FadeIn delay={0.1} className="mt-20">
          <h2 className="text-center font-display text-[24px] font-semibold text-white">Compare todos os recursos</h2>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-white/35">
                    Recurso
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.code}
                      className={cn(
                        'py-4 text-center text-[13px] font-semibold',
                        plan.highlight ? 'text-nexo-200' : 'text-white/70',
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {MATRIX_ROWS.map((row) => (
                  <tr key={row}>
                    <td className="py-3.5 text-[13.5px] text-white/60">{row}</td>
                    {PLANS.map((plan) => {
                      const value = plan.matrix[row];
                      return (
                        <td key={plan.code} className="py-3.5 text-center">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-400" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-white/15" />
                            )
                          ) : (
                            <span className="text-[13px] text-white/75">{value}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        {/* FAQ */}
        <section id="faq" className="mx-auto mt-24 max-w-2xl scroll-mt-20">
          <FadeIn delay={0.15}>
            <h2 className="text-center font-display text-[24px] font-semibold text-white">Perguntas frequentes</h2>
            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <div key={item.q} className="surface p-5">
                  <p className="text-[14.5px] font-medium text-white">{item.q}</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/50">{item.a}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
