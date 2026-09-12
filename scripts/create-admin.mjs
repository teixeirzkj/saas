// Cria (ou atualiza a senha de) uma conta do painel /admin.
// Uso: node scripts/create-admin.mjs "Nome" email@dominio.com [senha]
// Sem senha informada, gera uma aleatória e imprime na tela (só aparece aqui, uma vez).
import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const [, , name, email, providedPassword] = process.argv;

if (!name || !email) {
  console.error('Uso: node scripts/create-admin.mjs "Nome" email@dominio.com [senha]');
  process.exit(1);
}

const password = providedPassword || randomBytes(9).toString('base64url');
const passwordHash = await bcrypt.hash(password, 11);

const admin = await db.adminUser.upsert({
  where: { email: email.trim().toLowerCase() },
  update: { name, passwordHash },
  create: { name, email: email.trim().toLowerCase(), passwordHash },
});

console.log(`Admin pronto: ${admin.email}`);
console.log(`Senha: ${password}`);
console.log('Acesse em /admin/login');

await db.$disconnect();
