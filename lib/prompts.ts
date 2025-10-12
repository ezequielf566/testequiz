export type Inputs = {
  titulo: string;
  nicho: string;
  publico: string;
  objetivo: string;
  link: string;
  paleta: string;
  logo: string;
  estilo: string;
  tom: string;
  num: string;
  cta: string;
  obs: string;
};

export function systemPrompt(i: Inputs) {
  return `Você é um copywriter/UX writer especialista em quizzes. Gere textos em pt-BR no tom ${i.tom||'profissional e direto'}, para o nicho ${i.nicho}. Objetivo: ${i.objetivo}. Público: ${i.publico}. Use frases curtas e CTA forte. Se objetivo envolver vendas, reforce dores e transformação.`;
}

export function userPrompt(i: Inputs) {
  const nperg = Math.max(4, Math.min(7, parseInt(i.num||'5')||5));
  return `Entregue JSON com esta estrutura exata:
{
  "headline": string,
  "subheadline": string,
  "perguntas": [ { "texto": string, "opcoes": [string,string,string] } ],  // ${nperg} itens
  "resultadoTitulo": string,
  "resultadoTexto": string,
  "cta": string
}
Regras: gere ${nperg} perguntas com 3 opções cada; sem emojis; CTA imperativo; contextualize com o link final: ${i.link}. Se objetivo é vendas, destaque dor->solução.`;
}
