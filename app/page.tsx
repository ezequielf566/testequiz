'use client';
import { useState } from 'react';

type Gabarito = {
  t0: string; t1: string; t2: string; t3: string; t4: string; t5: string;
  t6: string; t7: string; t8: string; t9: string; t10: string; t11: string;
};

const steps = [
  'Objetivo', 'Refinamento estratégico', 'Nicho', 'Formato', 'Visual', 'Resultado', 'Download'
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [g, setG] = useState<Gabarito>({ t0:'',t1:'',t2:'',t3:'',t4:'',t5:'',t6:'',t7:'',t8:'',t9:'',t10:'',t11:'' });
  const [previewUrl, setPreviewUrl] = useState<string|undefined>(undefined);

  async function generate() {
    setLoading(true);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo:g.t0, nicho:g.t1, publico:g.t2, objetivo:g.t3, link:g.t4,
        paleta:g.t5, logo:g.t6, estilo:g.t7, tom:g.t8, num:g.t9, cta:g.t10, obs:g.t11
      })
    });
    if (!res.ok) { alert('Falha ao gerar'); setLoading(false); return; }
    const data = await res.json();
    setPreviewUrl(data.previewUrl);
    setActive(5);
    setLoading(false);
  }

  async function downloadZip() {
    const res = await fetch('/api/generate?download=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo:g.t0, nicho:g.t1, publico:g.t2, objetivo:g.t3, link:g.t4,
        paleta:g.t5, logo:g.t6, estilo:g.t7, tom:g.t8, num:g.t9, cta:g.t10, obs:g.t11
      })
    });
    if (!res.ok) { alert('Falha ao gerar ZIP'); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Quiz-${(g.t0||'Quiz-IA')}.zip`; a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="hero">
        <h1 className="title">Monte seu quiz com IA — 100% seu, sem mensalidades.</h1>
        <p className="subtitle">Preencha abaixo para gerar seu primeiro quiz com IA. Visualização gratuita por 7 dias. Download completo disponível no painel.</p>
      </div>

      <div className="row">
        <aside className="sidebar">
          {steps.map((s, i)=>(
            <div key={i} className={`step ${i===active?'active':''}`}>{i+1}. {s}</div>
          ))}
        </aside>

        <main>
          {[
            ['Título do negócio [0]','t0','Ex: Quiz IA, Pintando a Palavra...'],
            ['Nome do Nicho [1]','t1','Ex: Gestor de Tráfego, Estética Facial, Loja Infantil...'],
            ['Público-alvo [2]','t2','Ex: mães cristãs, empreendedores, adolescentes...'],
            ['Objetivo do Quiz [3]','t3','Ex: captar leads, vender produto, WhatsApp...'],
            ['Link de destino [4]','t4','https://seusite.com/checkout ou link do WhatsApp'],
            ['Paleta de cores sugerida [5]','t5','Ex: azul #3D8BF2, ciano #00FFFF, fundo #0A0F1A'],
            ['Logo [6]','t6','Descreva ou deixe em branco para padrão'],
            ['Estilo visual [7]','t7','Futurista, elegante, minimalista...'],
            ['Tom de linguagem [8]','t8','Autoridade, acolhedor, técnico, divertido...'],
            ['Número de perguntas [9]','t9','Entre 4 e 7'],
            ['Chamada para ação final [10]','t10','Ex: Falar com especialista, Quero começar...'],
            ['Observações adicionais [11]','t11','Referências de design, persona, elementos obrigatórios...']
          ].map(([label, key, ph])=>(
            <div className="card" style={{marginBottom:14}} key={key as string}>
              <label>{label}</label>
              {key==='t11' ? (
                <textarea className="textarea" rows={3} value={(g as any)[key]} onChange={e=>setG({...g,[key as string]:e.target.value})} placeholder={ph as string}></textarea>
              ) : (
                <input className="input" value={(g as any)[key]} onChange={e=>setG({...g,[key as string]:e.target.value})} placeholder={ph as string} />
              )}
            </div>
          ))}

          <div style={{display:'flex', gap:10, marginTop:12}}>
            <button className="btn" onClick={()=>setActive(Math.min(active+1, steps.length-1))}>Avançar etapa</button>
            <button className="btn primary" onClick={generate} disabled={loading}>{loading?'Gerando…':'Gerar quiz e ver preview'}</button>
            {previewUrl && <a className="btn" href={previewUrl} target="_blank" rel="noreferrer">Abrir preview</a>}
            <button className="btn" onClick={downloadZip}>Baixar ZIP completo (teste)</button>
          </div>
          <p className="footer-note">Visualização gratuita por 7 dias. Download completo será pago na versão final.</p>
        </main>
      </div>
    </div>
  );
}
