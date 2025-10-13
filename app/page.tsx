'use client';
import { useRef, useState } from 'react';
import JSZip from 'jszip';

type Inputs = {
  t0: string; t1: string; t2: string; t3: string; t4: string; t5: string;
  t6: string; t7: string; t8: string; t9: string; t10: string; t11: string;
  packages: Array<{ name:string; description:string; price?:string; benefits?:string[] }>;
};

const steps = ['Identidade', 'Público & Objetivo', 'Visual', 'Perguntas', 'Pacotes', 'CTA & Link', 'Prévia'];

export default function Home(){
  const [active,setActive]=useState(0);
  const [loading,setLoading]=useState(false);
  const [g,setG]=useState<Inputs>({t0:'',t1:'',t2:'',t3:'',t4:'',t5:'',t6:'',t7:'',t8:'',t9:'5',t10:'',t11:'', packages: []});
  const [logoData,setLogoData]=useState<string>('');
  const [previewHtml,setPreviewHtml]=useState(''); const iframeRef=useRef<HTMLIFrameElement>(null);

  function next(){ setActive(x=>Math.min(x+1, steps.length-1)); }
  function back(){ setActive(x=>Math.max(x-1,0)); }

  async function suggest(field: keyof Inputs){
    const res=await fetch('/api/suggest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({field, context:g})});
    const j=await res.json(); if(!j.ok){ alert('Falha na sugestão'); return; }
    setG(prev => ({...prev, [field]: j.suggestion } as Inputs));
  }

  function onLogo(e: React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader(); reader.onload=()=> setLogoData(reader.result as string); reader.readAsDataURL(file);
  }

  function parseBrand(paleta:string){ const m=paleta.match(/#([0-9a-fA-F]{6})/); return m?`#${m[1]}`:'#00FFFF'; }
  function buildQuiz(ai:any, link:string){
    const brand=parseBrand(ai.paleta||g.t5||''); const fontTitle=(ai.estilo||g.t7||'').toLowerCase().includes('futur')?'"Orbitron", sans-serif':'Inter, system-ui, Arial';
    const css=`:root{ --brand:${brand}; --bg:#0A0F1A; --text:#E8F6FF; }*{box-sizing:border-box;}body{margin:0;font-family:Inter,Arial;background:var(--bg);color:var(--text);} .wrap{max-width:860px;margin:30px auto;padding:0 16px;} .logo{width:64px;opacity:.9;} .hd h1{font-family:${fontTitle};font-weight:700;margin:10px 0 6px;} .sub{opacity:.85;margin-top:2px;} .card{margin:22px 0;padding:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:16px;} .btn{margin-top:14px;padding:13px 16px;background:var(--brand);color:#001018;border:none;border-radius:12px;font-weight:700;cursor:pointer;display:inline-block;text-decoration:none;} .ops{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;} .op{padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#101828;color:#fff;cursor:pointer;} .op:hover{border-color:var(--brand);} .hidden{display:none;} .progress{height:6px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden;margin:8px 0 14px;} .bar{height:100%;width:0%;background:var(--brand);transition:width .25s ease;}`;
    const pkgHtml=(g.packages?.length?`<div class="card"><h3>Planos & Pacotes</h3><ul>`+g.packages.map(p=>`<li><strong>${p.name}</strong> — ${p.description}${p.price?` • <em>${p.price}</em>`:''}</li>`).join('')+`</ul></div>`:''); 
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${ai.headline}</title><link rel="stylesheet" href="./style.css"/></head><body><main class="wrap"><header class="card hd"><img src="logo.png" class="logo"/><h1>${ai.headline}</h1><p class="sub">${ai.subheadline}</p><div class="progress"><div class="bar" id="bar"></div></div></header><section id="stage" class="card"></section>${pkgHtml}<section id="result" class="card hidden"><h2>${ai.resultadoTitulo}</h2><p>${ai.resultadoTexto}</p><a class="btn" href="${link||'#'}" target="_blank" rel="noreferrer">${ai.cta}</a></section></main><script src="./script.js"></script></body></html>`;
    const js = `(function(){ const data=${JSON.stringify(ai)}; let i=0; const stage=document.getElementById('stage'); const result=document.getElementById('result'); const bar=document.getElementById('bar'); function renderQuestion(k){ const q=data.perguntas[k]; if(!q){ showResult(); return; } const ops=q.opcoes.map(o=>'<button class="op" data-v="'+o.replace(/"/g,'&quot;')+'">'+o+'</button>').join(''); stage.innerHTML='<div class="q"><h2>'+q.texto+'</h2><div class="ops">'+ops+'</div><button id="next" class="btn">Avançar</button></div>'; bar.style.width=(k/Math.max(1,(data.perguntas.length)))*100+'%'; const opBtns=stage.querySelectorAll('.op'); opBtns.forEach(b=>b.addEventListener('click',()=>{ opBtns.forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); })); stage.querySelector('#next').addEventListener('click',()=>{ i++; renderQuestion(i); }); } function showResult(){ stage.classList.add('hidden'); result.classList.remove('hidden'); bar.style.width='100%'; } renderQuestion(0); })();`;
    return {html, css, js};
  }

  async function gerar(){
    setLoading(true);
    const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(g)});
    const j=await res.json(); if(!j.ok){ alert(j.error||'Falha ao gerar'); setLoading(false); return; }
    const data=j.data; const {html,css,js}=buildQuiz(data,g.t4);
    const full=html.replace('<link rel="stylesheet" href="./style.css"/>', `<style>${css}</style>`).replace('<script src="./script.js"></script>', `<script>${js}</script>`);
    setPreviewHtml(full); setTimeout(()=>{ const iframe=iframeRef.current; if(iframe) iframe.srcdoc=full; },0); setActive(steps.length-1); setLoading(false);
  }

  async function downloadZip(){
    if(!previewHtml) return alert('Gere o preview primeiro.');
    const css=(previewHtml.match(/<style>([\s\S]*?)<\/style>/)||[])[1]||'';
    const js=(previewHtml.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)||[])[1]||'';
    let html=previewHtml.replace(/<style>[\s\S]*?<\/style>/,'<link rel="stylesheet" href="./style.css"/>').replace(/<script>[\s\S]*?<\/script>\s*<\/body>/,'<script src="./script.js"></script></body>');
    const zip=new JSZip(); zip.file('index.html', html); zip.file('style.css', css); zip.file('script.js', js);
    if(logoData){ const base64=logoData.split(',')[1]||''; zip.file('logo.png', base64, {base64:true}); } else { const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#00FFFF"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Orbitron,Arial" font-size="28" fill="#001B33">${g.t0||'Quiz IA'}</text></svg>`; zip.file('logo.png', svg); }
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Quiz-${(g.t0||'Quiz-IA')}.zip`; a.click(); URL.revokeObjectURL(url);
  }

  return (<div className="container">
    <div className="hero"><h1 className="title">Quiz IA Builder PRO <span className="badge">dinâmico</span></h1><p className="subtitle">Identidade visual por input • IA para sugerir campos • Prévia por etapas • Download ZIP</p></div>
    <div className="grid">
      <aside className="sidebar">{steps.map((s,i)=>(<div key={i} className={`step ${i===active?'active':''}`}>{i+1}. {s}</div>))}</aside>
      <main>
        {active===0&&(<div className="card">
          <label>Título [0]</label><input className="input" value={g.t0} onChange={e=>setG({...g,t0:e.target.value})} placeholder="Quiz IA, Pintando a Palavra..."/>
          <label style={{marginTop:10}}>Logo (opcional)</label><input type="file" accept="image/png,image/jpeg" onChange={e=>{const file=e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=()=>setLogoData(r.result as string); r.readAsDataURL(file);}} />
          <label style={{marginTop:10}}>Nicho [1]</label>
          <div className="row"><input className="input" name="t1" value={g.t1} onChange={e=>setG({...g,t1:e.target.value})} placeholder="Gestor de Tráfego, Estética Facial..."/><button className="btn small" onClick={()=>suggest('t1')}>✨ Recomendado</button></div>
        </div>)}
        {active===1&&(<div className="card">
          <label>Público-alvo [2]</label><div className="row"><input className="input" name="t2" value={g.t2} onChange={e=>setG({...g,t2:e.target.value})} placeholder="Ex: mães cristãs, empreendedores..."/><button className="btn small" onClick={()=>suggest('t2')}>✨ Recomendado</button></div>
          <label style={{marginTop:10}}>Objetivo do Quiz [3]</label><div className="row"><input className="input" name="t3" value={g.t3} onChange={e=>setG({...g,t3:e.target.value})} placeholder="Ex: captar leads, vender produto, WhatsApp..."/><button className="btn small" onClick={()=>suggest('t3')}>✨ Recomendado</button></div>
        </div>)}
        {active===2&&(<div className="card">
          <label>Paleta de cores [5]</label><div className="row"><input className="input" name="t5" value={g.t5} onChange={e=>setG({...g,t5:e.target.value})} placeholder="Ex: ciano #00FFFF, fundo #0A0F1A"/><button className="btn small" onClick={()=>suggest('t5')}>✨ Recomendado</button></div>
          <label style={{marginTop:10}}>Estilo visual [7]</label><div className="row"><input className="input" name="t7" value={g.t7} onChange={e=>setG({...g,t7:e.target.value})} placeholder="Futurista, elegante, minimalista..."/><button className="btn small" onClick={()=>suggest('t7')}>✨ Recomendado</button></div>
          <label style={{marginTop:10}}>Tom de linguagem [8]</label><div className="row"><input className="input" name="t8" value={g.t8} onChange={e=>setG({...g,t8:e.target.value})} placeholder="Autoridade, acolhedor, técnico..."/><button className="btn small" onClick={()=>suggest('t8')}>✨ Recomendado</button></div>
        </div>)}
        {active===3&&(<div className="card">
          <label>Número de perguntas [9] (4 a 7)</label><input className="input" value={g.t9} onChange={e=>setG({...g,t9:e.target.value})} placeholder="5"/>
          <hr className="sep"/><label>Observações [11]</label><textarea className="textarea" rows={3} value={g.t11} onChange={e=>setG({...g,t11:e.target.value})} placeholder="Referências, persona, elementos obrigatórios..."></textarea>
        </div>)}
        {active===4&&(<div className="card">
          <label>Pacotes personalizados (opcional)</label><button className="btn small" onClick={()=> setG(prev=>({...prev, packages:[...(prev.packages||[]), {name:'Pacote Pro', description:'Implementação completa em 7 dias', price:'R$ 997'}]}))}>+ Adicionar pacote de exemplo</button>
          {(g.packages||[]).map((p,idx)=>(<div key={idx} className="card" style={{marginTop:10}}>
            <label>Nome</label><input className="input" value={p.name} onChange={e=>{const arr=[...g.packages]; arr[idx].name=e.target.value; setG({...g, packages:arr});}}/>
            <label>Descrição</label><input className="input" value={p.description} onChange={e=>{const arr=[...g.packages]; arr[idx].description=e.target.value; setG({...g, packages:arr});}}/>
            <label>Preço</label><input className="input" value={p.price||''} onChange={e=>{const arr=[...g.packages]; arr[idx].price=e.target.value; setG({...g, packages:arr});}}/>
          </div>))}
        </div>)}
        {active===5&&(<div className="card">
          <label>CTA final [10]</label><input className="input" value={g.t10} onChange={e=>setG({...g,t10:e.target.value})} placeholder="Ex: Quero começar agora"/>
          <label style={{marginTop:10}}>Link final [4]</label><input className="input" value={g.t4} onChange={e=>setG({...g,t4:e.target.value})} placeholder="https://seusite.com/checkout ou WhatsApp"/>
        </div>)}
        {active===6&&(<div className="card">
          <div className="actions" style={{marginBottom:10}}>
            <button className="btn primary" onClick={gerar} disabled={loading}>{loading?'Gerando com IA…':'Gerar quiz com IA'}</button>
            <button className="btn" onClick={downloadZip}>Baixar ZIP</button>
          </div>
          <iframe ref={iframeRef} className="preview" title="Prévia do Quiz"></iframe>
          <p className="footer-note">Prévia local por etapas (lógica idêntica ao seu base). O download exporta os arquivos finais.</p>
        </div>)}
        <div className="actions"><button className="btn" onClick={back} disabled={active===0}>Voltar</button><button className="btn" onClick={next} disabled={active===steps.length-1}>Próximo</button></div>
        <p className="footer-note">Dica: ✨ Recomendado usa IA. Sem chave, sugestões e geração usam modo local.</p>
      </main>
    </div>
  </div>);
}
