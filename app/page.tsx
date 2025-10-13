'use client';
import { useRef, useState } from 'react';
import JSZip from 'jszip';

type Inputs = {
  t0: string; t1: string; t2: string; t3: string; t4: string; t5: string;
  t6: string; t7: string; t8: string; t9: string; t10: string; t11: string;
  packages: Array<{ name: string; description: string; price?: string; benefits?: string[] }>;
};

const steps = ['Identidade', 'Público & Objetivo', 'Visual', 'Perguntas', 'Pacotes', 'CTA & Link', 'Prévia'];

export default function Home() {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [g, setG] = useState<Inputs>({
    t0: '', t1: '', t2: '', t3: '', t4: '', t5: '', t6: '', t7: '', t8: '', t9: '5', t10: '', t11: '', packages: []
  });
  const [logoData, setLogoData] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function next() { setActive(x => Math.min(x + 1, steps.length - 1)); }
  function back() { setActive(x => Math.max(x - 1, 0)); }

  async function suggest(field: keyof Inputs) {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, context: g })
    });
    const j = await res.json();
    if (!j.ok) { alert('Falha na sugestão'); return; }
    setG(prev => ({ ...prev, [field]: j.suggestion } as Inputs));
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoData(reader.result as string);
    reader.readAsDataURL(file);
  }

  function parseBrand(paleta: string) {
    const m = paleta.match(/#([0-9a-fA-F]{6})/);
    return m ? `#${m[1]}` : '#00FFFF';
  }

  function buildQuiz(ai: any, link: string) {
    const brand = parseBrand(ai.paleta || g.t5 || '');
    const fontTitle = (ai.estilo || g.t7 || '').toLowerCase().includes('futur')
      ? '"Orbitron", sans-serif' : 'Inter, system-ui, Arial';

    const css = `
    :root{--brand:${brand};--bg:#0A0F1A;--text:#E8F6FF;}
    *{box-sizing:border-box;}
    body{margin:0;font-family:Inter,Arial;background:var(--bg);color:var(--text);text-align:center;display:flex;flex-direction:column;align-items:center;}
    .wrap{max-width:860px;width:100%;margin:30px auto;padding:0 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
    .logo{width:96px;opacity:.95;margin:0 auto 12px;display:block;}
    .hd h1{font-family:${fontTitle};font-weight:700;margin:10px 0 6px;}
    .sub{opacity:.85;margin-top:2px;font-size:1.1rem;}
    .card{margin:22px 0;padding:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;text-align:center;width:100%;max-width:600px;}
    .btn{margin-top:18px;padding:14px 22px;background:var(--brand);color:#001018;border:none;border-radius:12px;font-weight:700;cursor:pointer;display:inline-block;text-decoration:none;font-size:1rem;}
    .ops{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:20px;justify-content:center;align-items:center;width:100%;}
    .op{padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#101828;color:#fff;cursor:pointer;text-align:center;font-size:16px;}
    .op:hover{border-color:var(--brand);}
    .hidden{display:none;}
    .progress{height:6px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin:8px 0 14px;width:100%;max-width:600px;}
    .bar{height:100%;width:0%;background:var(--brand);transition:width .25s ease;}
    @media (max-width:768px){
      .card{padding:14px;margin:14px 0;}
      .ops{grid-template-columns:1fr;}
      .btn{width:100%;font-size:16px;}
      .hd h1{font-size:22px;}
      .sub{font-size:15px;}
    }`;

    const pkgHtml = g.packages?.length
      ? `<div class="card"><h3>Planos & Pacotes</h3><ul style="list-style:none;padding:0;">${g.packages.map(p =>
        `<li><strong>${p.name}</strong> — ${p.description}${p.price ? ` • <em>${p.price}</em>` : ''}</li>`
      ).join('')}</ul></div>` : '';

    const html = `
    <!doctype html><html lang="pt-BR"><head>
    <meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>${ai.headline}</title><link rel="stylesheet" href="./style.css"/>
    </head><body>
    <main class="wrap">
      <header class="card hd">
        ${logoData ? `<img src="logo.png" class="logo"/>` : ''}
        <h1>${ai.headline}</h1>
        <p class="sub">${ai.subheadline}</p>
        <button id="startBtn" class="btn">Começar</button>
        <div class="progress"><div class="bar" id="bar"></div></div>
      </header>
      <section id="stage" class="card hidden"></section>
      <section id="result" class="card hidden">
        <h2>${ai.resultadoTitulo}</h2>
        <p>${ai.resultadoTexto}</p>
        ${pkgHtml}
        <a class="btn" href="${link || '#'}" target="_blank" rel="noreferrer">${ai.cta}</a>
      </section>
    </main><script src="./script.js"></script></body></html>`;

    const js = `(function(){
      const data=${JSON.stringify(ai)};
      const stage=document.getElementById('stage');
      const result=document.getElementById('result');
      const bar=document.getElementById('bar');
      const startBtn=document.getElementById('startBtn');
      let i=0;

      function renderQuestion(k){
        const q=data.perguntas[k];
        if(!q){ showResult(); return; }
        const ops=q.opcoes.map(o =>
          '<button class="op" data-v="'+o.replace(/"/g,'&quot;')+'">'+o+'</button>'
        ).join('');
        stage.innerHTML='<h2>'+q.texto+'</h2><div class="ops">'+ops+'</div>';
        bar.style.width=(k/data.perguntas.length)*100+'%';
        stage.querySelectorAll('.op').forEach(btn=>{
          btn.addEventListener('click',()=>{
            i++;
            renderQuestion(i);
          });
        });
      }

      function showResult(){
        stage.classList.add('hidden');
        result.classList.remove('hidden');
        bar.style.width='100%';
      }

      startBtn.addEventListener('click',()=>{
        document.querySelector('.hd').classList.add('hidden');
        stage.classList.remove('hidden');
        renderQuestion(0);
      });
    })();`;

    return { html, css, js };
  }

  async function gerar() {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g)
    });
    const j = await res.json();
    if (!j.ok) { alert(j.error || 'Falha ao gerar'); setLoading(false); return; }

    const data = j.data;
    const { html, css, js } = buildQuiz(data, g.t4);
    const full = html
      .replace('<link rel="stylesheet" href="./style.css"/>', `<style>${css}</style>`)
      .replace('<script src="./script.js"></script>', `<script>${js}</script>`);
    setPreviewHtml(full);
    setTimeout(() => { const iframe = iframeRef.current; if (iframe) iframe.srcdoc = full; }, 0);
    setActive(steps.length - 1);
    setLoading(false);
  }

  async function downloadZip() {
    if (!previewHtml) return alert('Gere o preview primeiro.');
    const css = (previewHtml.match(/<style>([\\s\\S]*?)<\\/style>/) || [])[1] || '';
    const js = (previewHtml.match(/<script>([\\s\\S]*?)<\\/script>\\s*<\\/body>/) || [])[1] || '';
    let html = previewHtml.replace(/<style>[\\s\\S]*?<\\/style>/, '<link rel="stylesheet" href="./style.css"/>')
      .replace(/<script>[\\s\\S]*?<\\/script>\\s*<\\/body>/, '<script src="./script.js"><\\/script></body>');
    const zip = new JSZip();
    zip.file('index.html', html); zip.file('style.css', css); zip.file('script.js', js);
    if (logoData) {
      const base64 = logoData.split(',')[1] || '';
      zip.file('logo.png', base64, { base64: true });
    }
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = \`Quiz-\${(g.t0 || 'Quiz-IA')}.zip\`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="hero">
        <h1 className="title">Quiz IA Builder PRO <span className="badge">Futurista</span></h1>
        <p className="subtitle">Monte, visualize e exporte seu quiz com IA</p>
      </div>

      <main>
        {active === steps.length - 1 && (
          <div className="card">
            <div className="actions" style={{ marginBottom: 10 }}>
              <button className="btn primary" onClick={gerar} disabled={loading}>
                {loading ? 'Gerando com IA…' : 'Gerar Quiz com IA'}
              </button>
              <button className="btn" onClick={downloadZip}>Baixar ZIP</button>
            </div>
            <iframe ref={iframeRef} className="preview" title="Prévia do Quiz"></iframe>
            <p className="footer-note">Prévia local completa. Baixe o projeto final em ZIP.</p>
          </div>
        )}
        <div className="actions">
          <button className="btn" onClick={back} disabled={active === 0}>Voltar</button>
          <button className="btn" onClick={next} disabled={active === steps.length - 1}>Próximo</button>
        </div>
      </main>
    </div>
  );
          }
