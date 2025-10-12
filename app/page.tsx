'use client';
import { useState, useRef } from 'react';
import JSZip from 'jszip';
type Inputs = {
  t0: string; t1: string; t2: string; t3: string; t4: string; t5: string;
  t6: string; t7: string; t8: string; t9: string; t10: string; t11: string;
};
const steps = ['Identidade','Público','Objetivo','Visual','Perguntas','CTA & Link','Prévia'];
export default function Home(){
  const [active,setActive]=useState(0);
  const [loading,setLoading]=useState(false);
  const [g,setG]=useState<Inputs>({t0:'',t1:'',t2:'',t3:'',t4:'',t5:'',t6:'',t7:'',t8:'',t9:'5',t10:'',t11:''});
  const [previewHtml,setPreviewHtml]=useState(''); const iframeRef=useRef<HTMLIFrameElement>(null);
  function next(){ setActive(x=>Math.min(x+1, steps.length-1)); } function back(){ setActive(x=>Math.max(x-1,0)); }
  function parseBrand(paleta:string){ const m=paleta.match(/#([0-9a-fA-F]{6})/); return m?`#${m[1]}`:'#00FFFF'; }
  function buildQuizFiles(ai:any, link:string){
    const brand=parseBrand(ai.paleta||g.t5||''); const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${ai.headline}</title><link rel="stylesheet" href="./style.css"/></head>
<body>
  <main class="wrap">
    <header class="hd"><img src="logo.png" class="logo"/><h1>${ai.headline}</h1><p class="sub">${ai.subheadline}</p></header>
    <section id="quiz" class="card">
      ${ai.perguntas.map((q:any)=>`<div class="q"><h2>${q.texto}</h2><div class="ops">${q.opcoes.map((o:string)=>`<button class="op">${o}</button>`).join('')}</div></div>`).join('')}
      <button id="cta" class="cta">${ai.cta}</button>
    </section>
    <section id="result" class="card hidden">
      <h2>${ai.resultadoTitulo}</h2><p>${ai.resultadoTexto}</p>
      <a class="cta" href="${link||'#'}" target="_blank" rel="noreferrer">Ir para o próximo passo</a>
    </section>
  </main><script src="./script.js"></script></body></html>`;
    const css=`:root{ --brand: ${brand}; }*{ box-sizing:border-box; } body{ margin:0; font-family: Inter, system-ui, Arial; background:#0A0F1A; color:#E8F6FF; }
.wrap{ max-width:860px; margin:40px auto; padding:0 16px; } .logo{ width:64px; opacity:.9; } .hd h1{ font-family: Orbitron, Inter; font-weight:700; margin:10px 0 6px; }
.sub{ opacity:.85; margin-top:2px; } .card{ margin:22px 0; padding:18px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:16px; }
.q{ margin:16px 0; } .ops{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
.op{ padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.12); background:#101828; color:#fff; cursor:pointer; } .op:hover{ border-color: var(--brand); }
.cta{ margin-top:14px; padding:13px 16px; background: var(--brand); color:#001018; border:none; border-radius:12px; font-weight:700; cursor:pointer; display:inline-block; text-decoration:none; }
.hidden{ display:none; }`;
    const js=`(function(){ const cta=document.getElementById('cta'); const quiz=document.getElementById('quiz'); const result=document.getElementById('result'); if(!cta||!quiz||!result) return; cta.addEventListener('click',()=>{ quiz.classList.add('hidden'); result.classList.remove('hidden'); });})();`;
    return {html,css,js};
  }
  function renderFull(html:string,css:string,js:string){ return html.replace('<link rel="stylesheet" href="./style.css"/>', `<style>${css}</style>`).replace('<script src="./script.js"></script>', `<script>${js}</script>`); }
  async function gerar(){ setLoading(true);
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});
    const j=await res.json(); if(!j.ok){ alert(j.error||'Falha ao gerar'); setLoading(false); return; }
    const data=j.data; const {html,css,js}=buildQuizFiles(data,g.t4); const full=renderFull(html,css,js);
    setPreviewHtml(full); setTimeout(()=>{ const iframe=iframeRef.current; if(iframe) iframe.srcdoc=full; },0); setActive(steps.length-1); setLoading(false); }
  async function downloadZip(){
    if(!previewHtml) return alert('Gere o preview primeiro.');
    const cssMatch=previewHtml.match(/<style>([\s\S]*?)<\/style>/); const jsMatch=previewHtml.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
    const css=cssMatch?cssMatch[1]:'', js=jsMatch?jsMatch[1]:''; let html=previewHtml.replace(/<style>[\s\S]*?<\/style>/,'<link rel="stylesheet" href="./style.css"/>').replace(/<script>[\s\S]*?<\/script>\s*<\/body>/,'<script src="./script.js"></script></body>');
    const zip=new JSZip(); zip.file('index.html', html); zip.file('style.css', css); zip.file('script.js', js);
    zip.file('logo.png','<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#00FFFF"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Orbitron,Arial" font-size="28" fill="#001B33">Quiz IA</text></svg>');
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Quiz-${(g.t0||'Quiz-IA')}.zip`; a.click(); URL.revokeObjectURL(url);
  }
  return (<div className="container">
    <div className="hero"><h1 className="title">Quiz IA Builder</h1><p className="subtitle">Preencha o gabarito e gere seu quiz com IA (preview local). Sem mensalidades.</p></div>
    <div className="wizard">
      <aside className="sidebar">{steps.map((s,i)=>(<div key={i} className={`step ${i===active?'active':''}`}>{i+1}. {s}</div>))}</aside>
      <main>
        {active===0&&(<div className="card"><label>Título [0]</label><input className="input" value={g.t0} onChange={e=>setG({...g,t0:e.target.value})} placeholder="Quiz IA, Pintando a Palavra..."/>
          <label style={{marginTop:10,display:'block'}}>Nicho [1]</label><input className="input" value={g.t1} onChange={e=>setG({...g,t1:e.target.value})} placeholder="Gestor de Tráfego, Estética Facial..."/></div>)}
        {active===1&&(<div className="card"><label>Público-alvo [2]</label><input className="input" value={g.t2} onChange={e=>setG({...g,t2:e.target.value})} placeholder="Ex: mães cristãs, empreendedores..."/>
          <label style={{marginTop:10,display:'block'}}>Observações [11]</label><textarea className="textarea" rows={3} value={g.t11} onChange={e=>setG({...g,t11:e.target.value})} placeholder="Referências, persona, elementos obrigatórios..."></textarea></div>)}
        {active===2&&(<div className="card"><label>Objetivo do Quiz [3]</label><input className="input" value={g.t3} onChange={e=>setG({...g,t3:e.target.value})} placeholder="Ex: captar leads, vender produto, WhatsApp..."/>
          <label style={{marginTop:10,display:'block'}}>Número de perguntas [9]</label><input className="input" value={g.t9} onChange={e=>setG({...g,t9:e.target.value})} placeholder="4 a 7"/></div>)}
        {active===3&&(<div className="card"><label>Paleta de cores [5]</label><input className="input" value={g.t5} onChange={e=>setG({...g,t5:e.target.value})} placeholder="Ex: ciano #00FFFF, fundo #0A0F1A"/>
          <label style={{marginTop:10,display:'block'}}>Estilo visual [7]</label><input className="input" value={g.t7} onChange={e=>setG({...g,t7:e.target.value})} placeholder="Futurista, elegante, minimalista..."/></div>)}
        {active===4&&(<div className="card"><label>Tom de linguagem [8]</label><input className="input" value={g.t8} onChange={e=>setG({...g,t8:e.target.value})} placeholder="Autoridade, acolhedor, técnico..."/></div>)}
        {active===5&&(<div className="card"><label>CTA final [10]</label><input className="input" value={g.t10} onChange={e=>setG({...g,t10:e.target.value})} placeholder="Ex: Quero começar agora"/>
          <label style={{marginTop:10,display:'block'}}>Link final [4]</label><input className="input" value={g.t4} onChange={e=>setG({...g,t4:e.target.value})} placeholder="https://seusite.com/checkout ou WhatsApp"/></div>)}
        {active===6&&(<div className="card"><div className="actions" style={{marginBottom:10}}>
            <button className="btn primary" onClick={gerar} disabled={loading}>{loading?'Gerando com IA…':'Gerar quiz com IA'}</button>
            <button className="btn" onClick={downloadZip}>Baixar ZIP</button>
          </div><div className="previewWrap"><iframe ref={iframeRef} className="preview" title="Prévia do Quiz"></iframe>
            <div className="small" style={{marginTop:6}}>Prévia local — nada é salvo. O download exporta os arquivos finais.</div></div></div>)}
        <div className="actions"><button className="btn" onClick={back} disabled={active===0}>Voltar</button><button className="btn" onClick={next} disabled={active===steps.length-1}>Próximo</button></div>
        <p className="footer-note">Dica: se não definir a OPENAI_API_KEY, o app usa o modo gratuito (gerador local simulado).</p>
      </main>
    </div>
  </div>);
}
