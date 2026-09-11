/**
 * Catalogo de planos.
 * A fonte da verdade em runtime e a tabela Plan (semeada com estes valores),
 * mas a landing page e o checkout leem daqui para nao precisar de banco.
 */

export type PlanCode = 'free' | 'pro' | 'business';

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  priceCents: number;
  interval: 'month';
  tagline: string;
  description: string;
  highlight: boolean;
  order: number;
  limits: {
    maxCustomers: number;
    maxQuotes: number;
    maxProducts: number;
    maxUsers: number;
    aiCredits: number;
  };
  features: string[];
  /** Recursos comparados na tabela da landing page */
  matrix: Record<string, boolean | string>;
};

export const PLANS: PlanDefinition[] = [
  {
    code: 'free',
    name: 'Grátis',
    priceCents: 0,
    interval: 'month',
    tagline: 'Para começar a organizar hoje',
    description: 'Tudo que você precisa para sair do improviso, sem cartão de crédito.',
    highlight: false,
    order: 0,
    limits: { maxCustomers: 20, maxQuotes: 5, maxProducts: 15, maxUsers: 1, aiCredits: 3 },
    features: ['20 clientes', '5 orçamentos por mês', 'Agenda básica', 'Catálogo básico', 'Página pública de catálogo'],
    matrix: {
      Clientes: '20',
      'Orçamentos por mês': '5',
      Agenda: 'Básica',
      Catálogo: 'Básico',
      CRM: false,
      'Botões de WhatsApp': false,
      Relatórios: false,
      'Nexo IA': '3 gerações',
      Automações: false,
      'Múltiplos usuários': false,
      'Suporte prioritário': false,
    },
  },
  {
    code: 'pro',
    name: 'Profissional',
    priceCents: 3990,
    interval: 'month',
    tagline: 'O plano de quem já vende todos os dias',
    description: 'Sem limites de clientes e orçamentos, com CRM, WhatsApp e IA para conteúdo.',
    highlight: true,
    order: 1,
    limits: { maxCustomers: -1, maxQuotes: -1, maxProducts: -1, maxUsers: 1, aiCredits: 50 },
    features: [
      'Clientes ilimitados',
      'Orçamentos ilimitados',
      'Agenda completa + página de agendamento',
      'Catálogo completo + pedidos',
      'Nexo CRM com Kanban',
      'Botões de WhatsApp em todo o sistema',
      'Relatórios de vendas',
      'Nexo IA com 50 gerações por mês',
    ],
    matrix: {
      Clientes: 'Ilimitados',
      'Orçamentos por mês': 'Ilimitados',
      Agenda: 'Completa',
      Catálogo: 'Completo',
      CRM: true,
      'Botões de WhatsApp': true,
      Relatórios: true,
      'Nexo IA': '50 gerações',
      Automações: false,
      'Múltiplos usuários': false,
      'Suporte prioritário': false,
    },
  },
  {
    code: 'business',
    name: 'Negócio',
    priceCents: 7990,
    interval: 'month',
    tagline: 'Para equipes que precisam de escala',
    description: 'Tudo do Profissional, com mais IA, automações, relatórios avançados e equipe.',
    highlight: false,
    order: 2,
    limits: { maxCustomers: -1, maxQuotes: -1, maxProducts: -1, maxUsers: 10, aiCredits: 300 },
    features: [
      'Tudo do Profissional',
      'Nexo IA com 300 gerações por mês',
      'Automações de follow-up',
      'Relatórios avançados',
      'Múltiplos usuários (até 10)',
      'Prioridade no suporte',
    ],
    matrix: {
      Clientes: 'Ilimitados',
      'Orçamentos por mês': 'Ilimitados',
      Agenda: 'Completa',
      Catálogo: 'Completo',
      CRM: true,
      'Botões de WhatsApp': true,
      Relatórios: 'Avançados',
      'Nexo IA': '300 gerações',
      Automações: true,
      'Múltiplos usuários': 'Até 10',
      'Suporte prioritário': true,
    },
  },
];

export const MATRIX_ROWS = Object.keys(PLANS[0].matrix);

export function getPlan(code: string): PlanDefinition {
  return PLANS.find((p) => p.code === code) ?? PLANS[0];
}

export function planPriceLabel(plan: PlanDefinition) {
  if (plan.priceCents === 0) return 'R$ 0';
  const value = plan.priceCents / 100;
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/** Recursos bloqueados por plano — usado nos gates da UI */
export const FEATURE_GATES = {
  crm: ['pro', 'business'],
  reports: ['pro', 'business'],
  whatsappTemplates: ['pro', 'business'],
  automations: ['business'],
  team: ['business'],
} as const;

export type GatedFeature = keyof typeof FEATURE_GATES;

export function planAllows(planCode: string, feature: GatedFeature) {
  return (FEATURE_GATES[feature] as readonly string[]).includes(planCode);
}
