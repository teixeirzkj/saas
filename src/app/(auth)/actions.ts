'use server';

import { randomBytes } from 'node:crypto';

import { redirect } from 'next/navigation';

import { clearSessionCookie, comparePassword, createAccount, hashPassword, setSessionCookie } from '@/lib/auth';
import { db } from '@/lib/db';
import { fieldErrors, forgotSchema, loginSchema, resetSchema, signupSchema } from '@/lib/validation';

export type ActionState = {
  ok?: boolean;
  error?: string;
  errors?: Record<string, string>;
  message?: string;
  token?: string;
};

// ------------------------------------------------------------------ login

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: { business: true },
  });

  // Mensagem genérica: não revela se o e-mail existe.
  if (!user || !(await comparePassword(parsed.data.password, user.passwordHash))) {
    return { error: 'E-mail ou senha incorretos.' };
  }

  if (user.business?.blocked) {
    return {
      error:
        user.business.blockedReason ||
        'Sua conta está temporariamente bloqueada. Fale com o suporte para regularizar.',
    };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await setSessionCookie({
    userId: user.id,
    businessId: user.businessId,
    email: user.email,
    name: user.name,
  });

  const next = String(formData.get('next') || '');
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : null;

  if (!user.business?.onboardedAt) redirect('/onboarding');
  redirect(safeNext ?? '/dashboard');
}

// ------------------------------------------------------------------ cadastro

export async function signupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    businessName: formData.get('businessName'),
    segment: formData.get('segment') || 'outro',
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await createAccount(parsed.data);
  if ('error' in result && result.error) return { error: result.error };

  redirect('/onboarding');
}

// ------------------------------------------------------------------ logout

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/');
}

// ------------------------------------------------------------------ recuperar senha

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Resposta idêntica exista ou não o usuário (evita enumeração de contas).
  const genericMessage =
    'Se existir uma conta com esse e-mail, você receberá as instruções para criar uma nova senha.';

  if (!user) return { ok: true, message: genericMessage };

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await db.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  // Em produção este token vai por e-mail. Em desenvolvimento devolvemos o link
  // para o fluxo continuar utilizável sem provedor de e-mail configurado.
  const devToken = process.env.NODE_ENV === 'development' ? token : undefined;

  return { ok: true, message: genericMessage, token: devToken };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const record = await db.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: 'Este link expirou ou já foi utilizado. Solicite um novo.' };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true, message: 'Senha alterada com sucesso. Faça login com a nova senha.' };
}
