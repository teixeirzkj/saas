# NEXO — Status do projeto

**PROJETO COMPLETO + THEME ENGINE.** Todos os 9 itens do plano original foram
entregues, com `npx tsc --noEmit` limpo e `npm run build` gerando as 30 rotas com
sucesso. Depois disso, foi adicionado um **Theme Engine por segmento** (SaaS
"white-label inteligente por nicho" — mesma plataforma por trás, experiência
visual e terminologia adaptadas ao tipo de negócio) + **upload de imagem direto**
(sem precisar colar link). Ver seção "Theme Engine" abaixo para entender essa
camada antes de mexer em cores, navegação ou textos dos módulos.

SaaS "5 micro-SaaS em 1" para pequenos negócios: Orçamentos, Agenda, Catálogo, CRM,
Nexo IA. Identidade visual preto + roxo escuro/neon. Stack: **Next.js 15 (App Router) +
TypeScript + Prisma (SQLite em dev) + Tailwind + Framer Motion**. Windows/PowerShell.
117 arquivos `.ts`/`.tsx` em `src/`.

## Como rodar

```bash
cd "Assinatura Saas"
npm install
npm run setup     # prisma generate + db push + seed
npm run dev        # http://localhost:3000 (ou a próxima porta livre)
```

Para testar como em produção: `npm run build && npm run start`.

Login demo: `joao@nexo.app` / `nexo1234` (Studio Aurora, plano Profissional, dados em
todos os módulos). Segunda empresa `maria@nexo.app` / `nexo1234` (Cantina Bella, plano
Grátis) existe só para provar isolamento entre empresas — não expandir essa conta.

Páginas públicas: `/catalogo/studio-aurora`, `/agendar/studio-aurora`,
`/catalogo/cantina-bella`.

## Decisões de arquitetura (não redecidir)

- **DB**: SQLite via Prisma em dev (`prisma/schema.prisma`); trocar `provider` para
  `postgresql` é a única mudança necessária para produção (nenhum tipo exclusivo do
  SQLite foi usado).
- **Auth**: sessão JWT (jose) em cookie httpOnly, sem NextAuth. `src/lib/session.ts` +
  `src/lib/auth.ts`. `requireBusiness()` é o guard usado em toda página server do
  painel — redireciona pra `/login` ou `/onboarding` conforme o caso.
- **Multi-tenant**: toda tabela de dado tem `businessId`. Toda query filtra por
  `businessId` da sessão. Nunca aceitar `businessId` vindo do client/form. Isolamento
  testado manualmente (ver "Verificação final").
- **Middleware (`src/middleware.ts`)**: cuidado especial com `/catalogo` — a rota
  privada do painel (`/catalogo`, `/catalogo/pedidos`) e a rota pública da vitrine
  (`/catalogo/[slug]`) compartilham o mesmo prefixo. O middleware trata `/catalogo`
  com uma lista `PROTECTED_EXACT` (match exato, não por prefixo) exatamente para
  não bloquear a loja pública por engano. Se adicionar novas sub-rotas privadas em
  `/catalogo/*`, atualizar `PROTECTED_EXACT` — nunca trocar para o matcher genérico
  de prefixo usado pelas demais rotas.
- **Server actions** organizadas por módulo em `actions.ts` dentro de cada pasta de
  rota. Actions que recebem `businessId` como parâmetro (usadas pelas páginas
  públicas) ficam em `src/lib/*.ts` SEM `'use server'` no topo do arquivo — só
  funções soltas — porque uma server action pública aceitando businessId seria
  furo de segurança grave. As actions públicas de fato (ex.:
  `src/app/agendar/[slug]/actions.ts`, `src/app/catalogo/[slug]/actions.ts`,
  `src/app/orcamento/[token]/actions.ts`) são `'use server'` normalmente, mas
  resolvem o `businessId` internamente a partir do slug/token — nunca o recebem
  como argumento do formulário.
- **IA**: `src/lib/ai.ts` chama Anthropic API se `ANTHROPIC_API_KEY` existir, senão
  cai num gerador local determinístico (`localGenerate`) que já cobre os 8 tipos de
  conteúdo — o módulo funciona 100% sem chave configurada.
- **Pagamento**: `src/lib/payments.ts` com provider trocável (`mock` | `infinitepay`)
  via `PAYMENT_PROVIDER` no `.env`. Plano grátis ativa na hora sem gateway. Fluxo mock
  completo: `/checkout?plano=X` → `/checkout/pagamento?payment=ID` (sandbox visual,
  Pix/cartão fake) → `approveMockPayment` → `/checkout/retorno`. Webhook real em
  `src/app/api/webhooks/payment/route.ts` (HMAC via `verifyWebhookSignature`).
- **WhatsApp**: nunca usa API oficial, só `wa.me` links (`src/lib/whatsapp.ts`).
  Componente `<WhatsAppSend>` (`src/components/shared/whatsapp-send.tsx`) abre modal
  com mensagem editável antes de gerar o link — usado em todo o produto.
- **Design system**: componentes em `src/components/ui/*`. Tailwind tokens `ink-*` e
  `nexo-*` definidos em `tailwind.config.ts`. Classe utilitária `.surface` é o card
  padrão. Ver `src/app/globals.css` pra glassmorphism/animações/print styles (PDF do
  orçamento usa `@media print` + classe `print-plain`).
- **Marketing**: `src/components/marketing/*` (site-header, site-footer,
  dashboard-mock) é compartilhado entre a landing (`src/app/page.tsx` +
  `landing-view.tsx`) e `/planos`.
- **Rotas com parênteses**: `(auth)` = login/cadastro/recuperação, layout com painel
  lateral de venda; `(app)` = painel autenticado, layout com sidebar+topbar. Rotas
  públicas (`/catalogo/[slug]`, `/agendar/[slug]`, `/orcamento/[token]`, `/`,
  `/planos`, `/checkout/*`, `/onboarding`) ficam fora dos grupos.

## Feito — todos os 9 itens do plano

1. **Catálogo**: completo. `catalog-view.tsx` (grid por categoria, destaque,
   disponibilidade), `product-form.tsx` (adicionais dinâmicos, imagem por URL),
   painel de pedidos `/catalogo/pedidos` (Kanban com as 6 colunas de `ORDER_FLOW`,
   sem lib externa de drag — usa clique/modal), página pública `/catalogo/[slug]`
   com carrinho completo (estado React, não localStorage) → checkout → grava
   `Order`/`OrderItem` via `src/app/catalogo/[slug]/actions.ts` → WhatsApp com
   `cartMessage()`.
2. **CRM** (`/crm`): Kanban com as 6 colunas de `DEAL_STAGES`. Drag-and-drop nativo
   via HTML5 (`draggable`/`onDragStart`/`onDrop`, sem dnd-kit) + menu "mover para"
   como alternativa acessível/mobile. Modal de negociação com notas e tarefas
   (reusa `createNote`/`createTask` de `src/app/(app)/actions.ts`), botão WhatsApp,
   busca.
3. **Nexo IA** (`/ia`): tela "O que você quer criar hoje?" com os 8 `AI_TYPES`,
   formulário completo, chama `generateContent()`, salva em `AIContent`, botões
   Copiar/Regenerar/Salvar/Editar, loading animado, contador de créditos do plano
   com reset mensal automático (`resetCreditsIfNewMonth` em
   `src/app/(app)/ia/actions.ts`), drawer de histórico.
4. **Financeiro** (`/financeiro`): gráficos reais (`SalesAreaChart`/`DonutChart`/
   `SimpleBarChart`), breakdown por forma de pagamento, produtos mais vendidos,
   melhores clientes, exportação CSV client-side.
5. **Configurações** (`/configuracoes`): layout com sub-nav
   (`settings-nav.tsx`) e 4 sub-rotas — Minha empresa (dados + agenda + catálogo),
   Perfil (dados + trocar senha), Assinatura (cancelar/reativar/upgrade + histórico
   de pagamentos), Integrações (toggles visuais + editor de templates de
   mensagem do WhatsApp).
6. **Planos e Checkout**: `/planos` pública com tabela comparativa completa
   (`MATRIX_ROWS`) e FAQ. Fluxo de checkout mock de ponta a ponta funcionando
   (testado manualmente, ver abaixo).
7. **Landing page** (`/`): hero com mockup de dashboard renderizado com
   componentes reais do design system (`DashboardMock`), seção de problema (6
   cards), seção dos 5 módulos (com mini-mockup visual por módulo), prova social,
   planos, FAQ, CTA final, footer.
8. **Onboarding** (`/onboarding`): fluxo de 4 passos (negócio → segmento →
   objetivos → confirmação), usa `SEGMENTS`/`GOALS` de `constants.ts`.
9. **Revisão final**: feita (ver abaixo).

## Verificação final (já executada nesta sessão)

- `npx tsc --noEmit` → limpo, zero erros.
- `npm run build` → sucesso, 30 rotas geradas (28 páginas + 2 endpoints de API),
  nenhum erro de prerender.
- **Bug real encontrado e corrigido**: o middleware protegia `/catalogo` por
  prefixo, o que bloqueava incorretamente a vitrine pública `/catalogo/[slug]`
  atrás de login. Corrigido com `PROTECTED_EXACT` (ver seção de arquitetura acima).
  Confirmado depois: `/catalogo/studio-aurora` → 200, `/dashboard` → 307 (login).
- Smoke test via script Node direto no banco (não substitui teste de UI, mas
  confirma a camada de dados): senha do seed confere (bcrypt), empresa
  "Studio Aurora" com `onboardedAt` preenchido e plano `pro`, contagens batendo
  (14 clientes, 10 orçamentos, 14 pedidos, 23 agendamentos, 12 negociações, 12
  produtos, 2 conteúdos de IA), e teste de isolamento entre tenants (busca por
  "Marina Alves" — cliente da Aurora — dentro do escopo da Cantina Bella retorna
  `null`, confirmando que o filtro por `businessId` funciona).
- Servidor de produção (`npm run start`) testado com `curl`: `/`, `/planos`,
  `/login`, `/cadastro`, `/catalogo/studio-aurora`, `/catalogo/cantina-bella`,
  `/agendar/studio-aurora` → 200 com conteúdo real do seed no HTML;
  `/dashboard`, `/onboarding`, `/checkout?plano=pro` → 307 (redirect correto para
  quem não está logado); `/orcamento/token-invalido` → 404 correto.
- **Não testado por automação** (limite do ambiente): o fluxo de login/cadastro via
  Server Action não é reproduzível com `curl` puro (o encoding de Server Actions do
  Next.js exige o runtime do React/browser). Testado indiretamente via smoke test
  de banco de dados acima. Se for necessário validar de fato o clique-a-clique,
  usar um navegador real (a extensão VSCode/Playwright) apontando para
  `npm run dev` e logar com `joao@nexo.app` / `nexo1234`.

## Theme Engine (por segmento)

Adicionado depois da v1, a pedido explícito de transformar a NEXO num "SaaS
white-label inteligente por nicho": mesma base de código e banco, mas cor,
raio de componente, ordem de navegação e terminologia mudam conforme o
`Business.segment`.

**Onde vive cada peça:**

- `src/lib/themes.ts` (`import 'server-only'`) — registro `THEMES` (um
  `ThemeConfig` por segmento: paleta 50-950, raio de card/botão, `navOrder`,
  `terminology`), `getTheme(segment)`, `themeCssVars(theme, brandColorHex?)`
  (gera o bloco `:root { --brand-*: ... }`), `sortByNavOrder`. **Nunca importar
  este arquivo de um Client Component** — é por isso que `nav-items.ts` não
  depende dele (ver abaixo).
- `src/components/theme/theme-style.tsx` — Server Component que renderiza um
  `<style>` com `themeCssVars(...)`. É colocado no topo de qualquer página que
  representa uma empresa: `(app)/layout.tsx` (painel), `catalogo/[slug]/page.tsx`,
  `agendar/[slug]/page.tsx`, `orcamento/[token]/page.tsx`. Páginas de marketing
  (`/`, `/planos`, `/login`, `/cadastro`, `/recuperar-senha`, `/checkout/*`,
  `/onboarding`) **nunca** recebem `<ThemeStyle>` — ali a marca fica sempre roxo
  NEXO (decisão de produto: reconhecimento da marca-mãe).
- `src/app/globals.css` — define os valores padrão de `--brand-50..950` (roxo
  NEXO) em `:root`. Componentes usam classes tipo
  `bg-[rgb(var(--brand-500)/0.12)]` (canais RGB separados por espaço, não hex,
  para o Tailwind conseguir aplicar `/opacidade` em cima de uma variável).
  `tailwind.config.ts` também usa `rgb(var(--brand-glow)/...)` no `shadow-glow`.
- `src/components/layout/nav-items.ts` — **client-safe de propósito** (sem
  `server-only`). Define `BASE_NAV_ITEMS` (com `key: NavKey`) e duas funções
  puras: `buildNavItems(navOrder, labelOverrides)` (reordena só o grupo
  "modulos" — Orçamentos/Agenda/Catálogo/CRM/IA — segundo o tema; "Principal" e
  "Gestão" não mudam de posição) e `buildMobileNav(navItems)` (Dashboard + 3
  módulos priorizados + Clientes). Quem chama essas funções é sempre um Server
  Component (`(app)/layout.tsx`), que já resolveu o tema e passa o resultado
  como prop pronta para `AppShell` → `Sidebar`/`Topbar`.
- `src/lib/constants.ts` — `SEGMENTS` (8 opções: restaurante, barbearia, salão,
  móveis/marcenaria, prestador, loja, autônomo, outro) tem `emoji`/`preview`
  (cor em hex) — um espelho client-safe e deliberadamente simplificado da
  paleta "de verdade" em `themes.ts`, só para os seletores visuais no
  onboarding e em Configurações → Minha empresa não precisarem importar um
  módulo `server-only`. `BRAND_SWATCHES` (mesmo motivo) fica aqui também, não em
  `themes.ts`.
- `Business.brandColor` (Prisma, `String?`) — "modo personalizado": hex opcional
  que sobrescreve só 400/500/600/700/glow do tema do segmento, mantendo o resto
  da paleta (100/200/300/900) coerente. Tratado **fora do zod** em
  `configuracoes/actions.ts` (`updateBusiness`) de propósito — precisa
  distinguir "não enviado" de "limpar" (voltar ao padrão do segmento), o que um
  campo opcional-vira-undefined do zod não permite com segurança.

**Conversão em massa já feita:** rodei `scripts/theme-convert.mjs` (script de
uso único, mantido no repo como referência) que trocou automaticamente todas
as classes Tailwind estáticas `nexo-<shade>[/opacidade]` por
`rgb(var(--brand-<shade>)/alpha)` em todo `src/` EXCETO nos arquivos de
marketing/auth (lista `EXCLUDE` dentro do script). Se criar uma tela nova
dentro do painel ou de uma página pública de empresa, use direto a sintaxe
`bg-[rgb(var(--brand-500)/0.12)]` (ou herde de `.surface`/`Button`/`Badge`, que
já são theme-aware) — não use `bg-nexo-500` ali. Nas telas de marketing/auth,
o inverso: continue usando `nexo-*` estático.

**Terminologia aplicada até agora** (via `theme.terminology`): rótulo do módulo
Catálogo no menu e na página interna (`catalogLabel`/`catalogItemLabel` —
"Cardápio"/"Prato" para restaurante, "Serviços"/"Serviço" para barbearia/
salão/prestador, "Peças"/"Peça" para móveis), texto do botão de adicionar no
carrinho público (`catalogCta`) e da chamada final da página de agendamento
(`bookingCta`). **Não** foi feita terminologia para Orçamentos/Agenda/CRM/IA em
si (só a prioridade de ordem no menu muda) — se pedirem mais adaptação de
texto, seguir o mesmo padrão: adicionar o campo em `terminology`, threadar
como prop opcional com fallback default no componente, nunca importar
`themes.ts` de um Client Component.

**Para adicionar um nicho novo:** só acrescentar uma entrada em `THEMES` (em
`themes.ts`) e uma entrada em `SEGMENTS` (em `constants.ts`, com `emoji`/
`preview` combinando). Nada mais no app precisa mudar — nav, cores e
terminologia seguem daqui automaticamente.

**Upload de imagem:** `src/lib/uploads.ts` (`saveUploadedImage`/
`deleteUploadedImage`, sem `'use server'` — chamado de dentro de actions que já
passaram por `requireBusiness()`) grava em `public/uploads/<pasta>/<uuid>.<ext>`
(5MB máx, jpg/png/webp/gif) e devolve a URL pública. Isso é **local/dev only**:
em produção real trocar a implementação interna por um bucket (S3, R2, Vercel
Blob) mantendo a mesma assinatura de função. Componente
`src/components/ui/image-upload.tsx` (`<ImageUpload>`) dá o botão "Adicionar
foto" + preview + fallback "ou colar um link"; usado em logo da empresa
(`business-form.tsx`), avatar (`profile-form.tsx`) e foto de produto
(`product-form.tsx`). `public/uploads/` está no `.gitignore` (com `.gitkeep`).

## Deploy (Vercel + Supabase)

Migrado de SQLite (dev) para **Postgres via Supabase**, porque o Vercel roda em
serverless com filesystem somente leitura (SQLite em arquivo não funciona lá).

- **Repositório**: `https://github.com/teixeirzkj/saas` (branch `main`).
- **Banco**: projeto Supabase "saas" (org "Riquelme Teixeira's Org", região
  `sa-east-1`). `prisma/schema.prisma` usa `datasource db { provider =
  "postgresql"; url = env("DATABASE_URL"); directUrl = env("DIRECT_URL") }`.
  `DATABASE_URL` é o pooler modo *transaction* (porta 6543, `?pgbouncer=true`,
  usado em runtime); `DIRECT_URL` é a conexão direta (porta 5432, sem pool,
  usada só por `prisma db push`/`migrate`) — necessário porque o pooler em modo
  transaction não suporta os prepared statements que essas ferramentas usam.
  As duas ficam em Supabase → botão **"Connect"** → aba **ORMs** → **Prisma**.
- **Upload de imagem**: `src/lib/uploads.ts` detecta `BLOB_READ_WRITE_TOKEN` e,
  se presente, usa **Vercel Blob** (`@vercel/blob`) em vez do disco local. Essa
  env var é criada automaticamente ao ativar **Storage → Create Database →
  Blob** no dashboard do projeto na Vercel — nenhuma configuração manual além
  de ativar o recurso.
- **Variáveis de ambiente que precisam existir no projeto Vercel** (Settings →
  Environment Variables): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (gerar
  um novo, não reusar o de dev), `NEXT_PUBLIC_APP_URL` (a URL pública do
  deploy, ex. `https://saas-xxxx.vercel.app`), `PAYMENT_PROVIDER=mock` (ou
  `infinitepay` com `INFINITEPAY_HANDLE`/`INFINITEPAY_API_KEY` se for usar de
  verdade), `PAYMENT_WEBHOOK_SECRET`. `ANTHROPIC_API_KEY` é opcional (sem ela,
  o Nexo IA usa o gerador local). `BLOB_READ_WRITE_TOKEN` é criada sozinha ao
  ativar o Blob Storage.
- **Login/cadastro em produção não usam mais `joao@nexo.app`/dados fake por
  padrão** — o banco Supabase já foi populado com `npm run db:seed` (mesmos
  dados de demonstração do dev). Rodar `npm run db:reset` de novo APAGA e
  recria esses dados — só fazer isso de propósito.

## Cuidados ao continuar / dívidas conhecidas

- Sempre rodar `npx tsc --noEmit` (rápido) e, antes de considerar uma tarefa
  concluída, `npm run build` (mais lento, mas pega erros de prerender que o
  type-check não pega).
- **Nunca importar `src/lib/themes.ts` de um arquivo `'use client'`** — ele tem
  `import 'server-only'` no topo e quebra o bundle do cliente. Se precisar de
  dado de tema num Client Component, resolva no Server Component pai
  (`getTheme(business.segment)`) e passe como prop — é exatamente o padrão já
  usado em `(app)/layout.tsx` → `AppShell`/`Sidebar` e nas 3 páginas públicas.
- O Theme Engine só foi testado verificando o CSS injetado (`curl` + grep no
  `--brand-500` gerado e nos textos de terminologia) e o build de produção —
  não foi verificado visualmente num navegador real ainda. Se algo parecer
  "quase certo mas não bate" numa tela específica (ex.: um componente antigo
  que o script de conversão em massa não pegou porque usava a cor de outro
  jeito, tipo `style={{ color: '#8B2FFF' }}` inline), procure por `#8B2FFF`/
  `8B2FFF` literal no arquivo em vez de assumir que já está tudo convertido.
- `scripts/theme-convert.mjs` foi um script de uso único (a conversão em massa
  já rodou e está commitada) — não precisa rodar de novo, mas serve de
  referência caso surjam novos arquivos com `nexo-<shade>` estático que
  deveriam ser theme-aware.
- **No Windows, pare qualquer `next dev`/`next start` anterior antes de rodar
  `npm run build`** — o Prisma trava o arquivo `query_engine-windows.dll.node` e o
  build falha com `EPERM`. Use `Get-CimInstance Win32_Process -Filter
  "Name='node.exe'"` (PowerShell) pra achar processos `next dev` presos e
  `Stop-Process -Id <id> -Force` antes de tentar de novo.
- Heredocs muito grandes no Bash desta sessão falharam (`unexpected EOF`) —
  preferir a ferramenta `Write` para arquivos grandes.
- CRM usa drag-and-drop nativo HTML5 (sem lib). Funciona bem no desktop; no
  touch/mobile não há drag real — por isso existe o menu "mover para" como
  alternativa. Se o usuário pedir drag touch de verdade, aí sim vale considerar
  `dnd-kit`.
- O checkout mock ativa a assinatura sem validação real de cartão/Pix — está
  correto para demonstração, mas qualquer integração real de gateway deve
  substituir `src/lib/payments.ts` (`buildInfinitePayLink` já está pronto,
  faltaria só configurar `INFINITEPAY_HANDLE` e `PAYMENT_PROVIDER=infinitepay`
  no `.env`).
- `next.config.mjs`, `tailwind.config.ts`, `.env`, `prisma/schema.prisma` já
  existem e estão maduros — não recriar do zero.
