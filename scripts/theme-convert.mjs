// Script de uso único: converte classes Tailwind estáticas "nexo-<shade>[/opacity]"
// em classes arbitrárias baseadas em variável CSS "rgb(var(--brand-<shade>)/alpha)",
// para que o Theme Engine consiga retintar essas telas por segmento em runtime.
//
// Roda só nos arquivos "tenant-scoped" (painel + páginas públicas de uma empresa).
// Telas de marketing/autenticação ficam de fora de propósito — a marca NEXO
// continua roxa ali, conforme decidido no Theme Engine.
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const EXCLUDE = [
  'src/app/page.tsx',
  'src/app/landing-view.tsx',
  'src/app/planos/',
  'src/app/checkout/',
  'src/app/onboarding/',
  'src/app/(auth)/',
  'src/components/marketing/',
  'src/components/shared/logo.tsx',
];

const files = globSync('src/**/*.{ts,tsx}', { cwd: root }).filter((relative) => {
  const normalized = relative.replaceAll('\\', '/');
  return !EXCLUDE.some((prefix) => normalized.startsWith(prefix));
});

// prefixos de utilitário Tailwind que aceitam uma cor com opacidade opcional "/NN"
const PREFIXES = ['bg', 'text', 'border', 'from', 'to', 'via', 'ring', 'divide', 'outline', 'fill', 'stroke', 'placeholder', 'decoration', 'caret', 'accent'];

const pattern = new RegExp(`\\b(${PREFIXES.join('|')})-nexo-(\\d{2,3})(?:\\/(\\d{1,3}))?\\b`, 'g');

let totalFiles = 0;
let totalReplacements = 0;

for (const relative of files) {
  const abs = path.join(root, relative);
  const original = readFileSync(abs, 'utf8');

  let count = 0;
  const converted = original.replace(pattern, (match, prefix, shade, opacity) => {
    count++;
    const alpha = opacity ? Number(opacity) / 100 : 1;
    const alphaStr = alpha === 1 ? '' : `/${alpha}`;
    return `${prefix}-[rgb(var(--brand-${shade})${alphaStr})]`;
  });

  if (count > 0) {
    writeFileSync(abs, converted, 'utf8');
    totalFiles++;
    totalReplacements += count;
    console.log(`  ${relative}: ${count} substituições`);
  }
}

console.log(`\nTotal: ${totalReplacements} classes convertidas em ${totalFiles} arquivos.`);
