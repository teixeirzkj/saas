import { themeCssVars, type ThemeConfig } from '@/lib/themes';

/**
 * Injeta as variáveis CSS do tema do negócio (--brand-*, --radius-*) como um
 * <style> renderizado no servidor — sem JS no cliente, sem risco de hidratação
 * divergente. Coloque no topo do layout/página que representa uma empresa
 * (painel autenticado e páginas públicas de catálogo/agenda/orçamento).
 */
export function ThemeStyle({ theme, brandColor }: { theme: ThemeConfig; brandColor?: string | null }) {
  return <style dangerouslySetInnerHTML={{ __html: themeCssVars(theme, brandColor) }} />;
}
