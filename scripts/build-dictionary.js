const fs = require('fs');
const path = require('path');
const { GLOSSARY, GLOSSARY_GROUPS, glossaryByGroup } = require('../content/glossary');

const ROOT = path.join(__dirname, '..');
const DEFAULT_SITE_URL = 'https://www.argosleiloes.com.br';
const DICTIONARY_PATH = '/dicionario';
const LEARN_URL = '/#leilao';
const WAITLIST_URL = '/?cadastro=1';
const DICTIONARY_TITLE = 'Dicionário do leilão de imóveis da Caixa';
const DICTIONARY_DESCRIPTION = 'O que quer dizer cada palavra dos leilões e da venda direta da Caixa: rodadas, valor de avaliação, imóvel ocupado, ITBI, matrícula e outros termos, sem juridiquês.';
const UPDATED_AT = '2026-10-07';
const FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=optional';

const OFFICIAL_SOURCES = {
  caixa: {
    title: 'Portal de Imóveis CAIXA',
    url: 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
  },
  lei9514: {
    title: 'Lei 9.514/1997 — alienação fiduciária de imóveis',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9514.htm',
  },
  cpc: {
    title: 'Código de Processo Civil — Lei 13.105/2015',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  },
  registros: {
    title: 'Lei de Registros Públicos — Lei 6.015/1973',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm',
  },
  ctn: {
    title: 'Código Tributário Nacional — Lei 5.172/1966',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm',
  },
  fgts: {
    title: 'FGTS na moradia — regras oficiais',
    url: 'https://www.fgts.gov.br/Paginas/trabalhador/fgts-na-moradia.aspx',
  },
  leiloeiro: {
    title: 'Profissão de leiloeiro — Decreto 21.981/1932',
    url: 'https://www.planalto.gov.br/ccivil_03/decreto/1930-1949/d21981.htm',
  },
};

const GROUP_GUIDANCE = {
  venda: {
    confirmation: 'A modalidade, o responsável pela venda e as regras da disputa aparecem na ficha do imóvel e no edital correspondente.',
    sources: ['caixa', 'lei9514'],
    article: { path: '/blog/leilao-de-imoveis-da-caixa-como-funciona/', title: 'Como funciona o leilão de imóveis da Caixa' },
  },
  rodadas: {
    confirmation: 'Use sempre a rodada e a data atuais. Valores de uma etapa anterior podem continuar circulando em anúncios e não servir para a disputa aberta.',
    sources: ['caixa', 'lei9514'],
    article: { path: '/blog/leilao-de-imoveis-da-caixa-como-funciona/', title: 'Como funciona o leilão de imóveis da Caixa' },
  },
  situacao: {
    confirmation: 'A ficha e o edital registram o que o vendedor informa sobre ocupação e posse. Quando a informação não existe, a página não presume que o imóvel esteja livre.',
    sources: ['caixa', 'cpc'],
    article: { path: '/blog/imovel-de-leilao-ocupado-desocupacao/', title: 'Imóvel de leilão ocupado: custos e caminhos para desocupação' },
  },
  pagamento: {
    confirmation: 'As formas aceitas aparecem na ficha de cada imóvel. Aprovação de crédito e uso do FGTS seguem verificações próprias, mesmo quando a modalidade permite esses recursos.',
    sources: ['caixa', 'fgts'],
    article: { path: '/blog/como-financiar-imovel-de-leilao/', title: 'Como financiar um imóvel de leilão' },
  },
  custos: {
    confirmation: 'O edital distribui as despesas da venda. Prefeitura e cartório informam tributos e emolumentos que variam conforme o município, o estado e o valor do imóvel.',
    sources: ['caixa', 'ctn', 'registros'],
    article: { path: '/blog/quanto-custa-comprar-imovel-em-leilao/', title: 'Quanto custa comprar um imóvel em leilão' },
  },
  documentos: {
    confirmation: 'Compare os identificadores da ficha, do edital e da matrícula. Eles precisam apontar para o mesmo imóvel e para o evento de venda correto.',
    sources: ['caixa', 'registros'],
    article: { path: '/blog/como-ler-edital-de-leilao-e-matricula/', title: 'Como ler o edital e a matrícula do imóvel' },
  },
  processo: {
    confirmation: 'Os prazos depois do lance ficam no edital e nos comunicados oficiais. Pagamento, contrato, registro e posse são etapas diferentes.',
    sources: ['caixa', 'cpc'],
    article: { path: '/blog/como-funciona-leilao-de-imoveis/', title: 'Como funciona um leilão de imóveis do começo ao fim' },
  },
};

const TERM_SOURCE_OVERRIDES = {
  leiloeiro: ['caixa', 'leiloeiro'],
  comissao_leiloeiro: ['caixa', 'leiloeiro'],
  pagamento_comissao: ['caixa', 'leiloeiro'],
  alienacao_fiduciaria: ['lei9514', 'registros'],
  direito_preferencia: ['lei9514', 'caixa'],
  fgts: ['caixa', 'fgts'],
  sem_fgts: ['caixa', 'fgts'],
  imissao_na_posse: ['cpc', 'registros'],
  processo: ['cpc', 'caixa'],
  matricula: ['registros', 'caixa'],
  cartorio_oficio: ['registros', 'caixa'],
  registro_cartorio: ['registros', 'caixa'],
  emolumentos: ['registros', 'caixa'],
  itbi: ['ctn', 'registros'],
};

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
  return {
    key,
    ...entry,
    slug: termSlug(key),
    path: termPath(key),
    detail: entry.detail || [],
    checks: entry.checks || [],
  };
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
  const entry = dictionaryEntry(key);
  if (!entry || entry.detail.length < 2 || entry.checks.length < 3) return false;
  const detailWords = entry.detail.join(' ').trim().split(/\s+/).length;
  return detailWords >= 45;
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
  const title = entry.term.length > 30
    ? `${entry.term} | Dicionário Argos`
    : `${entry.term}: o que é no leilão da Caixa | Argos`;
  return {
    title,
    description: clip(`${entry.body} ${entry.detail[0]}`),
    canonical: `${siteUrl}${entry.path}`,
    index: isIndexableTerm(key),
  };
}

function termSources(key) {
  const entry = dictionaryEntry(key);
  const sourceIds = TERM_SOURCE_OVERRIDES[key] || GROUP_GUIDANCE[entry.group].sources;
  return sourceIds.map(sourceId => OFFICIAL_SOURCES[sourceId]);
}

function fontMarkup() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${FONT_STYLESHEET}">
  <link href="${FONT_STYLESHEET}" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="${FONT_STYLESHEET}" rel="stylesheet"></noscript>`;
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
  const pageUrl = `${siteUrl}${entry.path}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      name: `${entry.term}: o que é no leilão da Caixa`,
      description: dictionaryMeta(key, siteUrl).description,
      url: pageUrl,
      inLanguage: 'pt-BR',
      dateModified: UPDATED_AT,
      isPartOf: { '@type': 'WebSite', '@id': `${siteUrl}/#website` },
      mainEntity: { '@id': `${pageUrl}#termo` },
      author: {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Equipe Argos',
      },
      reviewedBy: {
        '@type': 'Organization',
        name: 'Equipe editorial Argos',
        url: siteUrl,
      },
      citation: termSources(key).map(source => ({
        '@type': 'CreativeWork',
        name: source.title,
        url: source.url,
      })),
    },
    { '@context': 'https://schema.org', ...definedTerm(entry), inDefinedTermSet: termSet },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Dicionário', item: setUrl },
        { '@type': 'ListItem', position: 2, name: entry.term, item: pageUrl },
      ],
    },
  ];
}

function logoMarkup() {
  return '<span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt=""></span><span class="logo-word">Argos</span>';
}

function headerMarkup() {
  return `<header class="nav dictionary-nav">
  <div class="container dictionary-nav-inner">
    <a href="/" class="logo">${logoMarkup()}</a>
    <a class="dictionary-nav-current" href="${DICTIONARY_PATH}" aria-current="page">Dicionário</a>
    <div class="dictionary-account">
      <a href="${LEARN_URL}">Como funciona</a>
      <a class="btn-primary btn-sm" href="${WAITLIST_URL}">Quero ser avisado</a>
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

function catalogInvite() {
  return `<aside class="dictionary-cta">
    <p><b>Veja estes termos num imóvel de verdade.</b> No Argos, cada imóvel da Caixa mostra a rodada, a ocupação e quanto você paga até receber a chave.</p>
    <a class="btn-primary" href="${LEARN_URL}">Entender o leilão em 1 minuto</a>
  </aside>`;
}

function stickyCatalogBar() {
  return `<div class="dictionary-sticky"><span>Leilão de imóveis, sem mistério</span><a class="btn-primary btn-sm" href="${WAITLIST_URL}">Quero ser avisado</a></div>`;
}

function dictionaryNote() {
  return '<p class="dictionary-note">Os textos descrevem as regras gerais das vendas da Caixa. Cada venda tem suas regras oficiais (o edital), que valem sobre qualquer explicação daqui.</p>';
}

function introMarkup() {
  return `<aside class="dictionary-intro">
    <span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt=""></span>
    <p><b>Argos</b> reúne os imóveis da Caixa em leilão e venda direta, com a conta de quanto você paga até receber a chave.</p>
    <a class="btn-primary btn-sm" href="${LEARN_URL}">Entender como funciona</a>
  </aside>`;
}

function hubBody() {
  const groups = glossaryByGroup();
  const index = groups.map(group => `<a href="#grupo-${group.id}">${escapeHtml(group.title)}</a>`).join('');
  const sections = groups.map(group => {
    const entries = group.entries.map(entry => (
      `<div id="${entry.key}" class="dictionary-entry" data-dictionary-entry data-search="${escapeHtml(`${entry.term} ${entry.body}`.toLowerCase())}">`
      + `<dt><a href="${termPath(entry.key)}">${escapeHtml(entry.term)}</a></dt><dd>${escapeHtml(entry.body)}</dd></div>`
    )).join('');
    return `<section id="grupo-${group.id}" class="dictionary-group" data-dictionary-group><h2>${escapeHtml(group.title)}</h2><dl>${entries}</dl></section>`;
  }).join('');

  return `<main class="dictionary-page">${introMarkup()}
    <header class="dictionary-head">
      <p class="dictionary-kicker">Entenda antes do lance</p>
      <h1>Dicionário do leilão de imóveis</h1>
      <p>As palavras que aparecem nos leilões e na venda direta da Caixa, explicadas sem juridiquês.</p>
      <label class="dictionary-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Procure uma palavra: ITBI, matrícula, 2ª rodada…" aria-label="Procurar no dicionário" data-dictionary-search></label>
      <p class="dictionary-count" data-dictionary-count hidden></p>
    </header>
    <nav class="dictionary-index" aria-label="Assuntos" data-dictionary-index>${index}</nav>
    <p class="dictionary-empty" data-dictionary-empty hidden>Nenhuma palavra encontrada.</p>
    ${sections}${catalogInvite()}${dictionaryNote()}${stickyCatalogBar()}
  </main>`;
}

function termBody(key) {
  const entry = dictionaryEntry(key);
  const group = groupTitle(entry.group);
  const detail = entry.detail.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
  const checks = entry.checks.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const guidance = GROUP_GUIDANCE[entry.group];
  const sources = termSources(key)
    .map(source => `<li><a href="${escapeHtml(source.url)}" rel="external">${escapeHtml(source.title)}</a></li>`)
    .join('');
  const related = relatedEntries(key)
    .map(item => `<li><a href="${item.path}">${escapeHtml(item.term)}</a></li>`).join('');

  return `<main class="dictionary-page dictionary-term-page">${introMarkup()}
    <nav class="dictionary-crumbs" aria-label="Você está em"><a href="${DICTIONARY_PATH}">Dicionário</a><span aria-hidden="true">›</span><a href="${DICTIONARY_PATH}#grupo-${entry.group}">${escapeHtml(group)}</a></nav>
    <article class="dictionary-term-article">
      <header>
        <h1>${escapeHtml(entry.term)}</h1>
        <p class="dictionary-term-lead">${escapeHtml(entry.body)}</p>
        <p class="dictionary-byline">Por Equipe Argos · Revisão editorial e checagem de fontes · <time datetime="${UPDATED_AT}">Atualizado em 7 out 2026</time></p>
      </header>
      <section aria-labelledby="entenda-o-termo">
        <h2 id="entenda-o-termo">Como esse termo funciona na compra</h2>
        ${detail}
      </section>
      <section class="dictionary-practical" aria-labelledby="o-que-conferir">
        <h2 id="o-que-conferir">O que conferir nos documentos</h2>
        <ul>${checks}</ul>
      </section>
      <section class="dictionary-confirm" aria-labelledby="onde-confirmar">
        <h2 id="onde-confirmar">Onde confirmar esta informação</h2>
        <p>${escapeHtml(guidance.confirmation)}</p>
        <ul class="dictionary-sources">${sources}</ul>
        <p class="dictionary-related-guide"><b>Guia relacionado:</b> <a href="${guidance.article.path}">${escapeHtml(guidance.article.title)}</a></p>
      </section>
      <a class="dictionary-term-cta" href="${LEARN_URL}">Ver como o Argos explica os imóveis →</a>
    </article>
    ${related ? `<section class="dictionary-related"><h2>Outros termos de ${escapeHtml(group.toLowerCase())}</h2><ul>${related}</ul><a class="dictionary-all" href="${DICTIONARY_PATH}">Ver o dicionário completo</a></section>` : ''}
    ${catalogInvite()}${dictionaryNote()}${stickyCatalogBar()}
  </main>`;
}

function pageShell({ body, key, siteUrl }) {
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
  <meta property="og:type" content="${key ? 'article' : 'website'}">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Argos">
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${meta.canonical}">
  <meta name="theme-color" content="#FFFFFF">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  ${fontMarkup()}
  <link rel="stylesheet" href="/lp/styles.css">
  <link rel="stylesheet" href="/lp/dictionary.css">
  ${schemas}
</head>
<body class="dictionary-body">
${headerMarkup()}
${body}
${footerMarkup()}
<script src="/lp/dictionary.js" defer></script>
</body>
</html>`;
}

function buildDictionary({ root = ROOT, siteUrl = DEFAULT_SITE_URL } = {}) {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '');
  const output = path.join(root, 'dicionario');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'index.html'), pageShell({
    body: hubBody(),
    key: null,
    siteUrl: normalizedSiteUrl,
  }), 'utf8');

  const keys = Object.keys(GLOSSARY);
  for (const key of keys) {
    const termOutput = path.join(output, termSlug(key));
    fs.mkdirSync(termOutput, { recursive: true });
    fs.writeFileSync(path.join(termOutput, 'index.html'), pageShell({
      body: termBody(key),
      key,
      siteUrl: normalizedSiteUrl,
    }), 'utf8');
  }

  console.log(`  ✓ dicionario/index.html e ${keys.length} verbetes`);
  return dictionarySitemapPaths();
}

if (require.main === module) buildDictionary();

module.exports = {
  DICTIONARY_UPDATED_AT: UPDATED_AT,
  buildDictionary,
  dictionaryMeta,
  dictionarySitemapPaths,
  isIndexableTerm,
  termPath,
};
