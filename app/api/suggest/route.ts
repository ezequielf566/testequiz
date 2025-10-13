import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { field, context } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // 🧠 Fallback local (sem IA real)
  if (!apiKey) {
    const defaults: Record<string, any> = {
      t1: 'Gestor de Tráfego Pago',
      t2: 'empreendedores iniciantes',
      t3: 'captar leads qualificados',
      t5: 'azul escuro e ciano sobre fundo preto',
      t7: 'futurista e moderno',
      t8: 'autoridade acolhedora',
      testimonialTitle: 'O que nossos clientes dizem',
      testimonials: [
        { text: 'O quiz me ajudou a entender o público do meu negócio.', author: 'Ana, empreendedora' },
        { text: 'Ferramenta simples e poderosa!', author: 'João, gestor de tráfego' },
        { text: 'Em poucos minutos montei um quiz profissional.', author: 'Maria, designer' }
      ]
    };
    return Response.json({ ok: true, provider: 'local', suggestion: defaults[field] || '' });
  }

  const openai = new OpenAI({ apiKey });

  // 🧩 Descrições personalizadas por campo
  const fieldPrompts: Record<string, string> = {
    t1: "um nome de nicho profissional ou setor, como 'Estética Facial', 'Educação Infantil' ou 'Tráfego Pago'.",
    t2: "um público-alvo compatível com o nicho e o título, como 'mães cristãs', 'empreendedores iniciantes' ou 'professores de ensino fundamental'.",
    t3: "um objetivo claro e direto para o quiz, como 'gerar leads qualificados', 'aumentar as vendas' ou 'direcionar para um serviço específico'.",
    t5: "uma paleta de cores visualmente atrativa que combine com o título e o nicho. Exemplo: 'azul royal e branco com detalhes dourados' ou 'tons pastéis com fundo claro'.",
    t7: "um estilo visual coerente com o nicho e o público. Exemplo: 'futurista e elegante', 'minimalista e limpo', 'divertido e colorido', 'natural e acolhedor'.",
    t8: "um tom de linguagem adequado ao público e nicho. Exemplo: 'inspirador e motivador', 'profissional e confiante', 'leve e acolhedor'.",
    testimonialTitle: "uma frase curta e cativante para introduzir depoimentos de clientes. Exemplo: 'O que nossos clientes dizem' ou 'Quem já testou aprovou!'.",
    testimonials: "três depoimentos realistas e específicos, ajustados ao nicho, público e objetivo, no formato JSON contendo 'text' e 'author'."
  };

  const detail = fieldPrompts[field] || 'um valor breve e coerente com o contexto';

  // 🧠 Prompt principal
  let prompt = `
Com base no título "${context?.t0 || 'Quiz IA'}" e no nicho "${context?.t1 || 'Geral'}",
sugira ${detail}
O público-alvo é: ${context?.t2 || 'não informado'}.
O objetivo do quiz é: ${context?.t3 || 'não informado'}.
`;

  // 🎯 Prompt especial para depoimentos — contexto realista
  if (field === 'testimonials') {
    prompt = `
Você é um copywriter especializado em marketing de conversão.

Crie **3 depoimentos autênticos e curtos** (1 a 2 frases cada) de pessoas reais
que se encaixam no público-alvo: "${context?.t2 || 'público genérico'}",
referindo-se ao nicho "${context?.t1 || 'Geral'}" e ao objetivo do quiz "${context?.t3 || 'ajudar o público'}".

Cada depoimento deve soar natural, mencionar o benefício percebido, e incluir nome e identificação leve.
O tom de linguagem deve ser coerente com "${context?.t8 || 'amigável e inspirador'}".

Retorne exatamente este JSON:
[
  { "text": "Depoimento 1...", "author": "Nome e identificação" },
  { "text": "Depoimento 2...", "author": "..." },
  { "text": "Depoimento 3...", "author": "..." }
]
Sem explicações, sem emojis, sem texto fora do JSON.
`;
  }

  // 🧩 Prompt para frase de efeito
  if (field === 'testimonialTitle') {
    prompt = `
Crie uma frase curta, emocional e coerente com o nicho "${context?.t1 || 'Geral'}"
para introduzir uma seção de depoimentos. 
Exemplo: "Quem já testou aprovou!" ou "O que nossos alunos dizem".
Retorne apenas o texto cru, sem emojis, sem aspas.
`;
  }

  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    // ⚙️ Tratamento especial para depoimentos JSON
    if (field === 'testimonials') {
      let text = r.choices?.[0]?.message?.content?.trim() || '[]';
      text = text.replace(/```json|```/g, '').trim();

      try {
        const arr = JSON.parse(text);
        return Response.json({ ok: true, provider: 'openai', suggestion: arr });
      } catch {
        // fallback caso não venha JSON puro
        const lines = text.split('\n').filter(l => l.trim());
        const arr = lines.slice(0, 3).map((l, i) => ({
          text: l.replace(/^\d+[\.\-)]\s*/, ''),
          author: `Cliente ${i + 1}`
        }));
        return Response.json({ ok: true, provider: 'openai', suggestion: arr });
      }
    }

    const suggestion = r.choices?.[0]?.message?.content?.trim() || '';
    return Response.json({ ok: true, provider: 'openai', suggestion });

  } catch (e: any) {
    console.error('Erro GPT Suggest:', e);
    return Response.json(
      { ok: false, error: e?.message || 'Falha na sugestão' },
      { status: 500 }
    );
  }
}
