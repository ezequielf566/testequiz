import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { field, context } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    const defaults: Record<string,string> = {
      t1: 'Gestor de Tráfego Pago',
      t2: 'empreendedores iniciantes',
      t3: 'captar leads qualificados',
      t5: 'ciano #00FFFF, fundo #0A0F1A',
      t7: 'futurista',
      t8: 'autoridade acolhedora'
    };
    return Response.json({ ok:true, provider:'local', suggestion: defaults[field] || '' });
  }

  const openai = new OpenAI({ apiKey });
  const prompt = `Com base neste contexto: ${JSON.stringify(context)} 
Sugira APENAS um valor sucinto para o campo "${field}" do formulário de criação de quiz. 
Retorne apenas o texto cru, sem explicações, sem emojis.`;

  try {
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [{ role:'user', content: prompt }]
    });
    const suggestion = r.choices?.[0]?.message?.content?.trim() || '';
    return Response.json({ ok:true, provider:'openai', suggestion });
  } catch(e:any){
    return Response.json({ ok:false, error: e?.message || 'Falha na sugestão' }, { status: 500 });
  }
}
