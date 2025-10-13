import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { field, context } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // 🧠 Fallback local (sem IA real)
  if (!apiKey) {
    const defaults: Record<string, string> = {
      t1: 'Gestor de Tráfego Pago',
      t2: 'empreendedores iniciantes',
      t3: 'captar leads qualificados',
      t5: 'azul escuro e ciano sobre fundo preto',
      t7: 'futurista e moderno',
      t8: 'autoridade acolhedora'
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
    t8: "um tom de linguagem adequado ao público e nicho. Exemplo: 'inspirador e motivador', 'profissional e confiante', 'leve e acolhedor'."
  };

  const detail = fieldPrompts[field] || 'um valor breve e coerente com o contexto';

  // 🧠 Prompt refinado com contexto de título e nicho
  const prompt = `
Com base no título "${context?.t0 || 'Quiz IA'}" e no nicho "${context?.t1 || 'Geral'}",
sugira ${detail}
O público-alvo é: ${context?.t2 || 'não informado'}.
O objetivo do quiz é: ${context?.t3 || 'não informado'}.

Retorne apenas o texto cru, sem explicações, sem emojis.
`;

  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

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
