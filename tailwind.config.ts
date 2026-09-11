import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Preto / cinza muito escuro
        ink: {
          950: '#06040A',
          900: '#0A0710',
          850: '#0E0A16',
          800: '#130E1D',
          700: '#1A1327',
          600: '#241A34',
          500: '#2F2343',
        },
        // Roxo escuro -> roxo neon
        nexo: {
          50: '#F4EEFF',
          100: '#E7DBFF',
          200: '#CFB8FF',
          300: '#B48CFF',
          400: '#9B5DFF',
          500: '#8B2FFF',
          600: '#7714EE',
          700: '#5D0FBC',
          800: '#420B87',
          900: '#2B075A',
          950: '#180334',
        },
        glow: '#B98CFF',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        // Usa a variável de tema (--brand-glow) para que o brilho acompanhe o segmento
        // do negócio; nas páginas de marketing ela nunca é sobrescrita e fica roxo NEXO.
        glow: '0 0 0 1px rgb(var(--brand-glow) / 0.35), 0 8px 40px -12px rgb(var(--brand-glow) / 0.55)',
        'glow-sm': '0 0 0 1px rgb(var(--brand-glow) / 0.28), 0 4px 20px -8px rgb(var(--brand-glow) / 0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -30px rgba(0,0,0,0.9)',
        lift: '0 30px 60px -30px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
        'nexo-gradient': 'linear-gradient(135deg, #8B2FFF 0%, #5D0FBC 55%, #180334 100%)',
        'nexo-soft': 'linear-gradient(135deg, rgba(139,47,255,0.16), rgba(24,3,52,0.05))',
      },
      backgroundSize: { grid: '48px 48px' },
      borderRadius: { xl: '0.9rem', '2xl': '1.15rem', '3xl': '1.5rem' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-glow': {
          '0%,100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 28s linear infinite',
      },
      transitionTimingFunction: { spring: 'cubic-bezier(0.22,1,0.36,1)' },
    },
  },
  plugins: [],
};

export default config;
