'use server';

import { redirect } from 'next/navigation';

import { clearAdminSessionCookie, setAdminSessionCookie, verifyAdminCredentials } from '@/lib/admin-auth';
import { z } from 'zod';

export type AdminLoginState = { error?: string; errors?: Record<string, string> };

const schema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
});

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = schema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join('.') || 'form'] = issue.message;
    return { errors };
  }

  const admin = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!admin) return { error: 'E-mail ou senha incorretos.' };

  await setAdminSessionCookie({ adminId: admin.id, email: admin.email, name: admin.name });
  redirect('/admin');
}

export async function adminLogoutAction() {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}
