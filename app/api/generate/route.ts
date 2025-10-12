import { NextRequest } from 'next/server';
import { Inputs, systemPrompt, userPrompt } from '@/lib/prompts';
import { renderTemplates } from '@/lib/template';
import { buildZip } from '@/lib/zip';
import OpenAI from 'openai';
import { kv } from '@vercel/kv';

export const runtime = 'nodejs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function hexFromPaleta(paleta?: string): string {
  if (!paleta) return '#00FFFF';
  const m = paleta.match(/#([0-9a-fA-F]{6})/);
  return m ? '#'+m[1] : '#00FFFF';
}

async function runAI(i: Inputs) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt(i) },
        { role: 'user', content: userPrompt(i) }
      ]
    });
    const text = completion.choices?.[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      tema: { cor: hexFromPaleta(i.paleta) },
      marca: 'Quiz IA',
      link: i.link || '#'
    };
  } catch (e) {
    // Fallback simples
    const perguntas = [
      { texto: `Qual sua maior dor em ${i.nicho||'seu nicho'}?`, opcoes: ['Baixa conversão','Leads frios','Custo alto'] },
      { texto: 'Qual seu objetivo principal?', opcoes: ['Gerar leads','Vender','Validar oferta'] },
      { texto: 'Qual seu nível atual?', opcoes: ['Iniciante','Intermediário','Avançado'] },
      { texto: 'Em quanto tempo quer resultado?', opcoes: ['7 dias','15 dias','30 dias'] }
    ];
    return {
      headline: i.titulo || `Quiz ${i.nicho||'IA'}`,
      subheadline: i.objetivo ? `Focado em ${i.objetivo}. Responda e veja seu diagnóstico.` : 'Responda e veja seu resultado em 1 minuto.',
      perguntas,
      resultadoTitulo: 'Sua recomendação personalizada',
      resultadoTexto: i.objetivo?.toLowerCase().includes('vender')
        ? 'Você está perdendo conversões por gargalos simples. Ajuste os pontos-chave e avance.'
        : 'Aqui está o melhor próximo passo com base no seu perfil.',
      cta: i.cta || 'Ver meu resultado',
      tema: { cor: hexFromPaleta(i.paleta) },
      marca: 'Quiz IA',
      link: i.link || '#'
    };
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const download = url.searchParams.get('download') === '1';
  const body = await req.json() as any;
  const i: Inputs = {
    titulo: body.titulo||'',
    nicho: body.nicho||'',
    publico: body.publico||'',
    objetivo: body.objetivo||'',
    link: body.link||'',
    paleta: body.paleta||'',
    logo: body.logo||'',
    estilo: body.estilo||'',
    tom: body.tom||'',
    num: body.num||'',
    cta: body.cta||'Ver meu resultado',
    obs: body.obs||''
  };

  const ai = await runAI(i);
  const { index, css, js } = renderTemplates(ai);

  if (download) {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logo = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : undefined;
    const zip = await buildZip({ 'index.html': index, 'style.css': css, 'script.js': js }, logo?{'logo.png':logo}:{}) ;
    return new Response(zip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="quiz-ia.zip"'
      }
    });
  }

  // Save preview with 7-day TTL in Vercel KV
  const id = `q-${Math.random().toString(36).slice(2,10)}`;
  await kv.set(`quiz:${id}`, { index, css, js }, { ex: 60*60*24*7 });
  const previewUrl = `/preview/${id}`;
  return Response.json({ previewUrl });
}

export async function GET() {
  return new Response('OK');
}
