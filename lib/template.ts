import Mustache from 'mustache';

export type QuizContent = {
  headline: string;
  subheadline: string;
  perguntas: { texto: string; opcoes: string[] }[];
  resultadoTitulo: string;
  resultadoTexto: string;
  cta: string;
  tema: { cor: string };
  marca?: string;
  link: string;
};

export function renderTemplates(content: QuizContent) {
  const fs = require('fs');
  const path = require('path');
  const base = (p: string) => fs.readFileSync(path.join(process.cwd(), 'templates', p), 'utf8');

  const index = Mustache.render(base('index.html.mustache'), content);
  const css = Mustache.render(base('style.css.mustache'), content);
  const js = Mustache.render(base('script.js.mustache'), content);

  return { index, css, js };
}
