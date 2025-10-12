import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { systemPrompt, userPrompt, Inputs } from '../../../lib/prompts';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Inputs;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // ⚙️ Caso não exista chave (modo local)
  if (!apiKey) {
    const n = Math.max(4, Math.min(7, parseInt(body.t9 || '5') || 5));
    const fake = {
      headline: body.t0 || `Quiz ${body.t1 || 'IA'}`,
      subheadline: body.t3
        ? `Focado em ${body.t3}. Responda e receba sua recomendação.`
        : 'Responda e veja seu diagnóstico em 1 minuto.',
      perguntas: Array.from({ length: n }).map((_, k) => ({
        texto: `Pergunta ${k + 1} sobre ${body.t1 || 'seu nicho'}`,
        opcoes: ['Opção A', 'Opção B', 'Opção C'],
      })),
      resultadoTitulo: 'Sua recomendação personalizada',
      resultadoTexto: body.t3?.toLowerCase().includes('vender')
        ? 'Você pode estar perdendo conversões por gargalos simples. Ajuste oferta, prova e CTA.'
        : 'Aqui está o melhor próximo passo com base no seu perfil.',
      cta: body.t10 || 'Quero avançar agora',
      paleta: body.t5 || 'ciano #00FFFF, fundo #0A0F1A',
    };
    return Response.json({ ok: true, provider: 'local', data: fake });
  }

  // 🤖 Modo IA real
  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt(body) },
        { role: 'user', content: userPrompt(body) },
      ],
    });

    // 🧹 Limpeza da resposta
    let text = completion.choices?.[0]?.message?.content?.trim() || '{}';
    text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error('⚠️ Falha ao converter JSON:', text);
      throw new Error('A resposta da IA não veio em JSON válido.');
    }

    return Response.json({ ok: true, provider: 'openai', data: parsed });
  } catch (e: any) {
    console.error('Erro GPT:', e);
    return Response.json(
      { ok: false, error: e?.message || 'Falha na IA' },
      { status: 500 }
    );
  }
}
