#!/usr/bin/env node
// Validador do padrão visual da home (DESIGN-SYSTEM.md).
// Node puro, sem dependências. Uso: npm run lint:design
//
// Regras:
//   radius      border-radius só com var(--radius-*), 50%, inherit ou 0
//   hex         cor hex só dentro de blocos :root (exceto fill/stroke/stop-color
//               de SVG decorativo e valores dentro de url(data:...))
//   transition  nada de `transition: all`
//   hover       todo :hover dentro de @media (hover: hover)
//   button      <button>/<a> com cara de botão na home precisa da classe `button`
//   texto       palavras proibidas (seção 7) no index.html

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSS_FILES = ['lp/client-first.css', 'lp/morar.css', 'lp/leilao.css'];
const HTML_FILE = 'index.html';

// ---------------------------------------------------------------------------
// Exceções explícitas (justificadas)
// ---------------------------------------------------------------------------

// <button> que NÃO são botões de ação e por isso não usam a classe `button`.
const BUTTON_EXCEPTIONS = {
  'nav-toggle': 'ícone de abrir/fechar o menu no celular (só ícone, sem texto)',
  'modal-close': 'ícone "X" de fechar o modal',
  'video-placeholder': 'área do vídeo inteira é clicável; o botão visível é o círculo de play',
  'lm-dot': 'pontos de progresso do carrossel (criados pelo leilao.js)',
  'faq-question': '<summary> do FAQ (linha de pergunta, não botão)',
};

// Classes que indicam "aparência de botão" num <a> ou <button>.
// Um <a> só é checado se tiver uma destas (links de texto do menu, rodapé e do
// FAQ, como <a href="#leilao">Veja o resumo</a>, ficam de fora de propósito).
const BUTTONISH_CLASS = /(^|[\s"'])(btn(-[\w-]+)?|[\w-]*-btn|cta-pill|cta|[\w-]*-cta|nav-cta)(?=[\s"']|$)/;

// Classes antigas de botão que não podem mais aparecer na home.
const LEGACY_BUTTON_CLASSES = ['btn-primary', 'btn-outline', 'btn-lg', 'btn-sm', 'cta-pill'];

// Textos proibidos (DESIGN-SYSTEM.md, seção 7).
const FORBIDDEN_TEXT = [
  /análise jurídica/i,
  /\bparecer\b/i,
  /assessoria jurídica/i,
  /consultoria jurídica/i,
  /\brecomendamos\b/i,
  /vale a pena/i,
  /você deve/i,
  /\bdepende\b/i,
  /grátis\.?\s*sem cartão/i,
  /sem spam/i,
  /sem palavra difícil/i,
];

// Frases já aprovadas que casam com um padrão acima, mas não têm o sentido
// proibido. Cada uma precisa de justificativa.
const TEXT_EXCEPTIONS = [];

// ---------------------------------------------------------------------------

const problems = [];
const report = (file, line, rule, msg) => problems.push({ file, line, rule, msg });

function lineAt(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

// Troca comentários por espaços (mantém posições e quebras de linha).
function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

// Percorre o CSS em blocos: devolve cada declaração com o contexto (pilha de
// cabeçalhos) e cada seletor com a pilha de at-rules em volta.
function walkCss(css, onSelector, onDeclaration) {
  const stack = []; // { header, start }
  let buf = '';
  let bufStart = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      const header = buf.trim();
      const start = bufStart + (buf.length - buf.trimStart().length);
      if (!header.startsWith('@')) onSelector(header, start, stack.map((s) => s.header));
      stack.push({ header, start });
      buf = ''; bufStart = i + 1;
    } else if (ch === '}' || ch === ';') {
      const decl = buf.trim();
      if (decl) {
        const start = bufStart + (buf.length - buf.trimStart().length);
        onDeclaration(decl, start, stack.map((s) => s.header));
      }
      if (ch === '}') stack.pop();
      buf = ''; bufStart = i + 1;
    } else {
      buf += ch;
    }
  }
}

const ALLOWED_RADIUS_TOKEN = /^(var\(--radius-(round|medium|large)\)|50%|inherit|0)$/;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const HEX_OK_PROPS = /^(fill|stroke|stop-color|flood-color|lighting-color)$/;

function checkCss(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { report(rel, 0, 'arquivo', 'arquivo não encontrado'); return; }
  const css = stripCssComments(fs.readFileSync(file, 'utf8'));

  walkCss(
    css,
    (selector, start, ctx) => {
      if (!/:hover\b/.test(selector)) return;
      const gated = ctx.some((h) => /^@media[^{]*\(\s*hover\s*:\s*hover\s*\)/i.test(h));
      if (!gated) report(rel, lineAt(css, start), 'hover', `":hover" fora de @media (hover: hover): ${selector.replace(/\s+/g, ' ')}`);
    },
    (decl, start, ctx) => {
      const m = decl.match(/^([\w-]+)\s*:\s*([\s\S]*)$/);
      if (!m) return;
      const prop = m[1].toLowerCase();
      const value = m[2].replace(/!important/i, '').trim();
      const line = lineAt(css, start);
      const inRoot = ctx.some((h) => /(^|,)\s*:root\b/.test(h));

      if (/^border(-[a-z]+)*-radius$/.test(prop)) {
        const parts = value.split(/\s*\/\s*|\s+(?![^(]*\))/).filter(Boolean);
        const bad = parts.filter((p) => !ALLOWED_RADIUS_TOKEN.test(p));
        if (bad.length) report(rel, line, 'radius', `${prop}: ${value} (use var(--radius-round|medium|large), 50%, inherit ou 0)`);
      }

      if (/^transition(-property)?$/.test(prop) && /(^|[\s,])all(\s|,|$)/.test(value)) {
        report(rel, line, 'transition', `${prop}: ${value} (liste as propriedades; nunca "all")`);
      }

      if (!inRoot && !HEX_OK_PROPS.test(prop)) {
        const noData = value.replace(/url\(\s*(['"]?)data:[\s\S]*?\1\s*\)/gi, 'url()');
        const hits = noData.match(HEX);
        if (hits) report(rel, line, 'hex', `${prop}: ${hits.join(', ')} fora do :root (crie um token)`);
      }
    }
  );
}

function classesOf(attrs) {
  const m = attrs.match(/\bclass\s*=\s*"([^"]*)"|\bclass\s*=\s*'([^']*)'/);
  return m ? (m[1] || m[2] || '').split(/\s+/).filter(Boolean) : [];
}

function checkHtml(rel) {
  const file = path.join(ROOT, rel);
  const html = fs.readFileSync(file, 'utf8');

  // Botões
  const tagRe = /<(button|a)\b([^>]*)>/gi;
  let m;
  while ((m = tagRe.exec(html))) {
    const tag = m[1].toLowerCase();
    const classes = classesOf(m[2]);
    const line = lineAt(html, m.index);
    const legacy = classes.filter((c) => LEGACY_BUTTON_CLASSES.includes(c));
    if (legacy.length) report(rel, line, 'button', `<${tag}> com classe antiga de botão: ${legacy.join(', ')} (use "button ...")`);
    if (classes.includes('button')) continue;
    const excepted = classes.some((c) => Object.prototype.hasOwnProperty.call(BUTTON_EXCEPTIONS, c));
    if (excepted) continue;
    if (tag === 'button') {
      report(rel, line, 'button', `<button class="${classes.join(' ')}"> sem a classe "button" (ou inclua a exceção justificada em scripts/check-design.js)`);
    } else if (BUTTONISH_CLASS.test(' ' + classes.join(' ') + ' ')) {
      report(rel, line, 'button', `<a class="${classes.join(' ')}"> tem cara de botão mas não usa a classe "button"`);
    }
  }

  // Estilo inline com hex ou raio solto
  const styleRe = /\bstyle\s*=\s*"([^"]*)"/gi;
  while ((m = styleRe.exec(html))) {
    const line = lineAt(html, m.index);
    if (HEX.test(m[1])) report(rel, line, 'hex', `style="${m[1]}" com cor hex`);
    HEX.lastIndex = 0;
    if (/border(-[a-z]+)*-radius/i.test(m[1])) report(rel, line, 'radius', `style="${m[1]}" com border-radius inline`);
  }

  // Texto proibido: texto visível + atributos de texto (alt, aria-label, title, placeholder, content)
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/<style[\s\S]*?<\/style>/gi, (s) => s.replace(/[^\n]/g, ' '))
    .replace(/<svg[\s\S]*?<\/svg>/gi, (s) => s.replace(/[^\n]/g, ' '));
  const attrText = [];
  text = text.replace(/<[^>]*>/g, (tagStr) => {
    const re = /\b(alt|aria-label|title|placeholder|content|data-title)\s*=\s*"([^"]*)"/gi;
    let a;
    while ((a = re.exec(tagStr))) attrText.push(a[2]);
    return tagStr.replace(/[^\n]/g, ' ');
  });
  const haystack = text + '\n' + attrText.join('\n');
  // Remove as frases de exceção antes de procurar
  let cleaned = haystack;
  for (const ex of TEXT_EXCEPTIONS) cleaned = cleaned.split(ex.text).join(' '.repeat(ex.text.length));
  for (const re of FORBIDDEN_TEXT) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let t;
    while ((t = g.exec(cleaned))) {
      const idx = t.index < text.length ? t.index : -1;
      report(rel, idx >= 0 ? lineAt(html, idx) : 0, 'texto', `palavra proibida: "${t[0]}"`);
    }
  }
}

for (const f of CSS_FILES) checkCss(f);
checkHtml(HTML_FILE);

const checked = [...CSS_FILES, HTML_FILE].join(', ');
if (problems.length) {
  console.error(`lint:design — ${problems.length} problema(s) em ${checked}\n`);
  for (const p of problems) console.error(`  ${p.file}:${p.line}  [${p.rule}]  ${p.msg}`);
  console.error('\nRegras em DESIGN-SYSTEM.md. Exceções justificadas no topo de scripts/check-design.js.');
  process.exit(1);
}
console.log(`lint:design — ok (${checked})`);
