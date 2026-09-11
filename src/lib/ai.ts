import 'server-only';

import type { AIType } from '@/lib/constants';

export type AIBrief = {
  type: AIType;
  businessName: string;
  segment: string;
  product: string;
  objective: string;
  audience: string;
  extra?: string;
  tone?: string;
};

const LABELS: Record<AIType, string> = {
  post: 'um post para Instagram',
  legenda: 'uma legenda curta para Instagram',
  story: 'uma sequência de 3 stories',
  anuncio: 'um anúncio pago',
  oferta: 'uma oferta promocional',
  descricao: 'uma descrição de produto para catálogo',
  reels: 'um roteiro de Reels',
  calendario: 'um calendário de conteúdo de 7 dias',
};

const FORMAT_RULES: Record<AIType, string> = {
  post: 'Entregue: gancho na primeira linha, 3 a 5 linhas de corpo, uma chamada para ação e 8 hashtags relevantes.',
  legenda: 'Entregue no máximo 3 linhas, com 1 emoji no máximo e 5 hashtags.',
  story:
    'Entregue 3 blocos numerados (STORY 1, STORY 2, STORY 3). Cada bloco com o texto que aparece na tela (curto) e a sugestão de elemento interativo.',
  anuncio:
    'Entregue: 3 variações de título (até 40 caracteres), 1 texto principal de até 4 linhas e 1 chamada para ação.',
  oferta:
    'Entregue: nome da oferta, o que está incluído, o gatilho de urgência e o texto pronto para enviar no WhatsApp.',
  descricao:
    'Entregue: uma frase de impacto, 3 bullets de benefício e uma linha final com chamada para ação. Sem hashtags.',
  reels:
    'Entregue cena por cena (0-3s, 3-8s, 8-15s, 15-20s), com o que aparece na tela, a fala/legenda e a sugestão de áudio.',
  calendario:
    'Entregue 7 dias (Segunda a Domingo). Para cada dia: formato, tema e a primeira linha do texto. Formato compacto.',
};

function systemPrompt() {
  return [
    'Você é o Nexo IA, especialista em marketing para pequenos negócios brasileiros.',
    'Escreva sempre em português do Brasil, com linguagem simples, direta e vendedora.',
    'Nunca use jargão de agência. Nunca prometa resultados irreais. Não invente preços que não foram informados.',
    'Entregue apenas o conteúdo final, pronto para copiar e colar — sem introduções como "aqui está".',
  ].join(' ');
}

function userPrompt(brief: AIBrief) {
  return [
    `Crie ${LABELS[brief.type]}.`,
    '',
    `Negócio: ${brief.businessName}`,
    `Segmento: ${brief.segment}`,
    `Produto/serviço em destaque: ${brief.product}`,
    `Objetivo: ${brief.objective}`,
    `Público: ${brief.audience}`,
    brief.tone ? `Tom de voz: ${brief.tone}` : '',
    brief.extra ? `Informações extras: ${brief.extra}` : '',
    '',
    FORMAT_RULES[brief.type],
  ]
    .filter(Boolean)
    .join('\n');
}

export type AIResult = { output: string; tokensUsed: number; provider: 'anthropic' | 'local' };

export async function generateContent(brief: AIBrief): Promise<AIResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { output: localGenerate(brief), tokensUsed: 0, provider: 'local' };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 1400,
        system: systemPrompt(),
        messages: [{ role: 'user', content: userPrompt(brief) }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic respondeu ${res.status}`);

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text = (data.content ?? [])
      .filter((b) => b.type === 'text' && b.text)
      .map((b) => b.text as string)
      .join('\n')
      .trim();

    if (!text) throw new Error('Resposta vazia');

    return {
      output: text,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      provider: 'anthropic',
    };
  } catch (error) {
    console.error('[nexo-ia] falha na API, usando gerador local:', error);
    return { output: localGenerate(brief), tokensUsed: 0, provider: 'local' };
  }
}

// ------------------------------------------------------------------------
// Gerador local: mantém o módulo 100% funcional sem chave de API.
// ------------------------------------------------------------------------

function pick<T>(list: T[], seed: number) {
  return list[seed % list.length];
}

function hashtagsFor(brief: AIBrief) {
  const base = [brief.segment, brief.product, brief.audience]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 5)
    .map((w) => `#${w}`);
  return [...new Set([...base, '#pequenosnegocios', '#empreendedorismo', '#atendimento'])].slice(0, 8).join(' ');
}

const HOOKS = [
  'Você não precisa de mais tempo. Precisa de menos improviso.',
  'Sabe o que separa quem vende de quem só espera?',
  'Isso muda o jeito que você vê',
  'Ninguém te contou isso sobre',
  'A pergunta que mais recebemos aqui:',
];

const CTAS = [
  'Chama no direct que a gente resolve por lá.',
  'Manda um "quero" no WhatsApp e eu te explico.',
  'Comenta aqui embaixo que eu te mando os detalhes.',
  'Link na bio para garantir o seu.',
  'Salva esse post para não perder.',
];

export function localGenerate(brief: AIBrief): string {
  const seed = (brief.businessName + brief.product + brief.objective).length;
  const hook = pick(HOOKS, seed);
  const cta = pick(CTAS, seed + 2);
  const tags = hashtagsFor(brief);
  const { businessName: nome, product: produto, audience: publico, segment: segmento } = brief;

  switch (brief.type) {
    case 'post':
      return [
        `${hook} ${produto}.`,
        '',
        `Na ${nome}, a gente sabe que ${publico} não quer complicação — quer resolver.`,
        `É por isso que ${produto} foi pensado do jeito mais simples possível: você chega, a gente cuida do resto.`,
        'Sem enrolação, sem surpresa no final e com atendimento de verdade.',
        '',
        cta,
        '',
        tags,
      ].join('\n');

    case 'legenda':
      return [
        `${produto} do jeito que ${publico} merece. ✨`,
        `${nome} — simples assim.`,
        cta,
        '',
        tags.split(' ').slice(0, 5).join(' '),
      ].join('\n');

    case 'story':
      return [
        'STORY 1',
        `Tela: "${hook}"`,
        'Elemento: enquete "Você já passou por isso?" (Sim / Todo dia)',
        '',
        'STORY 2',
        `Tela: "${produto} na ${nome} resolve isso em minutos."`,
        'Elemento: caixinha de perguntas "O que você quer saber?"',
        '',
        'STORY 3',
        `Tela: "${cta}"`,
        'Elemento: sticker de link para o WhatsApp',
      ].join('\n');

    case 'anuncio':
      return [
        'TÍTULOS',
        `1. ${produto} sem complicação`,
        `2. ${nome}: resolvido hoje`,
        `3. Feito para ${publico}`,
        '',
        'TEXTO PRINCIPAL',
        `${publico} não tem tempo para perder. Na ${nome}, ${produto} é rápido, previsível e com atendimento humano do começo ao fim.`,
        'Você fala com quem entende, recebe tudo por escrito e sabe exatamente o que vai pagar.',
        '',
        'CHAMADA PARA AÇÃO',
        'Falar no WhatsApp agora',
      ].join('\n');

    case 'oferta':
      return [
        `OFERTA: ${produto} com condição especial`,
        '',
        'O que está incluído:',
        `• ${produto} completo`,
        '• Atendimento prioritário no WhatsApp',
        '• Orçamento na hora, sem compromisso',
        '',
        'Urgência: condição válida somente esta semana e para os primeiros 10 pedidos.',
        '',
        'MENSAGEM PARA WHATSAPP',
        `Oi! Estamos com uma condição especial em ${produto} aqui na ${nome} até o fim da semana. Quer que eu te mande os detalhes?`,
      ].join('\n');

    case 'descricao':
      return [
        `${produto} — feito para ${publico} que não aceita menos.`,
        '',
        '• Qualidade conferida item por item antes de sair daqui',
        '• Atendimento direto no WhatsApp, sem robô e sem espera',
        `• Entrega e prazos combinados de forma clara pela ${nome}`,
        '',
        'Peça agora e receba a confirmação em poucos minutos.',
      ].join('\n');

    case 'reels':
      return [
        `ROTEIRO DE REELS — ${produto}`,
        '',
        '0-3s (GANCHO)',
        `Tela: "${hook}"`,
        'Fala: comece olhando para a câmera, sem introdução.',
        'Áudio: trend de batida marcada.',
        '',
        '3-8s (PROBLEMA)',
        `Tela: mostre o cenário real de ${segmento}.`,
        `Fala: "${publico} perde tempo justamente aqui."`,
        '',
        '8-15s (SOLUÇÃO)',
        `Tela: ${produto} em uso, em plano fechado.`,
        `Fala: "Na ${nome} isso funciona assim..." — mostre, não explique.`,
        '',
        '15-20s (CTA)',
        `Tela: "${cta}"`,
        'Fala: repita o benefício em uma frase e aponte para o link.',
      ].join('\n');

    case 'calendario':
      return [
        `CALENDÁRIO DE CONTEÚDO — ${nome} (7 dias)`,
        '',
        `SEGUNDA — Carrossel | Educativo: "3 erros de ${publico} ao escolher ${produto}"`,
        `TERÇA — Story | Bastidores: "Como preparamos ${produto} todos os dias"`,
        `QUARTA — Reels | Gancho: "${hook}"`,
        `QUINTA — Post | Prova social: depoimento de cliente sobre ${produto}`,
        `SEXTA — Story + Post | Oferta: condição especial de fim de semana`,
        `SÁBADO — Reels | Leve: rotina de ${segmento} em 15 segundos`,
        `DOMINGO — Post | Autoridade: "Por que a ${nome} faz diferente"`,
        '',
        `CTA padrão da semana: ${cta}`,
      ].join('\n');

    default:
      return `${produto} na ${nome}. ${cta}`;
  }
}
