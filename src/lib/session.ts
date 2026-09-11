import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'nexo_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export type SessionPayload = {
  userId: string;
  businessId: string | null;
  email: string;
  name: string;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error('AUTH_SECRET ausente ou muito curto. Defina no .env antes de iniciar o app.');
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('nexo')
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: 'nexo' });
    if (typeof payload.userId !== 'string') return null;
    return {
      userId: payload.userId,
      businessId: (payload.businessId as string | null) ?? null,
      email: (payload.email as string) ?? '',
      name: (payload.name as string) ?? '',
    };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
