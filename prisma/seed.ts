/**
 * Seed do NEXO.
 *
 * Cria:
 *  - os 3 planos comercializados
 *  - a empresa demo "Studio Aurora" (joao@nexo.app / nexo1234) com dados em TODOS os módulos
 *  - uma segunda empresa "Cantina Bella" (maria@nexo.app / nexo1234) para provar o isolamento
 *
 * Rode com: npm run db:seed  (ou npm run db:reset para recriar do zero)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { PLANS } from '../src/lib/plans';

const db = new PrismaClient();

const DEMO_PASSWORD = 'nexo1234';

// ------------------------------------------------------------------ helpers

function daysFromNow(days: number, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

function pick<T>(list: readonly T[], i: number) {
  return list[i % list.length];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------------ planos

async function seedPlans() {
  for (const plan of PLANS) {
    await db.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceCents: plan.priceCents,
        description: plan.description,
        highlight: plan.highlight,
        order: plan.order,
        maxCustomers: plan.limits.maxCustomers,
        maxQuotes: plan.limits.maxQuotes,
        maxProducts: plan.limits.maxProducts,
        maxUsers: plan.limits.maxUsers,
        aiCredits: plan.limits.aiCredits,
        features: JSON.stringify(plan.features),
      },
      create: {
        code: plan.code,
        name: plan.name,
        priceCents: plan.priceCents,
        interval: plan.interval,
        description: plan.description,
        highlight: plan.highlight,
        order: plan.order,
        maxCustomers: plan.limits.maxCustomers,
        maxQuotes: plan.limits.maxQuotes,
        maxProducts: plan.limits.maxProducts,
        maxUsers: plan.limits.maxUsers,
        aiCredits: plan.limits.aiCredits,
        features: JSON.stringify(plan.features),
      },
    });
  }
  console.log(`  planos: ${PLANS.length}`);
}

function defaultTemplates() {
  return [
    {
      key: 'quote_send',
      title: 'Enviar orçamento',
      body: 'Olá, {cliente}! Tudo bem? Segue seu orçamento solicitado. Acesse o link para conferir os detalhes: {link}',
    },
    {
      key: 'appointment_confirm',
      title: 'Confirmar agendamento',
      body: 'Olá, {cliente}! Confirmando seu horário de {servico} em {data} às {hora}. Posso confirmar?',
    },
    {
      key: 'order_confirm',
      title: 'Confirmar pedido',
      body: 'Olá, {cliente}! Recebemos seu pedido #{numero}. Total de {total}. Já estamos preparando!',
    },
    {
      key: 'followup',
      title: 'Follow-up de venda',
      body: 'Olá, {cliente}! Passando para saber se conseguiu analisar a proposta. Ficou alguma dúvida?',
    },
    {
      key: 'catalog_share',
      title: 'Enviar catálogo',
      body: 'Olá, {cliente}! Esse é o nosso catálogo completo, dá uma olhada: {link}',
    },
  ];
}

// ------------------------------------------------------------------ empresa demo principal

const AURORA_CUSTOMERS = [
  { name: 'Marina Alves', phone: '11987650001', email: 'marina.alves@email.com', source: 'instagram', status: 'ativo' },
  { name: 'Rafael Duarte', phone: '11987650002', email: 'rafa.duarte@email.com', source: 'indicacao', status: 'ativo' },
  { name: 'Camila Prado', phone: '11987650003', email: 'camila.prado@email.com', source: 'whatsapp', status: 'ativo' },
  { name: 'Bruno Teixeira', phone: '11987650004', email: 'bruno.tx@email.com', source: 'site', status: 'lead' },
  { name: 'Juliana Reis', phone: '11987650005', email: 'ju.reis@email.com', source: 'instagram', status: 'ativo' },
  {
    name: 'Eduardo Lima',
    phone: '11987650006',
    email: 'edu.lima@email.com',
    company: 'Lima Eventos',
    source: 'indicacao',
    status: 'ativo',
  },
  { name: 'Patrícia Gomes', phone: '11987650007', email: 'paty.gomes@email.com', source: 'presencial', status: 'ativo' },
  { name: 'Thiago Mendes', phone: '11987650008', email: 'thiago.m@email.com', source: 'whatsapp', status: 'lead' },
  { name: 'Fernanda Costa', phone: '11987650009', email: 'fer.costa@email.com', source: 'instagram', status: 'ativo' },
  {
    name: 'Rodrigo Barros',
    phone: '11987650010',
    email: 'rodrigo.barros@email.com',
    company: 'Barros Advocacia',
    source: 'site',
    status: 'ativo',
  },
  { name: 'Larissa Nunes', phone: '11987650011', email: 'lari.nunes@email.com', source: 'indicacao', status: 'inativo' },
  { name: 'Gustavo Rocha', phone: '11987650012', email: 'gu.rocha@email.com', source: 'whatsapp', status: 'ativo' },
  { name: 'Aline Ferreira', phone: '11987650013', email: 'aline.f@email.com', source: 'instagram', status: 'lead' },
  { name: 'Vitor Hugo Santana', phone: '11987650014', email: 'vitor.hs@email.com', source: 'presencial', status: 'ativo' },
];

const AURORA_SERVICES = [
  { name: 'Corte feminino', durationMin: 60, price: 90, color: '#8B2FFF' },
  { name: 'Corte masculino', durationMin: 30, price: 55, color: '#5AA9FF' },
  { name: 'Coloração completa', durationMin: 150, price: 320, color: '#B48CFF' },
  { name: 'Escova + hidratação', durationMin: 75, price: 140, color: '#2FD98A' },
  { name: 'Design de sobrancelha', durationMin: 30, price: 45, color: '#FFB020' },
  { name: 'Penteado para evento', durationMin: 90, price: 210, color: '#FF6B8A' },
];

const AURORA_CATALOG: { category: string; items: { name: string; description: string; price: number; promo?: number }[] }[] =
  [
    {
      category: 'Kits de cuidado',
      items: [
        {
          name: 'Kit Hidratação Intensa',
          description: 'Shampoo, máscara e leave-in para cabelos secos. Rende até 2 meses.',
          price: 189.9,
          promo: 159.9,
        },
        {
          name: 'Kit Loiras',
          description: 'Linha completa matizadora para manter o loiro sem amarelado.',
          price: 219.9,
        },
        { name: 'Kit Cachos Definidos', description: 'Ativador, gelatina e finalizador anti-frizz.', price: 174.9 },
      ],
    },
    {
      category: 'Tratamentos',
      items: [
        { name: 'Ampola de Reconstrução', description: 'Aplicação única, resultado imediato no brilho.', price: 49.9 },
        { name: 'Botox Capilar', description: 'Reduz volume e alinha os fios por até 6 semanas.', price: 129.9 },
        { name: 'Cronograma Capilar (3 sessões)', description: 'Plano completo acompanhado pela equipe.', price: 349.9 },
      ],
    },
    {
      category: 'Finalizadores',
      items: [
        { name: 'Óleo de Argan 60ml', description: 'Brilho instantâneo, sem pesar no fio.', price: 79.9 },
        { name: 'Protetor Térmico', description: 'Obrigatório antes de prancha e secador.', price: 64.9 },
        { name: 'Spray Fixador Suave', description: 'Fixa sem endurecer, ideal para penteados.', price: 58.9 },
      ],
    },
    {
      category: 'Pacotes',
      items: [
        {
          name: 'Pacote Noiva Completo',
          description: 'Teste + dia do evento: penteado, maquiagem e retoque.',
          price: 890,
          promo: 790,
        },
        { name: 'Pacote Formatura', description: 'Penteado e maquiagem com hora marcada.', price: 420 },
        { name: 'Day Spa Capilar', description: 'Três horas de tratamento completo com massagem.', price: 380 },
      ],
    },
  ];

async function seedAurora() {
  const proPlan = await db.plan.findUniqueOrThrow({ where: { code: 'pro' } });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 11);

  const business = await db.business.create({
    data: {
      name: 'Studio Aurora',
      slug: 'studio-aurora',
      segment: 'salao',
      phone: '1132658800',
      whatsapp: '11987654321',
      instagram: '@studioaurora',
      email: 'contato@studioaurora.com.br',
      address: 'Rua das Palmeiras, 480 - Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      document: '42.581.330/0001-70',
      about: 'Studio de beleza especializado em coloração, tratamentos capilares e produção para eventos.',
      catalogHeadline: 'Produtos e pacotes escolhidos pela nossa equipe',
      deliveryFee: 12,
      minOrder: 60,
      quoteValidDays: 7,
      primaryGoals: JSON.stringify(['clientes', 'agenda', 'vendas', 'marketing']),
      onboardedAt: daysFromNow(-92, 9),
      workdays: JSON.stringify([1, 2, 3, 4, 5, 6]),
      workdayStart: '09:00',
      workdayEnd: '19:00',
      bookingSlotMin: 30,
      subscription: {
        create: {
          planId: proPlan.id,
          status: 'active',
          provider: 'mock',
          currentPeriodStart: daysFromNow(-12, 9),
          currentPeriodEnd: daysFromNow(18, 9),
          aiUsed: 11,
          aiResetAt: daysFromNow(-12, 9),
        },
      },
      messageTemplates: { create: defaultTemplates() },
      integrations: {
        create: [
          { provider: 'whatsapp', status: 'connected', connectedAt: daysFromNow(-90) },
          { provider: 'instagram', status: 'connected', connectedAt: daysFromNow(-88) },
          { provider: 'payment', status: 'connected', connectedAt: daysFromNow(-12) },
        ],
      },
    },
  });

  const owner = await db.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@nexo.app',
      passwordHash,
      businessId: business.id,
      role: 'owner',
      emailVerified: true,
      lastLoginAt: new Date(),
    },
  });

  // -------------------------------------------------- clientes
  const customers = [];
  for (let i = 0; i < AURORA_CUSTOMERS.length; i++) {
    const c = AURORA_CUSTOMERS[i];
    customers.push(
      await db.customer.create({
        data: {
          businessId: business.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          company: c.company,
          source: c.source,
          status: c.status,
          address: i % 3 === 0 ? `Rua ${1000 + i}, apto ${10 + i} - São Paulo/SP` : undefined,
          notes: i % 4 === 0 ? 'Prefere atendimento no fim da tarde.' : undefined,
          createdAt: daysFromNow(-88 + i * 6),
          lastActivityAt: daysFromNow(-Math.floor(Math.random() * 20)),
        },
      }),
    );
  }

  // -------------------------------------------------- serviços
  const services = [];
  for (const s of AURORA_SERVICES) {
    services.push(await db.service.create({ data: { businessId: business.id, ...s } }));
  }

  // -------------------------------------------------- orçamentos
  const quoteBlueprints: {
    title: string;
    status: string;
    customerIndex: number;
    day: number;
    items: { description: string; quantity: number; unitPrice: number }[];
    discount?: number;
  }[] = [
    {
      title: 'Pacote Noiva - Marina',
      status: 'aprovado',
      customerIndex: 0,
      day: -34,
      items: [
        { description: 'Teste de penteado e maquiagem', quantity: 1, unitPrice: 280 },
        { description: 'Produção do dia (penteado + make)', quantity: 1, unitPrice: 890 },
        { description: 'Retoque durante o evento', quantity: 1, unitPrice: 220 },
      ],
      discount: 90,
    },
    {
      title: 'Produção formatura - Camila',
      status: 'aprovado',
      customerIndex: 2,
      day: -27,
      items: [
        { description: 'Penteado para evento', quantity: 1, unitPrice: 210 },
        { description: 'Maquiagem completa', quantity: 1, unitPrice: 260 },
      ],
    },
    {
      title: 'Cronograma capilar 3 meses - Juliana',
      status: 'enviado',
      customerIndex: 4,
      day: -6,
      items: [
        { description: 'Sessão de reconstrução', quantity: 6, unitPrice: 120 },
        { description: 'Kit de manutenção domiciliar', quantity: 1, unitPrice: 189.9 },
      ],
      discount: 10,
    },
    {
      title: 'Evento corporativo - Lima Eventos',
      status: 'enviado',
      customerIndex: 5,
      day: -3,
      items: [
        { description: 'Atendimento de beleza para equipe (por pessoa)', quantity: 12, unitPrice: 145 },
        { description: 'Deslocamento e estrutura', quantity: 1, unitPrice: 380 },
      ],
      discount: 5,
    },
    {
      title: 'Coloração + tratamento - Patrícia',
      status: 'aprovado',
      customerIndex: 6,
      day: -19,
      items: [
        { description: 'Coloração completa', quantity: 1, unitPrice: 320 },
        { description: 'Botox capilar', quantity: 1, unitPrice: 129.9 },
      ],
    },
    {
      title: 'Pacote mensal - Fernanda',
      status: 'recusado',
      customerIndex: 8,
      day: -22,
      items: [
        { description: 'Escova 4x no mês', quantity: 4, unitPrice: 85 },
        { description: 'Hidratação 2x no mês', quantity: 2, unitPrice: 95 },
      ],
    },
    {
      title: 'Consultoria de imagem - Rodrigo',
      status: 'rascunho',
      customerIndex: 9,
      day: -1,
      items: [{ description: 'Consultoria de imagem e corte', quantity: 1, unitPrice: 450 }],
    },
    {
      title: 'Day spa capilar - Gustavo',
      status: 'aprovado',
      customerIndex: 11,
      day: -9,
      items: [
        { description: 'Day spa capilar completo', quantity: 1, unitPrice: 380 },
        { description: 'Óleo de argan 60ml', quantity: 1, unitPrice: 79.9 },
      ],
      discount: 20,
    },
    {
      title: 'Produção aniversário - Vitor',
      status: 'enviado',
      customerIndex: 13,
      day: -2,
      items: [
        { description: 'Corte masculino premium', quantity: 1, unitPrice: 90 },
        { description: 'Barba e finalização', quantity: 1, unitPrice: 70 },
      ],
    },
    {
      title: 'Orçamento inicial - Bruno',
      status: 'rascunho',
      customerIndex: 3,
      day: 0,
      items: [{ description: 'Corte masculino', quantity: 1, unitPrice: 55 }],
    },
  ];

  let quoteNumber = 1000;
  for (const bp of quoteBlueprints) {
    const subtotal = round2(bp.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
    const discount = bp.discount ?? 0;
    const total = round2(Math.max(0, subtotal - discount));
    const createdAt = daysFromNow(bp.day, 11);

    await db.quote.create({
      data: {
        businessId: business.id,
        customerId: customers[bp.customerIndex].id,
        number: ++quoteNumber,
        title: bp.title,
        status: bp.status,
        subtotal,
        discount,
        discountType: 'value',
        total,
        notes:
          bp.status === 'aprovado'
            ? 'Cliente aprovou por WhatsApp. Sinal de 50% recebido.'
            : 'Valores válidos conforme prazo indicado. Pagamento em até 3x sem juros.',
        validUntil: daysFromNow(bp.day + 7, 23, 59),
        createdAt,
        sentAt: bp.status === 'rascunho' ? null : createdAt,
        respondedAt: ['aprovado', 'recusado'].includes(bp.status) ? daysFromNow(bp.day + 2, 15) : null,
        items: {
          create: bp.items.map((item, order) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: round2(item.quantity * item.unitPrice),
            order,
          })),
        },
      },
    });
  }

  // -------------------------------------------------- agenda
  const appointmentPlan: { day: number; hour: number; minute: number; serviceIndex: number; customerIndex: number; status: string }[] =
    [
      { day: -14, hour: 10, minute: 0, serviceIndex: 0, customerIndex: 0, status: 'concluido' },
      { day: -13, hour: 14, minute: 30, serviceIndex: 2, customerIndex: 6, status: 'concluido' },
      { day: -11, hour: 9, minute: 30, serviceIndex: 1, customerIndex: 1, status: 'concluido' },
      { day: -9, hour: 16, minute: 0, serviceIndex: 3, customerIndex: 4, status: 'concluido' },
      { day: -8, hour: 11, minute: 0, serviceIndex: 4, customerIndex: 8, status: 'cancelado' },
      { day: -6, hour: 15, minute: 0, serviceIndex: 5, customerIndex: 2, status: 'concluido' },
      { day: -4, hour: 10, minute: 30, serviceIndex: 0, customerIndex: 12, status: 'faltou' },
      { day: -2, hour: 13, minute: 0, serviceIndex: 2, customerIndex: 10, status: 'concluido' },
      { day: -1, hour: 17, minute: 0, serviceIndex: 1, customerIndex: 11, status: 'concluido' },
      { day: 0, hour: 9, minute: 0, serviceIndex: 1, customerIndex: 1, status: 'confirmado' },
      { day: 0, hour: 11, minute: 0, serviceIndex: 3, customerIndex: 4, status: 'confirmado' },
      { day: 0, hour: 14, minute: 30, serviceIndex: 0, customerIndex: 8, status: 'agendado' },
      { day: 0, hour: 16, minute: 30, serviceIndex: 4, customerIndex: 12, status: 'agendado' },
      { day: 1, hour: 10, minute: 0, serviceIndex: 2, customerIndex: 0, status: 'confirmado' },
      { day: 1, hour: 15, minute: 0, serviceIndex: 5, customerIndex: 6, status: 'agendado' },
      { day: 2, hour: 9, minute: 30, serviceIndex: 1, customerIndex: 13, status: 'agendado' },
      { day: 2, hour: 14, minute: 0, serviceIndex: 3, customerIndex: 2, status: 'agendado' },
      { day: 3, hour: 11, minute: 0, serviceIndex: 0, customerIndex: 9, status: 'agendado' },
      { day: 4, hour: 16, minute: 0, serviceIndex: 4, customerIndex: 7, status: 'agendado' },
      { day: 5, hour: 10, minute: 0, serviceIndex: 2, customerIndex: 5, status: 'confirmado' },
      { day: 6, hour: 13, minute: 30, serviceIndex: 5, customerIndex: 0, status: 'agendado' },
      { day: 8, hour: 9, minute: 0, serviceIndex: 1, customerIndex: 3, status: 'agendado' },
      { day: 10, hour: 15, minute: 30, serviceIndex: 3, customerIndex: 11, status: 'agendado' },
    ];

  for (const a of appointmentPlan) {
    const service = services[a.serviceIndex];
    const customer = customers[a.customerIndex];
    const startsAt = daysFromNow(a.day, a.hour, a.minute);
    await db.appointment.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        serviceId: service.id,
        title: `${service.name} - ${customer.name.split(' ')[0]}`,
        startsAt,
        endsAt: addMinutes(startsAt, service.durationMin),
        status: a.status,
        source: a.day % 3 === 0 ? 'publico' : 'interno',
        notes: a.status === 'faltou' ? 'Cliente não compareceu e não avisou.' : undefined,
      },
    });
  }

  // -------------------------------------------------- catálogo
  const products: { id: string; name: string; price: number; promoPrice: number | null }[] = [];
  let categoryOrder = 0;
  for (const group of AURORA_CATALOG) {
    const category = await db.category.create({
      data: { businessId: business.id, name: group.category, order: categoryOrder++ },
    });
    let productOrder = 0;
    for (const item of group.items) {
      products.push(
        await db.product.create({
          data: {
            businessId: business.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price,
            promoPrice: item.promo,
            available: true,
            featured: productOrder === 0,
            order: productOrder++,
            addons:
              group.category === 'Pacotes'
                ? JSON.stringify([
                    { name: 'Maquiagem extra (acompanhante)', price: 180 },
                    { name: 'Atendimento a domicílio', price: 250 },
                  ])
                : JSON.stringify([]),
          },
        }),
      );
    }
  }

  // -------------------------------------------------- pedidos
  const orderPlan: { day: number; status: string; customerIndex: number; productIndexes: number[]; delivery: boolean }[] = [
    { day: -41, status: 'concluido', customerIndex: 0, productIndexes: [0, 6], delivery: true },
    { day: -35, status: 'concluido', customerIndex: 2, productIndexes: [1], delivery: false },
    { day: -30, status: 'concluido', customerIndex: 4, productIndexes: [3, 7], delivery: true },
    { day: -24, status: 'concluido', customerIndex: 6, productIndexes: [9], delivery: false },
    { day: -18, status: 'concluido', customerIndex: 8, productIndexes: [2, 8], delivery: true },
    { day: -14, status: 'cancelado', customerIndex: 12, productIndexes: [4], delivery: true },
    { day: -11, status: 'concluido', customerIndex: 1, productIndexes: [5, 6], delivery: false },
    { day: -7, status: 'concluido', customerIndex: 9, productIndexes: [10], delivery: false },
    { day: -4, status: 'concluido', customerIndex: 11, productIndexes: [0, 3], delivery: true },
    { day: -2, status: 'pronto', customerIndex: 13, productIndexes: [7], delivery: false },
    { day: -1, status: 'preparando', customerIndex: 5, productIndexes: [1, 8], delivery: true },
    { day: 0, status: 'confirmado', customerIndex: 3, productIndexes: [6], delivery: true },
    { day: 0, status: 'novo', customerIndex: 7, productIndexes: [2, 5], delivery: false },
    { day: 0, status: 'novo', customerIndex: 10, productIndexes: [11], delivery: true },
  ];

  let orderNumber = 100;
  for (const o of orderPlan) {
    const customer = customers[o.customerIndex];
    const items = o.productIndexes.map((idx, i) => {
      const product = products[idx];
      const price = product.promoPrice ?? product.price;
      const quantity = i === 0 ? 1 : ((idx % 2) + 1);
      return {
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: price,
        total: round2(price * quantity),
        addons: JSON.stringify([]),
      };
    });
    const subtotal = round2(items.reduce((sum, i) => sum + i.total, 0));
    const deliveryFee = o.delivery ? 12 : 0;

    await db.order.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        number: ++orderNumber,
        status: o.status,
        customerName: customer.name,
        customerPhone: customer.phone ?? '',
        address: o.delivery ? (customer.address ?? 'Rua das Palmeiras, 480 - São Paulo/SP') : null,
        deliveryType: o.delivery ? 'entrega' : 'retirada',
        paymentMethod: pick(['pix', 'cartao', 'dinheiro'], o.day + 3),
        subtotal,
        deliveryFee,
        total: round2(subtotal + deliveryFee),
        notes: o.day === 0 ? 'Cliente pediu para avisar quando estiver pronto.' : undefined,
        source: 'publico',
        createdAt: daysFromNow(o.day, 12, 15),
        items: { create: items },
      },
    });
  }

  // -------------------------------------------------- CRM
  const dealPlan: {
    title: string;
    stage: string;
    value: number;
    customerIndex: number;
    probability: number;
    day: number;
  }[] = [
    { title: 'Pacote noiva - indicação Instagram', stage: 'novo_lead', value: 1200, customerIndex: 3, probability: 20, day: -2 },
    { title: 'Consultoria de imagem', stage: 'novo_lead', value: 450, customerIndex: 12, probability: 25, day: -1 },
    { title: 'Assinatura mensal de escova', stage: 'contato', value: 480, customerIndex: 7, probability: 40, day: -5 },
    { title: 'Produção para casamento (madrinhas)', stage: 'contato', value: 2100, customerIndex: 9, probability: 45, day: -4 },
    { title: 'Cronograma capilar 3 meses', stage: 'negociacao', value: 909, customerIndex: 4, probability: 60, day: -6 },
    { title: 'Evento corporativo Lima', stage: 'proposta', value: 2120, customerIndex: 5, probability: 75, day: -3 },
    { title: 'Pacote formatura turma direito', stage: 'proposta', value: 3400, customerIndex: 2, probability: 70, day: -8 },
    { title: 'Day spa - pacote presente', stage: 'vendido', value: 440, customerIndex: 11, probability: 100, day: -9 },
    { title: 'Coloração + botox', stage: 'vendido', value: 449.9, customerIndex: 6, probability: 100, day: -19 },
    { title: 'Pacote noiva Marina', stage: 'pos_venda', value: 1300, customerIndex: 0, probability: 100, day: -34 },
    { title: 'Produção formatura Camila', stage: 'pos_venda', value: 470, customerIndex: 2, probability: 100, day: -27 },
    { title: 'Renovação assinatura', stage: 'contato', value: 520, customerIndex: 1, probability: 50, day: -7 },
  ];

  const deals = [];
  let orderIdx = 0;
  for (const d of dealPlan) {
    deals.push(
      await db.deal.create({
        data: {
          businessId: business.id,
          customerId: customers[d.customerIndex].id,
          title: d.title,
          stage: d.stage,
          value: d.value,
          probability: d.probability,
          source: customers[d.customerIndex].source,
          order: orderIdx++,
          notes: d.stage === 'proposta' ? 'Proposta enviada, aguardando retorno do cliente.' : undefined,
          lastInteractionAt: daysFromNow(d.day + 1, 14),
          closedAt: ['vendido', 'pos_venda'].includes(d.stage) ? daysFromNow(d.day + 2, 16) : null,
          createdAt: daysFromNow(d.day, 10),
        },
      }),
    );
  }

  // -------------------------------------------------- tarefas
  const taskPlan: { title: string; day: number; priority: string; done: boolean; dealIndex?: number; customerIndex?: number }[] =
    [
      { title: 'Ligar para Eduardo confirmar evento corporativo', day: 0, priority: 'alta', done: false, dealIndex: 5 },
      { title: 'Enviar follow-up da proposta de formatura', day: 0, priority: 'alta', done: false, dealIndex: 6 },
      { title: 'Confirmar horários de amanhã pelo WhatsApp', day: 0, priority: 'media', done: false },
      { title: 'Repor estoque do Kit Loiras', day: 0, priority: 'media', done: false },
      { title: 'Postar antes e depois da Camila', day: 0, priority: 'baixa', done: true },
      { title: 'Cobrar sinal do pacote noiva', day: 1, priority: 'alta', done: false, customerIndex: 3 },
      { title: 'Revisar tabela de preços do trimestre', day: 3, priority: 'baixa', done: false },
      { title: 'Agendar retorno da Juliana', day: 2, priority: 'media', done: false, customerIndex: 4 },
      { title: 'Fechar caixa da semana', day: -1, priority: 'media', done: true },
    ];

  for (const t of taskPlan) {
    await db.task.create({
      data: {
        businessId: business.id,
        userId: owner.id,
        title: t.title,
        dueAt: daysFromNow(t.day, 17),
        priority: t.priority,
        done: t.done,
        doneAt: t.done ? daysFromNow(t.day, 18) : null,
        dealId: t.dealIndex != null ? deals[t.dealIndex].id : undefined,
        customerId: t.customerIndex != null ? customers[t.customerIndex].id : undefined,
      },
    });
  }

  // -------------------------------------------------- notas
  await db.note.createMany({
    data: [
      {
        businessId: business.id,
        userId: owner.id,
        customerId: customers[0].id,
        content: 'Casamento em dezembro. Prefere penteado preso e maquiagem clean. Alergia a esmalte com formol.',
      },
      {
        businessId: business.id,
        userId: owner.id,
        customerId: customers[5].id,
        content: 'Empresa faz 2 eventos por ano. Sempre pede nota fiscal e pagamento em 30 dias.',
      },
      {
        businessId: business.id,
        userId: owner.id,
        dealId: deals[5].id,
        content: 'Eduardo pediu para reduzir o valor do deslocamento. Margem aceita até R$ 300.',
      },
      {
        businessId: business.id,
        userId: owner.id,
        customerId: customers[4].id,
        content: 'Cabelo com histórico de descoloração. Iniciar cronograma pela reconstrução.',
      },
    ],
  });

  // -------------------------------------------------- IA
  await db.aIContent.createMany({
    data: [
      {
        businessId: business.id,
        userId: owner.id,
        type: 'post',
        prompt: JSON.stringify({
          businessName: 'Studio Aurora',
          segment: 'salão de beleza',
          product: 'Cronograma capilar',
          objective: 'vender',
          audience: 'mulheres de 25 a 45 anos que já descoloriram o cabelo',
        }),
        output:
          'Você não precisa cortar tudo para recuperar seu cabelo.\n\nNo Studio Aurora, o cronograma capilar é montado fio por fio: a gente avalia, define as etapas e você acompanha a mudança sessão por sessão.\nSem promessa mágica. Com método.\n\nChama no direct que a gente monta o seu.\n\n#cronogramacapilar #cabelosaudavel #studioaurora #pinheiros #beleza #hidratacao #reconstrucao #atendimento',
        saved: true,
        createdAt: daysFromNow(-5, 15),
      },
      {
        businessId: business.id,
        userId: owner.id,
        type: 'oferta',
        prompt: JSON.stringify({
          businessName: 'Studio Aurora',
          segment: 'salão de beleza',
          product: 'Kit Hidratação Intensa',
          objective: 'vender',
          audience: 'clientes que já fazem tratamento no studio',
        }),
        output:
          'OFERTA: Kit Hidratação Intensa com condição especial\n\nO que está incluído:\n• Shampoo, máscara e leave-in\n• Orientação de uso personalizada\n• Entrega em São Paulo\n\nUrgência: válido até domingo ou enquanto durar o estoque.',
        saved: true,
        createdAt: daysFromNow(-2, 11),
      },
    ],
  });

  // -------------------------------------------------- notificações e atividades
  await db.notification.createMany({
    data: [
      {
        businessId: business.id,
        userId: owner.id,
        title: 'Novo pedido recebido',
        body: 'Pedido #114 de Patrícia Gomes aguardando confirmação.',
        type: 'order',
        href: '/catalogo/pedidos',
      },
      {
        businessId: business.id,
        userId: owner.id,
        title: 'Orçamento aprovado',
        body: 'Gustavo Rocha aprovou o Day spa capilar.',
        type: 'quote',
        href: '/orcamentos',
        createdAt: daysFromNow(-1, 16),
      },
      {
        businessId: business.id,
        userId: owner.id,
        title: 'Agendamento pela página pública',
        body: 'Fernanda Costa marcou Corte feminino para hoje às 14:30.',
        type: 'appointment',
        href: '/agenda',
        createdAt: daysFromNow(-1, 9),
      },
      {
        businessId: business.id,
        userId: owner.id,
        title: 'Plano Profissional ativo',
        body: 'Sua próxima cobrança acontece em 18 dias.',
        type: 'success',
        href: '/configuracoes/assinatura',
        read: true,
        createdAt: daysFromNow(-12, 9),
      },
    ],
  });

  await db.activity.createMany({
    data: [
      {
        businessId: business.id,
        type: 'order.created',
        title: 'Novo pedido recebido',
        description: 'Pedido #114 — Patrícia Gomes — R$ 233,80',
        entityType: 'order',
        createdAt: daysFromNow(0, 12),
      },
      {
        businessId: business.id,
        type: 'appointment.created',
        title: 'Agendamento realizado',
        description: 'Fernanda Costa — Corte feminino — hoje às 14:30',
        entityType: 'appointment',
        createdAt: daysFromNow(0, 9),
      },
      {
        businessId: business.id,
        type: 'quote.approved',
        title: 'Orçamento aprovado',
        description: 'Gustavo Rocha aprovou o Day spa capilar — R$ 439,90',
        entityType: 'quote',
        createdAt: daysFromNow(-1, 16),
      },
      {
        businessId: business.id,
        type: 'customer.created',
        title: 'Novo cliente cadastrado',
        description: 'Aline Ferreira veio pelo Instagram',
        entityType: 'customer',
        createdAt: daysFromNow(-1, 11),
      },
      {
        businessId: business.id,
        type: 'quote.sent',
        title: 'Orçamento enviado',
        description: 'Evento corporativo — Lima Eventos — R$ 2.115,00',
        entityType: 'quote',
        createdAt: daysFromNow(-3, 14),
      },
      {
        businessId: business.id,
        type: 'deal.moved',
        title: 'Negociação avançou',
        description: 'Pacote formatura turma direito → Proposta',
        entityType: 'deal',
        createdAt: daysFromNow(-3, 10),
      },
      {
        businessId: business.id,
        type: 'order.created',
        title: 'Novo pedido recebido',
        description: 'Pedido #111 — Eduardo Lima — R$ 391,70',
        entityType: 'order',
        createdAt: daysFromNow(-1, 18),
      },
      {
        businessId: business.id,
        type: 'ai.generated',
        title: 'Conteúdo gerado com IA',
        description: 'Post para Instagram — Cronograma capilar',
        entityType: 'ai',
        createdAt: daysFromNow(-5, 15),
      },
    ],
  });

  // Recalcula o valor total de cada cliente a partir dos dados reais
  await refreshCustomerTotals(business.id);

  console.log(`  Studio Aurora: ${customers.length} clientes, ${quoteBlueprints.length} orçamentos, ${appointmentPlan.length} agendamentos, ${products.length} produtos, ${orderPlan.length} pedidos, ${dealPlan.length} negociações`);
}

// ------------------------------------------------------------------ segunda empresa (isolamento)

async function seedCantina() {
  const freePlan = await db.plan.findUniqueOrThrow({ where: { code: 'free' } });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 11);

  const business = await db.business.create({
    data: {
      name: 'Cantina Bella',
      slug: 'cantina-bella',
      segment: 'restaurante',
      whatsapp: '11991234567',
      instagram: '@cantinabella',
      address: 'Av. Brigadeiro, 1200 - Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      catalogHeadline: 'Massas artesanais feitas todos os dias',
      deliveryFee: 9.9,
      minOrder: 35,
      onboardedAt: daysFromNow(-20, 9),
      primaryGoals: JSON.stringify(['vendas', 'clientes']),
      subscription: {
        create: { planId: freePlan.id, status: 'active', currentPeriodEnd: daysFromNow(10, 9) },
      },
      messageTemplates: { create: defaultTemplates() },
      integrations: { create: [{ provider: 'whatsapp', status: 'connected', connectedAt: daysFromNow(-20) }] },
    },
  });

  await db.user.create({
    data: {
      name: 'Maria Bianchi',
      email: 'maria@nexo.app',
      passwordHash,
      businessId: business.id,
      role: 'owner',
      emailVerified: true,
    },
  });

  const category = await db.category.create({ data: { businessId: business.id, name: 'Massas', order: 0 } });
  const bebidas = await db.category.create({ data: { businessId: business.id, name: 'Bebidas', order: 1 } });

  const menu = [
    { name: 'Nhoque ao sugo', description: 'Massa fresca de batata com molho de tomate italiano.', price: 46.9, categoryId: category.id },
    { name: 'Ravioli de brie com pera', description: 'Recheio artesanal e manteiga de sálvia.', price: 58.9, categoryId: category.id },
    { name: 'Lasanha bolonhesa', description: 'Oito camadas, molho cozido por 6 horas.', price: 52.9, categoryId: category.id },
    { name: 'Vinho da casa (taça)', description: 'Tinto seco selecionado pela casa.', price: 24.9, categoryId: bebidas.id },
  ];

  for (let i = 0; i < menu.length; i++) {
    await db.product.create({
      data: {
        businessId: business.id,
        ...menu[i],
        featured: i === 0,
        order: i,
        addons:
          i < 3
            ? JSON.stringify([
                { name: 'Queijo extra', price: 6.9 },
                { name: 'Pão de alho (2 un)', price: 9.9 },
              ])
            : JSON.stringify([]),
      },
    });
  }

  const customer = await db.customer.create({
    data: { businessId: business.id, name: 'Carlos Ribeiro', phone: '11994445555', status: 'ativo', source: 'whatsapp' },
  });

  await db.order.create({
    data: {
      businessId: business.id,
      customerId: customer.id,
      number: 1,
      status: 'novo',
      customerName: customer.name,
      customerPhone: customer.phone ?? '',
      deliveryType: 'entrega',
      address: 'Rua Domingos de Morais, 90 - São Paulo/SP',
      paymentMethod: 'pix',
      subtotal: 105.8,
      deliveryFee: 9.9,
      total: 115.7,
      items: {
        create: [
          { name: 'Nhoque ao sugo', quantity: 1, unitPrice: 46.9, total: 46.9, addons: JSON.stringify([]) },
          { name: 'Ravioli de brie com pera', quantity: 1, unitPrice: 58.9, total: 58.9, addons: JSON.stringify([]) },
        ],
      },
    },
  });

  console.log('  Cantina Bella: empresa secundária criada (prova de isolamento)');
}

// ------------------------------------------------------------------ totais por cliente

async function refreshCustomerTotals(businessId: string) {
  const customers = await db.customer.findMany({ where: { businessId }, select: { id: true } });

  for (const customer of customers) {
    const [quotes, orders] = await Promise.all([
      db.quote.aggregate({
        where: { businessId, customerId: customer.id, status: 'aprovado' },
        _sum: { total: true },
      }),
      db.order.aggregate({
        where: { businessId, customerId: customer.id, status: { notIn: ['cancelado'] } },
        _sum: { total: true },
      }),
    ]);

    await db.customer.update({
      where: { id: customer.id },
      data: { totalValue: round2((quotes._sum.total ?? 0) + (orders._sum.total ?? 0)) },
    });
  }
}

// ------------------------------------------------------------------ main

async function main() {
  console.log('NEXO — semeando o banco...');

  // Limpa apenas os dados de demonstração (mantém idempotente)
  await db.business.deleteMany({ where: { slug: { in: ['studio-aurora', 'cantina-bella'] } } });
  await db.user.deleteMany({ where: { email: { in: ['joao@nexo.app', 'maria@nexo.app'] } } });

  await seedPlans();
  await seedAurora();
  await seedCantina();

  console.log('\nPronto. Acesse com:');
  console.log('  joao@nexo.app  / nexo1234  (Studio Aurora — plano Profissional)');
  console.log('  maria@nexo.app / nexo1234  (Cantina Bella — plano Grátis)');
  console.log('\nPáginas públicas:');
  console.log('  /agendar/studio-aurora    /catalogo/studio-aurora');
  console.log('  /catalogo/cantina-bella');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
