/**
 * `emoji`/`preview` são um espelho leve (client-safe, sem `server-only`) da
 * paleta definida em `src/lib/themes.ts` — só o suficiente para mostrar uma
 * prévia visual no seletor do onboarding sem esse componente cliente precisar
 * importar o Theme Engine inteiro. Se mudar a cor 500 de um tema lá, replique
 * o hex aqui também.
 */
export const SEGMENTS = [
  { value: 'restaurante', label: 'Restaurante', emoji: '🍔', preview: '#F0431F' },
  { value: 'barbearia', label: 'Barbearia', emoji: '💈', preview: '#B0812F' },
  { value: 'salao', label: 'Salão / Estética', emoji: '💅', preview: '#CF3D83' },
  { value: 'moveis', label: 'Móveis / Marcenaria', emoji: '🪚', preview: '#8F6530' },
  { value: 'prestador', label: 'Prestador de serviço', emoji: '🔧', preview: '#2C5CDE' },
  { value: 'loja', label: 'Loja', emoji: '🛍️', preview: '#8B2FFF' },
  { value: 'autonomo', label: 'Profissional autônomo', emoji: '📸', preview: '#1FA985' },
  { value: 'outro', label: 'Outro', emoji: '✨', preview: '#8B2FFF' },
] as const;

/**
 * Curadoria de tons para o "modo personalizado" (Configurações → Minha empresa).
 * Client-safe de propósito — fica em constants.ts (não em themes.ts, que é
 * `server-only`) porque o seletor de cor roda num Client Component.
 */
export const BRAND_SWATCHES = [
  '#8B2FFF', // NEXO roxo (padrão)
  '#F0431F', // vermelho-laranja
  '#B0812F', // dourado
  '#CF3D83', // rosa
  '#8F6530', // madeira
  '#2C5CDE', // azul
  '#1FA985', // verde-esmeralda
  '#0EA5E9', // azul-céu
  '#DC2626', // vermelho puro
  '#111111', // preto/grafite
] as const;

export const GOALS = [
  { value: 'clientes', label: 'Clientes', icon: 'Users' },
  { value: 'orcamentos', label: 'Orçamentos', icon: 'FileText' },
  { value: 'agenda', label: 'Agenda', icon: 'Calendar' },
  { value: 'vendas', label: 'Vendas', icon: 'TrendingUp' },
  { value: 'marketing', label: 'Marketing', icon: 'Sparkles' },
] as const;

export const QUOTE_STATUS = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  enviado: { label: 'Enviado', tone: 'info' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  recusado: { label: 'Recusado', tone: 'danger' },
} as const;

export type QuoteStatus = keyof typeof QUOTE_STATUS;

export const APPOINTMENT_STATUS = {
  agendado: { label: 'Agendado', tone: 'info' },
  confirmado: { label: 'Confirmado', tone: 'purple' },
  concluido: { label: 'Concluído', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  faltou: { label: 'Não compareceu', tone: 'warning' },
} as const;

export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

export const ORDER_STATUS = {
  novo: { label: 'Novo', tone: 'info' },
  confirmado: { label: 'Confirmado', tone: 'purple' },
  preparando: { label: 'Em preparação', tone: 'warning' },
  pronto: { label: 'Pronto', tone: 'purple' },
  concluido: { label: 'Concluído', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

export const ORDER_FLOW: OrderStatus[] = ['novo', 'confirmado', 'preparando', 'pronto', 'concluido'];

export const DEAL_STAGES = [
  { value: 'novo_lead', label: 'Novo Lead', color: '#8B8FA3' },
  { value: 'contato', label: 'Contato', color: '#5AA9FF' },
  { value: 'negociacao', label: 'Negociação', color: '#B48CFF' },
  { value: 'proposta', label: 'Proposta', color: '#8B2FFF' },
  { value: 'vendido', label: 'Vendido', color: '#2FD98A' },
  { value: 'pos_venda', label: 'Pós-venda', color: '#FFB020' },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]['value'];

export const CUSTOMER_STATUS = {
  lead: { label: 'Lead', tone: 'info' },
  ativo: { label: 'Ativo', tone: 'success' },
  inativo: { label: 'Inativo', tone: 'neutral' },
} as const;

export const SOURCES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'site', label: 'Site' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'outro', label: 'Outro' },
] as const;

export const PRIORITIES = {
  baixa: { label: 'Baixa', tone: 'neutral' },
  media: { label: 'Média', tone: 'info' },
  alta: { label: 'Alta', tone: 'danger' },
} as const;

export const AI_TYPES = [
  {
    value: 'post',
    label: 'Post para Instagram',
    description: 'Post completo com texto, hashtags e chamada para ação',
    icon: 'Instagram',
  },
  { value: 'legenda', label: 'Legenda', description: 'Legenda curta e envolvente para uma foto', icon: 'Type' },
  { value: 'story', label: 'Story', description: 'Sequência de 3 stories com texto pronto', icon: 'Zap' },
  { value: 'anuncio', label: 'Anúncio', description: 'Texto de anúncio pago focado em conversão', icon: 'Megaphone' },
  { value: 'oferta', label: 'Oferta', description: 'Promoção com senso de urgência', icon: 'Tag' },
  {
    value: 'descricao',
    label: 'Descrição de produto',
    description: 'Descrição que vende, pronta para o catálogo',
    icon: 'Package',
  },
  { value: 'reels', label: 'Roteiro para Reels', description: 'Roteiro cena por cena, com ganchos', icon: 'Video' },
  {
    value: 'calendario',
    label: 'Calendário de conteúdo',
    description: '7 dias de ideias de publicação',
    icon: 'CalendarDays',
  },
] as const;

export type AIType = (typeof AI_TYPES)[number]['value'];

export const AI_OBJECTIVES = [
  { value: 'vender', label: 'Vender mais' },
  { value: 'engajar', label: 'Engajar seguidores' },
  { value: 'autoridade', label: 'Mostrar autoridade' },
  { value: 'agendar', label: 'Gerar agendamentos' },
  { value: 'divulgar', label: 'Divulgar novidade' },
] as const;

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
