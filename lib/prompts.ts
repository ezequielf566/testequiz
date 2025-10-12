export type Inputs = {
  t0: string; t1: string; t2: string; t3: string; t4: string; t5: string;
  t6: string; t7: string; t8: string; t9: string; t10: string; t11: string;
};
export function systemPrompt(i: Inputs) {
  return `Você é um copywriter/UX writer especialista em quizzes. Gere textos em pt-BR no tom ${i.t8||'profissional e direto'}, para o nicho ${i.t1}. Objetivo: ${i.t3}. Público: ${i.t2}. Use frases curtas e CTA forte. Se objetivo envolver vendas, reforce dores e transformação. Mantenha linguagem clara e empática.`;
}
export function userPrompt(i: Inputs) {
  const nperg = Math.max(4, Math.min(7, parseInt(i.t9||'5')||5));
  return `Entregue um JSON válido e nada além disso, com a estrutura:
{
  "headline": string,
  "subheadline": string,
  "perguntas": [ { "texto": string, "opcoes": [string,string,string] } ],  // ${nperg} itens
  "resultadoTitulo": string,
  "resultadoTexto": string,
  "cta": string,
  "paleta": "${i.t5||'ciano #00FFFF, fundo #0A0F1A'}"
}
Regras: gere ${nperg} perguntas com 3 opções curtas cada; sem emojis; CTA imperativo; contextualize com o link final: ${i.t4}. Se objetivo é vendas, destaque dor->solução; se for lead/consultoria, destaque próxima ação. Título do negócio: ${i.t0}. Estilo visual: ${i.t7}. Observações: ${i.t11}.`;
}
