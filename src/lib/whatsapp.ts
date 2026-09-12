import { brl, formatDate, formatTime, normalizePhone } from '@/lib/utils';

/** Link universal do WhatsApp. Funciona no app e no navegador, mobile e desktop. */
export function waLink(phone: string | null | undefined, message: string) {
  const digits = normalizePhone(phone);
  const text = encodeURIComponent(message);
  return digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
}

/**
 * Número comercial da própria NEXO — a venda dos planos é feita por WhatsApp,
 * não por checkout self-service. Todos os CTAs de "Começar agora" da landing
 * e de /planos apontam pra cá.
 */
export const NEXO_SALES_WHATSAPP = '74999188851';

export function salesLink(planName?: string) {
  const message = planName
    ? `Olá! Quero contratar o plano ${planName} da NEXO.`
    : 'Olá! Quero saber mais sobre os planos da NEXO.';
  return waLink(NEXO_SALES_WHATSAPP, message);
}

export type TemplateVars = Record<string, string | number | Date | null | undefined>;

/** Substitui {chave} pelos valores informados. */
export function renderTemplate(body: string, vars: TemplateVars) {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    if (value == null) return '';
    if (value instanceof Date) return formatDate(value);
    return String(value);
  });
}

export const DEFAULT_TEMPLATES: Record<string, string> = {
  quote_send: 'Olá, {cliente}! Tudo bem? Segue seu orçamento solicitado. Acesse o link para conferir os detalhes: {link}',
  appointment_confirm: 'Olá, {cliente}! Confirmando seu horário de {servico} em {data} às {hora}. Posso confirmar?',
  order_confirm: 'Olá, {cliente}! Recebemos seu pedido #{numero}. Total de {total}. Já estamos preparando!',
  followup: 'Olá, {cliente}! Passando para saber se conseguiu analisar a proposta. Ficou alguma dúvida?',
  catalog_share: 'Olá, {cliente}! Esse é o nosso catálogo completo, dá uma olhada: {link}',
};

// ------------------------------------------------------------- builders prontos

export function quoteMessage(opts: {
  template?: string;
  customerName?: string | null;
  businessName: string;
  link: string;
  total: number;
}) {
  const body = opts.template || DEFAULT_TEMPLATES.quote_send;
  return renderTemplate(body, {
    cliente: opts.customerName || 'tudo bem',
    empresa: opts.businessName,
    link: opts.link,
    total: brl(opts.total),
  });
}

export function appointmentMessage(opts: {
  template?: string;
  customerName?: string | null;
  serviceName?: string | null;
  startsAt: Date;
  businessName: string;
}) {
  const body = opts.template || DEFAULT_TEMPLATES.appointment_confirm;
  return renderTemplate(body, {
    cliente: opts.customerName || 'tudo bem',
    servico: opts.serviceName || 'atendimento',
    data: formatDate(opts.startsAt),
    hora: formatTime(opts.startsAt),
    empresa: opts.businessName,
  });
}

export function orderMessage(opts: {
  template?: string;
  customerName?: string | null;
  number: number;
  total: number;
  businessName: string;
}) {
  const body = opts.template || DEFAULT_TEMPLATES.order_confirm;
  return renderTemplate(body, {
    cliente: opts.customerName || 'tudo bem',
    numero: opts.number,
    total: brl(opts.total),
    empresa: opts.businessName,
  });
}

/** Mensagem que o cliente final envia ao negócio ao fechar o carrinho. */
export function cartMessage(opts: {
  businessName: string;
  customerName: string;
  phone: string;
  deliveryType: 'entrega' | 'retirada';
  address?: string;
  paymentMethod: string;
  notes?: string;
  items: { name: string; quantity: number; total: number; addons?: { name: string }[]; notes?: string }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderNumber?: number;
}) {
  const lines: string[] = [];
  lines.push(`*Novo pedido - ${opts.businessName}*`);
  if (opts.orderNumber) lines.push(`Pedido #${opts.orderNumber}`);
  lines.push('');
  for (const item of opts.items) {
    lines.push(`${item.quantity}x ${item.name} - ${brl(item.total)}`);
    if (item.addons?.length) lines.push(`   + ${item.addons.map((a) => a.name).join(', ')}`);
    if (item.notes) lines.push(`   obs: ${item.notes}`);
  }
  lines.push('');
  lines.push(`Subtotal: ${brl(opts.subtotal)}`);
  if (opts.deliveryFee > 0) lines.push(`Entrega: ${brl(opts.deliveryFee)}`);
  lines.push(`*Total: ${brl(opts.total)}*`);
  lines.push('');
  lines.push(`Cliente: ${opts.customerName}`);
  lines.push(`Telefone: ${opts.phone}`);
  lines.push(`Tipo: ${opts.deliveryType === 'entrega' ? 'Entrega' : 'Retirada no local'}`);
  if (opts.deliveryType === 'entrega' && opts.address) lines.push(`Endereço: ${opts.address}`);
  lines.push(`Pagamento: ${opts.paymentMethod}`);
  if (opts.notes) lines.push(`Observações: ${opts.notes}`);
  return lines.join('\n');
}

/** Mensagem enviada pelo cliente ao concluir um agendamento público. */
export function bookingMessage(opts: {
  businessName: string;
  customerName: string;
  serviceName: string;
  startsAt: Date;
  phone: string;
}) {
  return [
    `*Novo agendamento - ${opts.businessName}*`,
    '',
    `Serviço: ${opts.serviceName}`,
    `Data: ${formatDate(opts.startsAt)}`,
    `Horário: ${formatTime(opts.startsAt)}`,
    '',
    `Nome: ${opts.customerName}`,
    `Telefone: ${opts.phone}`,
  ].join('\n');
}
