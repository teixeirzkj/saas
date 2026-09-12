/**
 * Catalogo de planos.
 * A fonte da verdade em runtime e a tabela Plan (semeada com estes valores —
 * rode `node scripts/update-plans.mjs` depois de editar aqui para refletir no
 * banco sem precisar de um `db:reset` completo), mas a landing page e o
 * checkout leem daqui para nao precisar de banco.
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
    name: 'Básico',
    priceCents: 1990,
    interval: 'month',
    tagline: 'Para começar a organizar hoje',
    description: 'Tudo que você precisa para sair do improviso do WhatsApp e do papel.',
    highlight: false,
    order: 0,
    limits: { maxCustomers: 50, maxQuotes: 20, maxProducts: 20, maxUsers: 1, aiCredits: 5 },
    features: ['Clientes ilimitados', '20 orçamentos por mês', 'Agenda completa', 'Catálogo básico', 'Página pública de catálogo e agendamento'],
    matrix: {
      Clientes: 'Ilimitados',
      'Orçamentos por mês': '20',
      Agenda: 'Completa',
      Catálogo: 'Básico',
      CRM: false,
      'Botões de WhatsApp': true,
      Relatórios: false,
      'Nexo IA': '5 gerações',
      'Disparo em massa': false,
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
    description: 'Clientes ilimitados e até 90 orçamentos por mês, com CRM, WhatsApp e IA para conteúdo.',
    highlight: true,
    order: 1,
    limits: { maxCustomers: -1, maxQuotes: 90, maxProducts: -1, maxUsers: 1, aiCredits: 50 },
    features: [
      'Clientes ilimitados',
      '90 orçamentos por mês',
      'Agenda completa + página de agendamento',
      'Catálogo completo + pedidos',
      'Nexo CRM com Kanban',
      'Botões de WhatsApp em todo o sistema',
      'Relatórios de vendas',
      'Nexo IA com 50 gerações por mês',
    ],
    matrix: {
      Clientes: 'Ilimitados',
      'Orçamentos por mês': '90',
      Agenda: 'Completa',
      Catálogo: 'Completo',
      CRM: true,
      'Botões de WhatsApp': true,
      Relatórios: true,
      'Nexo IA': '50 gerações',
      'Disparo em massa': false,
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
    tagline: 'Para quem quer vender em escala',
    description: 'Clientes e orçamentos ilimitados, com disparo de mensagens em massa e automação de follow-up.',
    highlight: false,
    order: 2,
    limits: { maxCustomers: -1, maxQuotes: -1, maxProducts: -1, maxUsers: 10, aiCredits: 300 },
    features: [
      'Clientes ilimitados',
      'Orçamentos ilimitados',
      'Disparo de mensagens em massa pelo WhatsApp',
      'Automações de follow-up',
      'Nexo IA com 300 gerações por mês',
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
      'Disparo em massa': true,
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
  bulkSend: ['business'],
} as const;

export type GatedFeature = keyof typeof FEATURE_GATES;

export function planAllows(planCode: string, feature: GatedFeature) {
  return (FEATURE_GATES[feature] as readonly string[]).includes(planCode);
}
