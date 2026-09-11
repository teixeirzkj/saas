import 'server-only';

/**
 * Theme Engine do NEXO.
 *
 * A plataforma é uma só por trás (mesmo banco, mesmas rotas, mesmas regras de
 * negócio) mas a EXPERIÊNCIA VISUAL muda por segmento: paleta de cores, raio de
 * cards/botões, ordem da navegação e a terminologia usada nos módulos.
 *
 * Como funciona:
 *  1. O segmento do negócio (`Business.segment`) escolhe um `ThemeConfig` daqui.
 *  2. `themeCssVars()` gera um bloco de CSS custom properties (--brand-*) que o
 *     componente <ThemeStyle> injeta como <style> no HTML da página.
 *  3. Em `globals.css` e nos componentes, classes como `bg-[rgb(var(--brand-500)/0.12)]`
 *     leem essas variáveis — então a mesma classe Tailwind produz cores diferentes
 *     por empresa, sem recompilar nada.
 *  4. `Business.brandColor` (opcional) é o "modo personalizado": sobrescreve a cor
 *     500/600/700 do segmento por uma cor escolhida pelo dono do negócio, sem
 *     perder a estrutura (raio, terminologia, ordem de navegação continuam do
 *     segmento).
 *
 * Páginas de marketing/autenticação (`/`, `/planos`, `/login`, `/cadastro`,
 * `/checkout`, `/onboarding`) NUNCA recebem <ThemeStyle> — ali a marca NEXO
 * continua sempre roxa, de propósito (reconhecimento da marca-mãe).
 *
 * Para adicionar um novo nicho no futuro: acrescente uma entrada em THEMES.
 * Nada mais no app precisa mudar — nav, cores e terminologia seguem daqui.
 */

export type NavKey = 'dashboard' | 'orcamentos' | 'agenda' | 'catalogo' | 'crm' | 'ia' | 'clientes' | 'financeiro' | 'configuracoes';

export type ThemeConfig = {
  segment: string;
  /** Nome comercial usado em textos tipo "NEXO para restaurantes" */
  niche: string;
  /** Emoji usado no seletor do onboarding */
  emoji: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  /** Raio de cards e botões — cada nicho tem uma "textura" (sharp/soft/elegant/pill) */
  radius: { card: string; button: string };
  /** Ordem de prioridade dos módulos na navegação (o resto segue nessa ordem depois) */
  navOrder: NavKey[];
  terminology: {
    /** "Catálogo" nomeado do jeito que o nicho chama esse módulo */
    catalogLabel: string;
    /** Um item do catálogo: "Prato", "Produto", "Peça"... */
    catalogItemLabel: string;
    /** Chamada de destaque da página pública do catálogo */
    catalogCta: string;
    /** Texto de apoio no cabeçalho da agenda pública */
    bookingCta: string;
  };
};

function hex(h: string): string {
  const n = h.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const DEFAULT_TERMINOLOGY: ThemeConfig['terminology'] = {
  catalogLabel: 'Catálogo',
  catalogItemLabel: 'Produto',
  catalogCta: 'Adicionar ao carrinho',
  bookingCta: 'Agendar horário',
};

const DEFAULT_NAV_ORDER: NavKey[] = [
  'dashboard',
  'orcamentos',
  'agenda',
  'catalogo',
  'crm',
  'ia',
  'clientes',
  'financeiro',
  'configuracoes',
];

/** Tema padrão da marca — roxo NEXO. Usado por "outro", "loja" e como fallback. */
const NEXO_DEFAULT: ThemeConfig = {
  segment: 'outro',
  niche: 'negócios',
  emoji: '✨',
  colors: {
    50: hex('#F4EEFF'),
    100: hex('#E7DBFF'),
    200: hex('#CFB8FF'),
    300: hex('#B48CFF'),
    400: hex('#9B5DFF'),
    500: hex('#8B2FFF'),
    600: hex('#7714EE'),
    700: hex('#5D0FBC'),
    800: hex('#420B87'),
    900: hex('#2B075A'),
    950: hex('#180334'),
  },
  radius: { card: '1rem', button: '0.75rem' },
  navOrder: DEFAULT_NAV_ORDER,
  terminology: DEFAULT_TERMINOLOGY,
};

export const THEMES: Record<string, ThemeConfig> = {
  outro: NEXO_DEFAULT,

  loja: {
    ...NEXO_DEFAULT,
    segment: 'loja',
    niche: 'lojas',
    emoji: '🛍️',
    navOrder: ['dashboard', 'catalogo', 'crm', 'orcamentos', 'agenda', 'ia', 'clientes', 'financeiro', 'configuracoes'],
    terminology: { ...DEFAULT_TERMINOLOGY, catalogLabel: 'Catálogo', catalogItemLabel: 'Produto' },
  },

  autonomo: {
    ...NEXO_DEFAULT,
    segment: 'autonomo',
    niche: 'profissionais autônomos',
    emoji: '📸',
    colors: {
      50: hex('#EEFBF7'),
      100: hex('#D2F5E9'),
      200: hex('#A6EBD3'),
      300: hex('#6FDBB9'),
      400: hex('#3FC49E'),
      500: hex('#1FA985'),
      600: hex('#16876B'),
      700: hex('#106A55'),
      800: hex('#0C5142'),
      900: hex('#083A2F'),
      950: hex('#04211B'),
    },
    radius: { card: '1.1rem', button: '0.85rem' },
    navOrder: ['dashboard', 'orcamentos', 'agenda', 'ia', 'crm', 'catalogo', 'clientes', 'financeiro', 'configuracoes'],
    terminology: { ...DEFAULT_TERMINOLOGY, catalogLabel: 'Portfólio', catalogItemLabel: 'Trabalho' },
  },

  // 🍔 Restaurante — inspirado em apps de delivery: vermelho/laranja quente
  restaurante: {
    segment: 'restaurante',
    niche: 'restaurantes',
    emoji: '🍔',
    colors: {
      50: hex('#FFF3EC'),
      100: hex('#FFE1CF'),
      200: hex('#FFC29D'),
      300: hex('#FF9A63'),
      400: hex('#FA6C3A'),
      500: hex('#F0431F'),
      600: hex('#D22F12'),
      700: hex('#A8240D'),
      800: hex('#7C1A0A'),
      900: hex('#551206'),
      950: hex('#300A03'),
    },
    radius: { card: '1.25rem', button: '1rem' },
    navOrder: ['dashboard', 'catalogo', 'crm', 'agenda', 'orcamentos', 'ia', 'clientes', 'financeiro', 'configuracoes'],
    terminology: {
      catalogLabel: 'Cardápio',
      catalogItemLabel: 'Prato',
      catalogCta: 'Adicionar ao pedido',
      bookingCta: 'Reservar mesa',
    },
  },

  // 💈 Barbearia — visual sofisticado e masculino: preto/grafite/dourado
  barbearia: {
    segment: 'barbearia',
    niche: 'barbearias',
    emoji: '💈',
    colors: {
      50: hex('#FBF6EA'),
      100: hex('#F3E7C5'),
      200: hex('#E7CE8F'),
      300: hex('#D9B466'),
      400: hex('#C89B45'),
      500: hex('#B0812F'),
      600: hex('#8F6624'),
      700: hex('#6E4E1D'),
      800: hex('#513A16'),
      900: hex('#392910'),
      950: hex('#211709'),
    },
    radius: { card: '0.75rem', button: '0.6rem' },
    navOrder: ['dashboard', 'agenda', 'clientes', 'catalogo', 'orcamentos', 'financeiro', 'crm', 'ia', 'configuracoes'],
    terminology: {
      catalogLabel: 'Serviços',
      catalogItemLabel: 'Serviço',
      catalogCta: 'Reservar serviço',
      bookingCta: 'Agendar horário',
    },
  },

  // 💅 Salão / estética — elegante e delicado: rosa/vinho/nude/lilás
  salao: {
    segment: 'salao',
    niche: 'salões de beleza',
    emoji: '💅',
    colors: {
      50: hex('#FDF1F7'),
      100: hex('#FBDCEB'),
      200: hex('#F5B8D6'),
      300: hex('#ED8DBC'),
      400: hex('#E25FA0'),
      500: hex('#CF3D83'),
      600: hex('#AD2A69'),
      700: hex('#872153'),
      800: hex('#63183D'),
      900: hex('#42102A'),
      950: hex('#260918'),
    },
    radius: { card: '1.5rem', button: '1.25rem' },
    navOrder: ['dashboard', 'agenda', 'crm', 'clientes', 'orcamentos', 'catalogo', 'ia', 'financeiro', 'configuracoes'],
    terminology: {
      catalogLabel: 'Serviços',
      catalogItemLabel: 'Serviço',
      catalogCta: 'Reservar horário',
      bookingCta: 'Fazer minha reserva',
    },
  },

  // 🪚 Móveis / Marcenaria — premium, sóbrio: madeira/preto/bege/oliva
  moveis: {
    segment: 'moveis',
    niche: 'marceneiros',
    emoji: '🪚',
    colors: {
      50: hex('#F8F1E6'),
      100: hex('#EDDCC0'),
      200: hex('#DEC091'),
      300: hex('#CBA167'),
      400: hex('#B3823F'),
      500: hex('#8F6530'),
      600: hex('#6F4E27'),
      700: hex('#553C1F'),
      800: hex('#3D2B17'),
      900: hex('#2A1D10'),
      950: hex('#180F08'),
    },
    radius: { card: '0.6rem', button: '0.5rem' },
    navOrder: ['dashboard', 'orcamentos', 'crm', 'agenda', 'catalogo', 'financeiro', 'ia', 'clientes', 'configuracoes'],
    terminology: {
      catalogLabel: 'Peças',
      catalogItemLabel: 'Peça',
      catalogCta: 'Solicitar orçamento',
      bookingCta: 'Agendar visita',
    },
  },

  // 🔧 Prestador de serviço — objetivo e confiável: azul escuro/amarelo
  prestador: {
    segment: 'prestador',
    niche: 'prestadores de serviço',
    emoji: '🔧',
    colors: {
      50: hex('#EBF1FE'),
      100: hex('#CFDDFC'),
      200: hex('#A0BBF9'),
      300: hex('#6E97F3'),
      400: hex('#4778EC'),
      500: hex('#2C5CDE'),
      600: hex('#2047B8'),
      700: hex('#193690'),
      800: hex('#13286B'),
      900: hex('#0D1C4B'),
      950: hex('#080F29'),
    },
    radius: { card: '0.85rem', button: '0.65rem' },
    navOrder: ['dashboard', 'orcamentos', 'agenda', 'clientes', 'crm', 'financeiro', 'catalogo', 'ia', 'configuracoes'],
    terminology: {
      catalogLabel: 'Serviços',
      catalogItemLabel: 'Serviço',
      catalogCta: 'Solicitar serviço',
      bookingCta: 'Agendar visita técnica',
    },
  },
};

export function getTheme(segment: string | null | undefined): ThemeConfig {
  return THEMES[segment ?? 'outro'] ?? NEXO_DEFAULT;
}

/**
 * Gera o bloco de CSS custom properties para o tema, já aplicando a sobrescrita
 * de `brandColor` (modo personalizado) quando presente — troca 400/500/600/700
 * e o glow pela cor escolhida, mantendo o resto da paleta (100/200/300/900) do
 * segmento para os degradês continuarem coerentes.
 */
export function themeCssVars(theme: ThemeConfig, brandColorHex?: string | null): string {
  const c = theme.colors;
  const override = brandColorHex ? hex(brandColorHex) : null;

  const vars: Record<string, string> = {
    '--brand-50': c[50],
    '--brand-100': c[100],
    '--brand-200': c[200],
    '--brand-300': c[300],
    '--brand-400': override ?? c[400],
    '--brand-500': override ?? c[500],
    '--brand-600': override ?? c[600],
    '--brand-700': override ?? c[700],
    '--brand-800': c[800],
    '--brand-900': c[900],
    '--brand-950': c[950],
    '--brand-glow': override ?? c[500],
    '--radius-card': theme.radius.card,
    '--radius-button': theme.radius.button,
  };

  const body = Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');

  return `:root { ${body} }`;
}

/** Ordena os módulos de navegação segundo o tema, mantendo os hrefs originais. */
export function sortByNavOrder<T extends { key: NavKey }>(items: T[], theme: ThemeConfig): T[] {
  const order = theme.navOrder;
  return [...items].sort((a, b) => {
    const ia = order.indexOf(a.key);
    const ib = order.indexOf(b.key);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}
