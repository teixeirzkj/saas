import { SignJWT, jwtVerify } from 'jose';

/**
 * Sessão do painel de administração da NEXO (dono da plataforma).
 * Completamente separada da sessão de tenant (`src/lib/session.ts`): cookie
 * diferente, issuer diferente no JWT. Mesmo que alguém roube um cookie de
 * negócio, ele nunca passa na verificação de admin (issuer não bate) — e
 * vice-versa.
 */

export const ADMIN_SESSION_COOKIE = 'nexo_admin_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 horas — sessão de admin expira mais rápido de propósito

export type AdminSessionPayload = {
  adminId: string;
  email: string;
  name: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error('AUTH_SECRET ausente ou muito curto.');
  }
  return new TextEncoder().encode(value);
}

export async function signAdminSession(payload: AdminSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('nexo-admin')
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifyAdminSession(token?: string | null): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'nexo-admin' });
    if (typeof payload.adminId !== 'string') return null;
    return {
      adminId: payload.adminId,
      email: (payload.email as string) ?? '',
      name: (payload.name as string) ?? '',
    };
  } catch {
    return null;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
