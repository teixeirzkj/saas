import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

/**
 * Rotas do painel: exigem sessão válida.
 * Usa prefixo simples (rota + "/") para tudo, EXCETO "/catalogo": essa rota colide
 * com a página pública "/catalogo/[slug]" (a loja do cliente final), então ali só
 * a lista em si e o painel de pedidos são protegidos — o restante (qualquer slug)
 * é a vitrine pública e não deve pedir login.
 */
const PROTECTED = ['/dashboard', '/orcamentos', '/agenda', '/crm', '/ia', '/clientes', '/financeiro', '/configuracoes', '/onboarding'];
const PROTECTED_EXACT = ['/catalogo', '/catalogo/pedidos'];

/** Rotas de autenticação: quem já está logado é mandado para o painel. */
const AUTH_ROUTES = ['/login', '/cadastro', '/recuperar-senha'];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Painel de admin: sessão totalmente separada da sessão de tenant, checada
  // antes de qualquer outra coisa (nunca deve cair nas regras de PROTECTED).
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const adminSession = await verifyAdminSession(adminToken);
    const isAdminLogin = pathname === '/admin/login';

    if (!isAdminLogin && !adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }

    if (isAdminLogin && adminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      url.search = '';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isProtected =
    PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    PROTECTED_EXACT.includes(pathname);
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Cabeçalhos de segurança básicos
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
