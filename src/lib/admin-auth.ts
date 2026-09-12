import 'server-only';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  signAdminSession,
  verifyAdminSession,
  type AdminSessionPayload,
} from '@/lib/admin-session';

export async function setAdminSessionCookie(payload: AdminSessionPayload) {
  const token = await signAdminSession(payload);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, adminCookieOptions);
}

export async function clearAdminSessionCookie() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

/** Guard para toda página do painel de admin. Redireciona para /admin/login. */
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const admin = await db.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin) redirect('/admin/login');

  return admin;
}

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  return valid ? admin : null;
}

export function hashAdminPassword(plain: string) {
  return bcrypt.hash(plain, 11);
}
