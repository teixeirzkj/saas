import { z } from 'zod';

const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length ? v : undefined));

export const emailSchema = z.string().trim().toLowerCase().email('Informe um e-mail válido');
export const passwordSchema = z.string().min(8, 'A senha precisa de pelo menos 8 caracteres').max(128);

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email: emailSchema,
  password: passwordSchema,
  businessName: z.string().trim().min(2, 'Informe o nome do seu negócio'),
  segment: z.string().trim().min(1).default('outro'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha'),
});

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    token: z.string().min(10),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não coincidem', path: ['confirm'] });

export const onboardingSchema = z.object({
  businessName: z.string().trim().min(2, 'Informe o nome do seu negócio'),
  segment: z.string().trim().min(1),
  goals: z.array(z.string()).default([]),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do cliente'),
  phone: optionalText(30),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length ? v.toLowerCase() : undefined))
    .refine((v) => !v || z.string().email().safeParse(v).success, { message: 'E-mail inválido' }),
  company: optionalText(120),
  document: optionalText(30),
  address: optionalText(240),
  notes: optionalText(2000),
  source: optionalText(40),
  status: z.enum(['lead', 'ativo', 'inativo']).default('ativo'),
});

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1, 'Descreva o item'),
  quantity: z.coerce.number().min(0.01, 'Quantidade inválida'),
  unitPrice: z.coerce.number().min(0, 'Preço inválido'),
});

export const quoteSchema = z.object({
  customerId: optionalText(40),
  title: z.string().trim().min(2).default('Orçamento'),
  status: z.enum(['rascunho', 'enviado', 'aprovado', 'recusado']).default('rascunho'),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(['value', 'percent']).default('value'),
  notes: optionalText(2000),
  validUntil: optionalText(20),
  items: z.array(quoteItemSchema).min(1, 'Adicione pelo menos um item'),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do serviço'),
  description: optionalText(500),
  durationMin: z.coerce.number().int().min(5, 'Mínimo de 5 minutos').max(1440),
  price: z.coerce.number().min(0),
  color: z.string().trim().default('#8B2FFF'),
  active: z.coerce.boolean().default(true),
});

export const appointmentSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título do compromisso'),
  customerId: optionalText(40),
  serviceId: optionalText(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  durationMin: z.coerce.number().int().min(5).max(1440).default(30),
  status: z.enum(['agendado', 'confirmado', 'concluido', 'cancelado', 'faltou']).default('agendado'),
  notes: optionalText(1000),
});

export const publicBookingSchema = z.object({
  slug: z.string().trim().min(1),
  serviceId: z.string().trim().min(1, 'Escolha um serviço'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha uma data'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Escolha um horário'),
  name: z.string().trim().min(2, 'Informe seu nome'),
  phone: z.string().trim().min(10, 'Informe um telefone válido'),
  notes: optionalText(500),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do produto'),
  description: optionalText(1000),
  price: z.coerce.number().min(0),
  promoPrice: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length ? Number(v.replace(',', '.')) : undefined)),
  categoryId: optionalText(40),
  imageUrl: optionalText(500),
  available: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  addons: z.array(z.object({ name: z.string().trim().min(1), price: z.coerce.number().min(0) })).default([]),
});

export const publicOrderSchema = z.object({
  slug: z.string().trim().min(1),
  customerName: z.string().trim().min(2, 'Informe seu nome'),
  customerPhone: z.string().trim().min(10, 'Informe um telefone válido'),
  deliveryType: z.enum(['entrega', 'retirada']).default('entrega'),
  address: optionalText(300),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao']).default('pix'),
  notes: optionalText(500),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        addons: z.array(z.object({ name: z.string(), price: z.coerce.number() })).default([]),
        notes: optionalText(200),
      }),
    )
    .min(1, 'Seu carrinho está vazio'),
});

export const dealSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título da negociação'),
  customerId: optionalText(40),
  stage: z
    .enum(['novo_lead', 'contato', 'negociacao', 'proposta', 'vendido', 'pos_venda'])
    .default('novo_lead'),
  value: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().int().min(0).max(100).default(50),
  source: optionalText(40),
  notes: optionalText(2000),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Descreva a tarefa'),
  description: optionalText(1000),
  dueAt: optionalText(30),
  priority: z.enum(['baixa', 'media', 'alta']).default('media'),
  customerId: optionalText(40),
  dealId: optionalText(40),
});

export const aiSchema = z.object({
  type: z.enum(['post', 'legenda', 'story', 'anuncio', 'oferta', 'descricao', 'reels', 'calendario']),
  businessName: z.string().trim().min(1, 'Informe o nome do negócio'),
  segment: z.string().trim().min(1, 'Informe o segmento'),
  product: z.string().trim().min(2, 'Informe o produto ou serviço'),
  objective: z.string().trim().min(1, 'Escolha um objetivo'),
  audience: z.string().trim().min(2, 'Descreva o público'),
  extra: optionalText(600),
  tone: optionalText(60),
});

export const businessSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da empresa'),
  segment: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(3, 'O link precisa de pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  instagram: optionalText(60),
  email: optionalText(120),
  address: optionalText(240),
  city: optionalText(80),
  state: optionalText(40),
  document: optionalText(30),
  about: optionalText(600),
  logoUrl: optionalText(500),
  catalogHeadline: optionalText(160),
  deliveryFee: z.coerce.number().min(0).default(0),
  minOrder: z.coerce.number().min(0).default(0),
  quoteValidDays: z.coerce.number().int().min(1).max(90).default(7),
  bookingEnabled: z.coerce.boolean().default(true),
  catalogEnabled: z.coerce.boolean().default(true),
  bookingSlotMin: z.coerce.number().int().min(10).max(120).default(30),
  workdayStart: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  workdayEnd: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  workdays: z.array(z.coerce.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome'),
  email: emailSchema,
  avatarUrl: optionalText(500),
});

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, 'Informe a senha atual'),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'As senhas não coincidem', path: ['confirm'] });

/** Converte erros do zod no formato usado pelos formulários. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Verifique os dados informados';
}
