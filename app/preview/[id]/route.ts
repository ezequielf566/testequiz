import { kv } from '@vercel/kv';

export const runtime = 'nodejs';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = await kv.get<{index:string, css:string, js:string}>(`quiz:${params.id}`);
  if (!data) {
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Visualização expirada</title><style>body{margin:0;background:#0A0F1A;color:#E8F6FF;font-family:Inter,system-ui,Arial;display:grid;place-items:center;min-height:100vh}.card{max-width:720px;margin:0 auto;padding:24px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);text-align:center}.btn{display:inline-block;margin-top:14px;padding:12px 16px;border-radius:12px;background:#00FFFF;color:#00141f;text-decoration:none;font-weight:700}</style></head><body><div class="card"><h1 style="font-family:Orbitron,Inter">Este link de visualização expirou.</h1><p>O período de demonstração terminou. Gere um novo quiz ou libere o download completo no painel.</p><a class="btn" href="/">Gerar um novo quiz</a></div></body></html>`;
    return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html' } });
  }
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Preview do Quiz</title><style>${data.css}</style></head><body>${data.index}<script>${data.js}</script></body></html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}
