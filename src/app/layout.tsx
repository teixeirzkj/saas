import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';

import { ToastProvider } from '@/components/ui/toast';
import { appUrl } from '@/lib/utils';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: 'NEXO — Tudo que seu negócio precisa. Em um só lugar.',
    template: '%s · NEXO',
  },
  description:
    'Organize clientes, orçamentos, agenda, vendas e conteúdo em uma plataforma simples, rápida e inteligente. 5 ferramentas. 1 plataforma.',
  keywords: ['crm para pequenos negócios', 'orçamento online', 'agenda online', 'catálogo digital', 'gestão de clientes'],
  openGraph: {
    title: 'NEXO — Tudo que seu negócio precisa. Em um só lugar.',
    description: 'Clientes, vendas, agenda e marketing. Sem complicação.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'NEXO',
  },
  twitter: { card: 'summary_large_image', title: 'NEXO', description: 'Menos aplicativos. Mais controle.' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#06040A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
