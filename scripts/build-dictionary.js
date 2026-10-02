const fs = require('fs');
const path = require('path');
const { GLOSSARY, GLOSSARY_GROUPS, glossaryByGroup } = require('../content/glossary');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SITE_URL = 'https://www.argosleiloes.com.br';
const DEFAULT_APP_URL = 'https://app.argosleiloes.com.br';
const DICTIONARY_PATH = '/dicionario';
const DICTIONARY_TITLE = 'Dicionário do leilão de imóveis da Caixa';
const DICTIONARY_DESCRIPTION = 'O que quer dizer cada palavra dos leilões e da venda direta da Caixa: rodadas, valor de avaliação, imóvel ocupado, ITBI, matrícula e outros termos, sem juridiquês.';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function termSlug(key) {
  return key.replace(/_/g, '-');
}

function termPath(key) {
  return `${DICTIONARY_PATH}/${termSlug(key)}`;
}

function dictionaryEntry(key) {
  const entry = GLOSSARY[key];
  if (!entry) return null;
  return { key, ...entry, slug: termSlug(key), path: termPath(key), detail: entry.detail || [] };
}

function groupTitle(groupId) {
  return GLOSSARY_GROUPS.find(group => group.id === groupId)?.title || '';
}

function relatedEntries(key, limit = 6) {
  const entry = GLOSSARY[key];
  if (!entry) return [];
  const group = glossaryByGroup().find(item => item.id === entry.group);
  return (group?.entries || [])
    .filter(item => item.key !== key)
    .slice(0, limit)
    .map(item => dictionaryEntry(item.key));
}

function isIndexableTerm(key) {
  return (GLOSSARY[key]?.detail || []).length > 0;
}

function dictionarySitemapPaths() {
  return [
    DICTIONARY_PATH,
    ...Object.keys(GLOSSARY).filter(isIndexableTerm).map(termPath),
  ];
}

function clip(text, max = 158) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

function dictionaryMeta(key, siteUrl) {
  if (!key) {
    return {
      title: `${DICTIONARY_TITLE} | Argos`,
      description: DICTIONARY_DESCRIPTION,
      canonical: `${siteUrl}${DICTIONARY_PATH}`,
      index: true,
    };
  }
  const entry = dictionaryEntry(key);
  return {
    title: `${entry.term}: o que é no leilão da Caixa | Argos`,
    description: clip(entry.body),
    canonical: `${siteUrl}${entry.path}`,
    index: isIndexableTerm(key),
  };
}

function dictionaryJsonLd(key, siteUrl) {
  const setUrl = `${siteUrl}${DICTIONARY_PATH}`;
  const termSet = {
    '@type': 'DefinedTermSet',
    '@id': `${setUrl}#dicionario`,
    name: DICTIONARY_TITLE,
    url: setUrl,
  };
  const definedTerm = (entry) => ({
    '@type': 'DefinedTerm',
    '@id': `${siteUrl}${entry.path}#termo`,
    name: entry.term,
    description: entry.body,
    url: `${siteUrl}${entry.path}`,
    inDefinedTermSet: `${setUrl}#dicionario`,
  });

  if (!key) {
    return [{
      '@context': 'https://schema.org',
      ...termSet,
      description: DICTIONARY_DESCRIPTION,
      inLanguage: 'pt-BR',
      hasDefinedTerm: Object.keys(GLOSSARY).map(item => definedTerm(dictionaryEntry(item))),
    }];
  }

  const entry = dictionaryEntry(key);
  return [
    { '@context': 'https://schema.org', ...definedTerm(entry), inDefinedTermSet: termSet },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Dicionário', item: setUrl },
        { '@type': 'ListItem', position: 2, name: entry.term, item: `${siteUrl}${entry.path}` },
      ],
    },
  ];
}

function logoMarkup() {
  return '<span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt=""></span><span class="logo-word">Argos</span>';
}

function headerMarkup(appUrl) {
  return `<header class="nav dictionary-nav">
  <div class="container dictionary-nav-inner">
    <a href="/" class="logo">${logoMarkup()}</a>
    <a class="dictionary-nav-current" href="${DICTIONARY_PATH}" aria-current="page">Dicionário</a>
    <div class="dictionary-account">
      <a href="${appUrl}/entrar">Entrar</a>
      <a class="btn-primary btn-sm" href="${appUrl}/entrar">Criar conta grátis</a>
    </div>
  </div>
</header>`;
}

function footerMarkup() {
  return `<footer class="footer dictionary-footer">
  <div class="container footer-inner">
    <a href="/" class="logo">${logoMarkup()}</a>
    <p class="footer-sub">Imóveis de leilão explicados em português claro.</p>
    <nav class="footer-links"><a href="/">Início</a><a href="/blog/">Blog</a></nav>
    <p class="footer-copy">&copy; 2026 Argos. Todos os direitos reservados.</p>
  </div>
</footer>`;
}

function catalogInvite(appUrl) {
  return `<aside class="dictionary-cta">
    <p><b>Veja estes termos num imóvel de verdade.</b> No Argos, cada imóvel da Caixa mostra a rodada, a ocupação e quanto você paga até receber a chave.</p>
    <a class="btn-primary" href="${appUrl}/entrar">Criar conta grátis e ver os imóveis</a>
  </aside>`;
}

function stickyCatalogBar(appUrl) {
  return `<div class="dictionary-sticky"><span>Imóveis da Caixa com a conta completa</span><a class="btn-primary btn-sm" href="${appUrl}/entrar">Criar conta grátis</a></div>`;
}

function dictionaryNote() {
  return '<p class="dictionary-note">Os textos descrevem as regras gerais das vendas da Caixa. Cada venda tem suas regras oficiais (o edital), que valem sobre qualquer explicação daqui.</p>';
}

function introMarkup(appUrl) {
  return `<aside class="dictionary-intro">
    <span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt=""></span>
    <p><b>Argos</b> reúne os imóveis da Caixa em leilão e venda direta, com a conta de quanto você paga até receber a chave.</p>
    <a class="btn-primary btn-sm" href="${appUrl}/entrar">Criar conta grátis</a>
  </aside>`;
}

function hubBody(appUrl) {
  const groups = glossaryByGroup();
  const index = groups.map(group => `<a href="#${group.id}">${escapeHtml(group.title)}</a>`).join('');
  const sections = groups.map(group => {
    const entries = group.entries.map(entry => (
      `<div id="${entry.key}" class="dictionary-entry" data-dictionary-entry data-search="${escapeHtml(`${entry.term} ${entry.body}`.toLowerCase())}">`
      + `<dt><a href="${termPath(entry.key)}">${escapeHtml(entry.term)}</a></dt><dd>${escapeHtml(entry.body)}</dd></div>`
    )).join('');
    return `<section id="${group.id}" class="dictionary-group" data-dictionary-group><h2>${escapeHtml(group.title)}</h2><dl>${entries}</dl></section>`;
  }).join('');

  return `<main class="dictionary-page">${introMarkup(appUrl)}
    <header class="dictionary-head">
      <p class="dictionary-kicker">Entenda antes do lance</p>
      <h1>Dicionário do leilão de imóveis</h1>
      <p>As palavras que aparecem nos leilões e na venda direta da Caixa, explicadas sem juridiquês.</p>
      <label class="dictionary-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Procure uma palavra: ITBI, matrícula, 2ª rodada…" aria-label="Procurar no dicionário" data-dictionary-search></label>
      <p class="dictionary-count" data-dictionary-count hidden></p>
    </header>
    <nav class="dictionary-index" aria-label="Assuntos" data-dictionary-index>${index}</nav>
    <p class="dictionary-empty" data-dictionary-empty hidden>Nenhuma palavra encontrada.</p>
    ${sections}${catalogInvite(appUrl)}${dictionaryNote()}${stickyCatalogBar(appUrl)}
  </main>`;
}

function termBody(key, appUrl) {
  const entry = dictionaryEntry(key);
  const group = groupTitle(entry.group);
  const detail = entry.detail.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const related = relatedEntries(key)
    .map(item => `<li><a href="${item.path}">${escapeHtml(item.term)}</a></li>`).join('');

  return `<main class="dictionary-page dictionary-term-page">${introMarkup(appUrl)}
    <nav class="dictionary-crumbs" aria-label="Você está em"><a href="${DICTIONARY_PATH}">Dicionário</a><span aria-hidden="true">›</span><a href="${DICTIONARY_PATH}#${entry.group}">${escapeHtml(group)}</a></nav>
    <article><h1>${escapeHtml(entry.term)}</h1><p class="dictionary-term-lead">${escapeHtml(entry.body)}</p>${detail}<a class="dictionary-term-cta" href="${appUrl}/entrar">Criar conta grátis e ver os imóveis da Caixa →</a></article>
    ${related ? `<section class="dictionary-related"><h2>Outros termos de ${escapeHtml(group.toLowerCase())}</h2><ul>${related}</ul><a class="dictionary-all" href="${DICTIONARY_PATH}">Ver o dicionário completo</a></section>` : ''}
    ${catalogInvite(appUrl)}${dictionaryNote()}${stickyCatalogBar(appUrl)}
  </main>`;
}

function pageShell({ body, key, siteUrl, appUrl }) {
  const meta = dictionaryMeta(key, siteUrl);
  const schemas = dictionaryJsonLd(key, siteUrl)
    .map(data => `<script type="application/ld+json">${jsonForHtml(data)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">
  <meta name="robots" content="${meta.index ? 'index, follow' : 'noindex, follow'}">
  <link rel="canonical" href="${meta.canonical}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Argos">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${meta.canonical}">
  <meta name="theme-color" content="#FFFFFF">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/lp/styles.css">
  <link rel="stylesheet" href="/lp/dictionary.css">
  ${schemas}
</head>
<body class="dictionary-body">
${headerMarkup(appUrl)}
${body}
${footerMarkup()}
<script src="/lp/dictionary.js" defer></script>
</body>
</html>`;
}

function buildDictionary({ root = ROOT, siteUrl = DEFAULT_SITE_URL, appUrl = DEFAULT_APP_URL } = {}) {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '');
  const normalizedAppUrl = appUrl.replace(/\/+$/, '');
  const output = path.join(root, 'dicionario');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'index.html'), pageShell({
    body: hubBody(normalizedAppUrl),
    key: null,
    siteUrl: normalizedSiteUrl,
    appUrl: normalizedAppUrl,
  }), 'utf8');

  const keys = Object.keys(GLOSSARY);
  for (const key of keys) {
    const termOutput = path.join(output, termSlug(key));
    fs.mkdirSync(termOutput, { recursive: true });
    fs.writeFileSync(path.join(termOutput, 'index.html'), pageShell({
      body: termBody(key, normalizedAppUrl),
      key,
      siteUrl: normalizedSiteUrl,
      appUrl: normalizedAppUrl,
    }), 'utf8');
  }

  console.log(`  ✓ dicionario/index.html e ${keys.length} verbetes`);
  return dictionarySitemapPaths();
}

if (require.main === module) buildDictionary();

module.exports = {
  buildDictionary,
  dictionaryMeta,
  dictionarySitemapPaths,
  isIndexableTerm,
  termPath,
};
