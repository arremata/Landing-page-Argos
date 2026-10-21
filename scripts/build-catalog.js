// Páginas públicas dos imóveis da Caixa (/imoveis/caixa/...).
//
// Lê o catálogo público do app (GET /api/catalog, o mesmo que a plataforma usa)
// no build e grava HTML estático: um arquivo por imóvel, por cidade e por
// estado, mais o sitemap-imoveis.xml. Todo o conteúdo essencial sai no HTML
// inicial, sem depender de JavaScript, sessão ou login.
//
// As páginas geradas não entram no git (.gitignore): saem a cada build da
// Vercel. Um build diário (.github/workflows/catalogo-diario.yml) mantém
// preços, rodadas e retiradas em dia. Imóvel que sai do catálogo deixa de ser
// gerado e passa a responder 404, com a página 404.html apontando o catálogo.
//
// Fonte dos dados:
//   CATALOG_FIXTURE   arquivo JSON local (dev e testes), no formato da API
//   CATALOG_API_URL   padrão https://app.argosleiloes.com.br/api/catalog
// Em produção (VERCEL_ENV=production) ou com CATALOG_REQUIRED=1, falha de
// leitura ou catálogo pequeno demais derruba o build: a Vercel mantém no ar o
// deploy anterior em vez de publicar um catálogo vazio que tiraria os imóveis
// do índice do Google.

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'https://www.argosleiloes.com.br'
).replace(/\/+$/, '');
const APP_URL = (process.env.APP_URL || 'https://app.argosleiloes.com.br').replace(/\/+$/, '');
const CATALOG_API_URL = process.env.CATALOG_API_URL || `${APP_URL}/api/catalog`;
const BASE_PATH = '/imoveis/caixa/';
const PAGE_SIZE = 24;
// Cidade com menos imóveis que isto ganha página (navegação e breadcrumb), mas
// fica fora do índice e do sitemap: lista de um ou dois itens é conteúdo fino.
const MIN_INDEXABLE_CITY = 3;
const MIN_PRODUCTION_ITEMS = Number(process.env.CATALOG_MIN_ITEMS || 50);
const FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=optional';
const OFFICIAL_SITE = 'https://venda-imoveis.caixa.gov.br/';

const UF_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

// ---------------------------------------------------------------------------
// Texto e formatos
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Texto puro a partir de um trecho já escapado, para meta description.
function plainText(html) {
  return String(html).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const LOWER_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);
// A Caixa publica cidade e bairro em maiúsculas; a página mostra como nome próprio.
function titleCase(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ').split(' ')
    .map((word, index) => (index > 0 && LOWER_WORDS.has(word)) ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
function money(value) {
  return BRL.format(Math.round(value)).replace(/\u00a0/g, ' ');
}

function brDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function brDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

// "no Paraná", "na Bahia", "em São Paulo".
const UF_PREPOSITION = { AL: 'em', GO: 'em', MG: 'em', PE: 'em', RO: 'em', RR: 'em', SC: 'em', SP: 'em', SE: 'em', BA: 'na', PB: 'na' };
function inState(uf) {
  return `${UF_PREPOSITION[uf] || 'no'} ${UF_NAMES[uf]}`;
}

function plural(count, one, many) {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? one : many}`;
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

// ---------------------------------------------------------------------------
// Normalização do catálogo
// ---------------------------------------------------------------------------

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function isHttps(url) {
  return typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(url);
}

// Rótulo da modalidade como a home e o dicionário explicam.
function modalityOf(value) {
  const text = slugify(value);
  if (text.includes('sfi') || text.startsWith('leilao')) return { key: 'leilao', label: 'Leilão' };
  if (text.includes('licitacao')) return { key: 'licitacao', label: 'Licitação aberta' };
  if (text.includes('venda-direta') || text.includes('compra-direta')) return { key: 'venda-direta', label: 'Venda direta' };
  return { key: 'outra', label: value ? String(value) : 'Modalidade não informada' };
}

function normalizeProperty(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (String(raw.source || '').toLowerCase() !== 'caixa') return null;
  if (raw.status && raw.status !== 'active') return null;
  const id = Number(raw.id);
  const uf = String(raw.uf || '').trim().toUpperCase();
  const city = titleCase(raw.city);
  if (!Number.isInteger(id) || id <= 0 || !UF_NAMES[uf] || !city) return null;

  const type = String(raw.type || '').trim() || 'Imóvel';
  const citySlug = `${slugify(city)}-${uf.toLowerCase()}`;
  const modality = modalityOf(raw.modalidade);
  const rounds = [];
  if (modality.key === 'leilao') {
    for (const [number, at, price] of [[1, raw.firstAuctionAt, raw.firstAuctionPrice], [2, raw.secondAuctionAt, raw.secondAuctionPrice]]) {
      if (at || positive(price)) rounds.push({ number, at: at || null, price: positive(price) });
    }
  }
  const occupancy = ['occupied', 'vacant'].includes(raw.occupancy) ? raw.occupancy : 'unknown';
  return {
    id,
    sourceId: raw.sourceId ? String(raw.sourceId).trim() : '',
    uf,
    state: UF_NAMES[uf],
    stateSlug: slugify(UF_NAMES[uf]),
    city,
    citySlug,
    neighborhood: titleCase(raw.neighborhood),
    type,
    typeSlug: slugify(type) || 'imovel',
    area: positive(raw.area),
    beds: Number.isInteger(raw.beds) && raw.beds > 0 ? raw.beds : null,
    price: positive(raw.minBid),
    appraisal: positive(raw.appraisal),
    modality,
    praca: raw.praca || null,
    rounds,
    endsAt: raw.endsAt || null,
    occupancy,
    acceptsFgts: typeof raw.acceptsFgts === 'boolean' ? raw.acceptsFgts : null,
    acceptsFinancing: typeof raw.acceptsFinancing === 'boolean' ? raw.acceptsFinancing : null,
    photoUrl: isHttps(raw.photoUrl) ? raw.photoUrl : null,
    officialUrl: isHttps(raw.auctionUrl) ? raw.auctionUrl : null,
    itbiRate: positive(raw.itbiRate),
    itbiSource: raw.itbiSource ? String(raw.itbiSource) : '',
    itbiEstimated: raw.itbiEstimated !== false,
    path: `${BASE_PATH}${citySlug}/${slugify(type) || 'imovel'}-${id}/`,
  };
}

function normalizeCatalog(items) {
  if (!Array.isArray(items)) throw new Error('Catálogo inválido: a API não devolveu uma lista');
  const seen = new Set();
  const properties = [];
  for (const raw of items) {
    const property = normalizeProperty(raw);
    if (!property || seen.has(property.id)) continue;
    seen.add(property.id);
    properties.push(property);
  }
  return properties;
}

// ---------------------------------------------------------------------------
// Textos derivados (sempre a partir dos campos oficiais)
// ---------------------------------------------------------------------------

function placeOf(p) {
  return p.neighborhood ? `${p.neighborhood}, ${p.city}/${p.uf}` : `${p.city}/${p.uf}`;
}

function sizeOf(p) {
  const parts = [];
  if (p.area) parts.push(`${p.area.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m²`);
  if (p.beds) parts.push(plural(p.beds, 'quarto', 'quartos'));
  return parts.join(', ');
}

function discountOf(p) {
  if (!p.price || !p.appraisal) return null;
  return Math.round(((p.appraisal - p.price) / p.appraisal) * 100);
}

function occupancyLabel(p) {
  return { occupied: 'Ocupado', vacant: 'Desocupado', unknown: 'Ocupação não informada' }[p.occupancy];
}

function paymentLabel(value, yes, no) {
  if (value === true) return yes;
  if (value === false) return no;
  return null;
}

function headingOf(p) {
  const size = p.area ? ` de ${p.area.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m²` : '';
  const where = p.neighborhood ? ` no bairro ${p.neighborhood}, ${p.city}/${p.uf}` : ` em ${p.city}/${p.uf}`;
  return `${p.type}${size}${where}`;
}

function descriptionOf(p) {
  const size = sizeOf(p);
  const price = p.price ? ` por ${money(p.price)}` : '';
  const appraisal = p.appraisal ? ` (avaliação de ${money(p.appraisal)})` : '';
  return `${p.type}${size ? ` de ${size}` : ''} em ${placeOf(p)}, à venda pela Caixa em ${p.modality.label.toLowerCase()}${price}${appraisal}. Veja ocupação, FGTS, financiamento e custos estimados. Confirme as condições no site da Caixa.`;
}

function summaryOf(p) {
  const sentences = [];
  const size = sizeOf(p);
  sentences.push(`${p.type}${size ? ` com ${size}` : ''}, localizado em ${placeOf(p)}.`);
  sentences.push(`A Caixa oferece o imóvel na modalidade ${p.modality.label.toLowerCase()}${p.price ? `, com valor mínimo de ${money(p.price)}` : ''}${p.appraisal ? ` e valor de avaliação de ${money(p.appraisal)}` : ''}.`);
  const occupancy = { occupied: 'A Caixa informa que o imóvel está ocupado.', vacant: 'A Caixa informa que o imóvel está desocupado.', unknown: 'A Caixa não informou a situação de ocupação.' }[p.occupancy];
  sentences.push(occupancy);
  const payment = [paymentLabel(p.acceptsFinancing, 'aceita financiamento', 'não aceita financiamento'), paymentLabel(p.acceptsFgts, 'aceita FGTS', 'não aceita FGTS')].filter(Boolean);
  if (payment.length) sentences.push(`Segundo a Caixa, o imóvel ${payment.join(' e ')}.`);
  return sentences.join(' ');
}

// ---------------------------------------------------------------------------
// Layout comum
// ---------------------------------------------------------------------------

function layout({ title, description, canonical, robots = 'index, follow', body, schema, ogImage, ogType = 'website', pageView, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Argos">
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">\n` : ''}<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${FONT_STYLESHEET}" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="${FONT_STYLESHEET}" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/lp/styles.css">
<link rel="stylesheet" href="/lp/client-first.css">
<link rel="stylesheet" href="/lp/imoveis.css">
${extraHead}${schema ? jsonLd(schema) : ''}
</head>
<body${pageView ? ` data-evento="${pageView}"` : ''}>
<header class="imoveis_nav">
  <div class="padding-global">
    <div class="container-large imoveis_nav-inner">
      <a href="/" class="logo"><span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt="" width="32" height="32"></span><span class="logo-word">Argos</span></a>
      <nav class="imoveis_nav-links" aria-label="Navegação principal">
        <a href="${BASE_PATH}">Imóveis da Caixa</a>
        <a href="/como-funciona/">Como funciona</a>
        <a href="/blog/" class="is-desktop">Guias</a>
        <a href="/contato/" class="is-desktop" data-evento-clique="click_assistance">Assistência</a>
      </nav>
    </div>
  </div>
</header>
<main class="imoveis_page">
${body}
</main>
<footer class="imoveis_footer">
  <div class="padding-global">
    <div class="container-large">
      <p class="text-size-small text-color-muted">O Argos é independente e não tem vínculo com a Caixa Econômica Federal. Os dados dos imóveis vêm do <a href="${OFFICIAL_SITE}" rel="noopener" target="_blank">site oficial de venda de imóveis da Caixa</a>; preço, disponibilidade e condições devem ser confirmados no canal oficial antes de qualquer proposta.</p>
      <nav class="imoveis_footer-links" aria-label="Institucional">
        <a href="/sobre/">Sobre</a>
        <a href="/como-funciona/">Como funciona</a>
        <a href="/metodologia/">Metodologia dos custos</a>
        <a href="/contato/">Contato</a>
        <a href="/privacidade/">Privacidade</a>
        <a href="/termos/">Termos de uso</a>
      </nav>
      <p class="text-size-small text-color-muted">&copy; ${new Date().getFullYear()} Argos.</p>
    </div>
  </div>
</footer>
<script src="/lp/medicao.js" defer></script>
</body>
</html>
`;
}

function breadcrumbs(items) {
  const html = `<nav class="imoveis_breadcrumb" aria-label="Você está em"><ol>${items.map((item, index) =>
    index === items.length - 1
      ? `<li><span aria-current="page">${escapeHtml(item.name)}</span></li>`
      : `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a></li>`).join('')}</ol></nav>`;
  const schema = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: `${SITE_URL}${item.path}` })),
  };
  return { html, schema };
}

function sourceNote(updatedLabel) {
  return `<p class="text-size-small text-color-muted imoveis_source">Fonte: <a href="${OFFICIAL_SITE}" rel="noopener" target="_blank">site de venda de imóveis da Caixa</a>, consultado pelo Argos em ${escapeHtml(updatedLabel)}. Preço, disponibilidade e condições podem mudar: confirme no canal oficial da Caixa.</p>`;
}

function propertyCard(p) {
  const discount = discountOf(p);
  const tags = [`<span class="tag is-neutral">${escapeHtml(p.modality.label)}</span>`];
  if (p.occupancy === 'vacant') tags.push('<span class="tag is-success">Desocupado</span>');
  if (p.occupancy === 'occupied') tags.push('<span class="tag is-warning">Ocupado</span>');
  if (p.acceptsFgts) tags.push('<span class="tag is-brand">Aceita FGTS</span>');
  const size = sizeOf(p);
  return `<li class="card is-hoverable imoveis_card">
  <a class="imoveis_card-link" href="${p.path}">
    <span class="imoveis_card-kind">${escapeHtml(p.type)}${size ? ` · ${escapeHtml(size)}` : ''}</span>
    <span class="imoveis_card-place">${escapeHtml(placeOf(p))}</span>
    <span class="imoveis_card-price heading-style-h4">${p.price ? money(p.price) : 'Valor não informado'}</span>
    ${p.appraisal ? `<span class="imoveis_card-note">Avaliação ${money(p.appraisal)}${discount > 0 ? ` · ${discount}% abaixo` : ''}</span>` : ''}
  </a>
  <div class="imoveis_card-tags">${tags.join('')}</div>
</li>`;
}

const ARROW = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const ARROW_LEFT = ARROW('m15 6-6 6 6 6');
const ARROW_RIGHT = ARROW('m9 6 6 6-6 6');

function pagination(basePath, page, pages) {
  if (pages <= 1) return '';
  const href = n => (n === 1 ? basePath : `${basePath}pagina/${n}/`);
  const links = [];
  if (page > 1) links.push(`<a class="button is-secondary is-small" href="${href(page - 1)}" rel="prev">${ARROW_LEFT}Anterior</a>`);
  links.push(`<span class="text-size-small text-color-muted">Página ${page} de ${pages}</span>`);
  if (page < pages) links.push(`<a class="button is-secondary is-small" href="${href(page + 1)}" rel="next">Próxima${ARROW_RIGHT}</a>`);
  const all = Array.from({ length: pages }, (_, i) => i + 1)
    .map(n => (n === page ? `<li><span aria-current="page">${n}</span></li>` : `<li><a href="${href(n)}">${n}</a></li>`)).join('');
  return `<nav class="imoveis_pagination" aria-label="Páginas da lista"><div class="imoveis_pagination-steps">${links.join('')}</div><ol class="imoveis_pagination-all">${all}</ol></nav>`;
}

function section(name, content, background = 'primary', size = 'medium') {
  return `<section class="section_${name} background-color-${background}">
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-section-${size}">
${content}
      </div>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Páginas
// ---------------------------------------------------------------------------

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) || 0) + 1);
  return counts;
}

function modalitySummary(items) {
  const counts = countBy(items, p => p.modality.label);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => `${label}: ${count.toLocaleString('pt-BR')}`).join(' · ');
}

function renderProperty(p, ctx) {
  const url = `${SITE_URL}${p.path}`;
  const crumbs = breadcrumbs([
    { name: 'Início', path: '/' },
    { name: 'Imóveis da Caixa', path: BASE_PATH },
    { name: p.state, path: `${BASE_PATH}${p.stateSlug}/` },
    { name: `${p.city}/${p.uf}`, path: `${BASE_PATH}${p.citySlug}/` },
    { name: `${p.type} ${p.id}`, path: p.path },
  ]);
  const discount = discountOf(p);
  const heading = headingOf(p);
  const title = ctx.titles.get(p.id);
  const description = descriptionOf(p);

  const facts = [
    ['Tipo', p.type],
    ['Área', p.area ? `${p.area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²` : 'Não informada'],
    ['Quartos', p.beds ? String(p.beds) : 'Não informado'],
    ['Bairro', p.neighborhood || 'Não informado'],
    ['Cidade', `${p.city}/${p.uf}`],
    ['Modalidade de venda', p.modality.label],
    ['Ocupação', occupancyLabel(p)],
    ['Financiamento', paymentLabel(p.acceptsFinancing, 'Aceita', 'Não aceita') || 'Não informado'],
    ['FGTS', paymentLabel(p.acceptsFgts, 'Aceita', 'Não aceita') || 'Não informado'],
  ];
  if (p.sourceId) facts.push(['Número do imóvel na Caixa', p.sourceId]);

  const roundRows = p.rounds.map(round => {
    const past = round.at && new Date(round.at).getTime() < ctx.now.getTime();
    return `<li><span>${round.number}ª rodada${round.at ? ` · ${brDateTime(round.at)}` : ''}${past ? ' (encerrada)' : ''}</span><strong>${round.price ? money(round.price) : 'Valor não informado'}</strong></li>`;
  }).join('');
  const singleDate = !p.rounds.length && p.endsAt
    ? `<p class="text-size-small text-color-secondary">Data informada pela Caixa: ${brDateTime(p.endsAt)}${new Date(p.endsAt).getTime() < ctx.now.getTime() ? ' (já passou)' : ''}.</p>`
    : '';

  const itbi = p.price && p.itbiRate ? Math.round(p.price * p.itbiRate) : null;
  const itbiNote = p.itbiEstimated
    ? 'Estimativa inicial de planejamento. A alíquota e a base de cálculo variam por município: confirme na prefeitura.'
    : p.itbiSource;

  const photo = p.photoUrl
    ? `<img class="imovel_photo" src="${escapeHtml(p.photoUrl)}" alt="Foto do imóvel publicada pela Caixa: ${escapeHtml(p.type.toLowerCase())} em ${escapeHtml(placeOf(p))}" width="640" height="480" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer" onerror="this.remove()">`
    : '';

  const official = p.officialUrl
    ? `<a class="button" href="${escapeHtml(p.officialUrl)}" target="_blank" rel="noopener" data-evento-clique="click_official_listing">Ver anúncio oficial na Caixa</a>`
    : `<a class="button" href="${OFFICIAL_SITE}" target="_blank" rel="noopener" data-evento-clique="click_official_listing">Buscar no site da Caixa</a>`;

  const body = section('imovel', `
        ${crumbs.html}
        <div class="imovel_component">
          <div class="imovel_main">
            <span class="tag is-brand">${escapeHtml(p.modality.label)} · Imóvel da Caixa</span>
            <h1 class="heading-style-h2 imovel_title">${escapeHtml(heading)}</h1>
            <p class="text-size-medium text-color-secondary">${escapeHtml(summaryOf(p))}</p>
            ${photo}
          </div>
          <aside class="card imovel_price" aria-label="Valores">
            <p class="text-size-small text-color-muted">${p.rounds.length ? 'Valor mínimo da rodada vigente' : 'Valor mínimo de venda'}</p>
            <p class="imovel_price-value heading-style-h3">${p.price ? money(p.price) : 'Não informado'}</p>
            ${p.appraisal ? `<p class="text-size-small text-color-secondary">Valor de avaliação da Caixa: <strong>${money(p.appraisal)}</strong></p>` : ''}
            ${discount !== null ? `<p class="text-size-small text-color-secondary">${discount > 0 ? `${discount}% abaixo do valor de avaliação` : discount < 0 ? `${Math.abs(discount)}% acima do valor de avaliação` : 'Igual ao valor de avaliação'}</p>` : ''}
            ${roundRows ? `<ul class="imovel_rounds">${roundRows}</ul>` : ''}
            ${singleDate}
            <div class="imovel_actions">
              ${official}
              <a class="button is-secondary" href="${APP_URL}/imovel/${p.id}">Ver a conta completa no Argos</a>
              <a class="button is-text" href="/contato/" data-evento-clique="click_assistance">Quero assistência para este imóvel</a>
            </div>
          </aside>
          <div class="imovel_details">
            <h2 class="heading-style-h4">Ficha do imóvel</h2>
            <dl class="imovel_facts">${facts.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
          </div>
        </div>`);

  const costs = section('custos', `
        <div class="max-width-small">
          <h2 class="heading-style-h3">Custos além do valor do imóvel</h2>
          <p class="text-size-regular text-color-secondary">O valor mínimo não é o preço final. A compra também envolve imposto de transmissão (ITBI), registro em cartório e, conforme o caso, comissão, desocupação e reforma.</p>
          ${itbi ? `<div class="card imovel_cost"><p><span>ITBI estimado (${(p.itbiRate * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% sobre ${money(p.price)})</span><strong>${money(itbi)}</strong></p><p class="text-size-small text-color-muted">${escapeHtml(itbiNote)}</p></div>` : ''}
          <p class="text-size-regular text-color-secondary">A conta completa até a entrega das chaves fica na análise do Argos. Veja como cada valor é estimado na <a href="/metodologia/">metodologia de custos</a>. Estimativa não é cotação.</p>
          ${sourceNote(ctx.updatedLabel)}
          <p class="text-size-small text-color-muted">Veja outros <a href="${BASE_PATH}${p.citySlug}/">imóveis da Caixa em ${escapeHtml(p.city)}/${p.uf}</a> ou entenda as <a href="/como-funciona/#modalidades">diferenças entre leilão, licitação aberta e venda direta</a>.</p>
        </div>`, 'secondary');

  const place = {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.city,
      addressRegion: p.uf,
      addressCountry: 'BR',
    },
  };
  const residence = /apartamento/i.test(p.type) ? 'Apartment' : /casa|sobrado/i.test(p.type) ? 'House' : 'Place';
  const item = {
    '@type': residence,
    name: heading,
    address: place.address,
  };
  if (p.area && residence !== 'Place') item.floorSize = { '@type': 'QuantitativeValue', value: p.area, unitCode: 'MTK' };
  if (p.beds && residence !== 'Place') item.numberOfBedrooms = p.beds;
  const listing = {
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    url,
    name: heading,
    description,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: item,
    breadcrumb: crumbs.schema,
  };
  if (p.photoUrl) listing.image = p.photoUrl;
  if (p.price) {
    listing.offers = {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'BRL',
      seller: { '@type': 'Organization', name: 'Caixa Econômica Federal' },
    };
    if (p.officialUrl) listing.offers.url = p.officialUrl;
  }

  return layout({
    title,
    description,
    canonical: url,
    body: body + costs,
    schema: { '@context': 'https://schema.org', '@graph': [listing] },
    ogImage: p.photoUrl,
    pageView: 'view_property',
  });
}

function renderList({ heading, intro, basePath, items, page, pages, crumbs, robots, ctx, extra = '' }) {
  const canonicalPath = page === 1 ? basePath : `${basePath}pagina/${page}/`;
  const url = `${SITE_URL}${canonicalPath}`;
  const slice = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const crumbHtml = breadcrumbs(crumbs);
  const titleSuffix = page > 1 ? ` (página ${page})` : '';
  const body = section('lista', `
        ${crumbHtml.html}
        <div class="section_header max-width-small">
          <h1 class="heading-style-h2">${escapeHtml(heading)}${titleSuffix}</h1>
          <p class="text-size-medium text-color-secondary">${intro}</p>
        </div>
        ${extra}
        <ol class="imoveis_list">${slice.map(propertyCard).join('\n')}</ol>
        ${pagination(basePath, page, pages)}
        ${sourceNote(ctx.updatedLabel)}`);
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [{
      '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: `${heading}${titleSuffix}`, inLanguage: 'pt-BR',
      isPartOf: { '@id': `${SITE_URL}/#website` }, breadcrumb: crumbHtml.schema,
      mainEntity: {
        '@type': 'ItemList', numberOfItems: items.length,
        itemListElement: slice.map((p, index) => ({ '@type': 'ListItem', position: (page - 1) * PAGE_SIZE + index + 1, url: `${SITE_URL}${p.path}`, name: headingOf(p) })),
      },
    }],
  };
  return {
    path: canonicalPath,
    html: layout({
      title: `${heading}${titleSuffix} | Argos`,
      description: plainText(intro).slice(0, 300),
      canonical: url,
      robots,
      body,
      schema,
      pageView: 'view_search_results',
    }),
  };
}

function cityPages(cityItems, ctx) {
  const first = cityItems[0];
  const basePath = `${BASE_PATH}${first.citySlug}/`;
  const pages = Math.max(1, Math.ceil(cityItems.length / PAGE_SIZE));
  const indexable = cityItems.length >= MIN_INDEXABLE_CITY;
  const robots = indexable ? 'index, follow' : 'noindex, follow';
  const neighborhoods = [...countBy(cityItems.filter(p => p.neighborhood), p => p.neighborhood).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR')).slice(0, 12);
  const prices = cityItems.map(p => p.price).filter(Boolean).sort((a, b) => a - b);
  const intro = `${plural(cityItems.length, 'imóvel da Caixa à venda', 'imóveis da Caixa à venda')} em ${escapeHtml(first.city)}/${first.uf}${prices.length ? `, com valores mínimos entre ${money(prices[0])} e ${money(prices[prices.length - 1])}` : ''}. ${escapeHtml(modalitySummary(cityItems))}.`;
  const extra = neighborhoods.length > 1
    ? `<p class="text-size-small text-color-secondary imoveis_facets">Bairros com mais imóveis: ${neighborhoods.map(([name, count]) => `${escapeHtml(name)} (${count})`).join(', ')}.</p>`
    : '';
  const crumbs = [
    { name: 'Início', path: '/' },
    { name: 'Imóveis da Caixa', path: BASE_PATH },
    { name: first.state, path: `${BASE_PATH}${first.stateSlug}/` },
    { name: `${first.city}/${first.uf}`, path: basePath },
  ];
  const sorted = [...cityItems].sort(sortProperties);
  const out = [];
  for (let page = 1; page <= pages; page++) {
    out.push({ ...renderList({ heading: `Imóveis da Caixa em ${first.city}/${first.uf}`, intro, basePath, items: sorted, page, pages, crumbs, robots, ctx, extra: page === 1 ? extra : '' }), indexable });
  }
  return out;
}

// Ordem estável e útil: maior desconto primeiro, depois menor preço e id.
function sortProperties(a, b) {
  const da = discountOf(a) ?? -Infinity;
  const db = discountOf(b) ?? -Infinity;
  return db - da || (a.price || Infinity) - (b.price || Infinity) || a.id - b.id;
}

function cityLinks(cities) {
  return `<ul class="imoveis_places">${cities.map(c => `<li><a href="${BASE_PATH}${c.slug}/">${escapeHtml(c.name)}</a><span class="text-size-small text-color-muted">${plural(c.count, 'imóvel', 'imóveis')}</span></li>`).join('')}</ul>`;
}

function renderState(stateItems, cities, ctx) {
  const first = stateItems[0];
  const basePath = `${BASE_PATH}${first.stateSlug}/`;
  const url = `${SITE_URL}${basePath}`;
  const crumbs = breadcrumbs([
    { name: 'Início', path: '/' },
    { name: 'Imóveis da Caixa', path: BASE_PATH },
    { name: first.state, path: basePath },
  ]);
  const heading = `Imóveis da Caixa ${inState(first.uf)}`;
  const intro = `${plural(stateItems.length, 'imóvel da Caixa à venda', 'imóveis da Caixa à venda')} em ${plural(cities.length, 'cidade', 'cidades')} do estado. ${escapeHtml(modalitySummary(stateItems))}.`;
  const highlights = [...stateItems].sort(sortProperties).slice(0, 12);
  const body = section('estado', `
        ${crumbs.html}
        <div class="section_header max-width-small">
          <h1 class="heading-style-h2">${escapeHtml(heading)}</h1>
          <p class="text-size-medium text-color-secondary">${intro}</p>
        </div>
        <h2 class="heading-style-h4">Cidades</h2>
        ${cityLinks(cities)}
        <h2 class="heading-style-h4 imoveis_list-title">Maiores diferenças para a avaliação</h2>
        <ol class="imoveis_list">${highlights.map(propertyCard).join('\n')}</ol>
        ${sourceNote(ctx.updatedLabel)}`);
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: heading, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE_URL}/#website` }, breadcrumb: crumbs.schema }],
  };
  return {
    path: basePath,
    html: layout({ title: `${heading} | Argos`, description: plainText(intro), canonical: url, body, schema, pageView: 'view_search_results' }),
  };
}

function renderRoot(states, topCities, total, ctx) {
  const url = `${SITE_URL}${BASE_PATH}`;
  const crumbs = breadcrumbs([{ name: 'Início', path: '/' }, { name: 'Imóveis da Caixa', path: BASE_PATH }]);
  const empty = total === 0;
  const body = section('catalogo', `
        ${crumbs.html}
        <div class="section_header max-width-small">
          <h1 class="heading-style-h2">Imóveis da Caixa à venda</h1>
          <p class="text-size-medium text-color-secondary">${empty
            ? 'O catálogo está sendo atualizado. Enquanto isso, consulte os imóveis diretamente no site oficial da Caixa.'
            : `Busque, de graça, ${plural(total, 'imóvel', 'imóveis')} vendidos pela Caixa em leilão, licitação aberta e venda direta. Para cada um: valor mínimo, valor de avaliação, ocupação, FGTS, financiamento e estimativa de custos.`}</p>
          <p class="text-size-small text-color-muted">O Argos não é a Caixa. Os dados vêm do site oficial de venda de imóveis da Caixa e devem ser confirmados lá.</p>
        </div>
        ${empty ? `<a class="button" href="${OFFICIAL_SITE}" target="_blank" rel="noopener" data-evento-clique="click_official_listing">Abrir o site da Caixa</a>` : `
        <h2 class="heading-style-h4">Estados</h2>
        ${cityLinks(states)}
        <h2 class="heading-style-h4 imoveis_list-title">Cidades com mais imóveis</h2>
        ${cityLinks(topCities)}`}
        ${sourceNote(ctx.updatedLabel)}`);
  const howTo = section('antes', `
        <div class="max-width-small">
          <h2 class="heading-style-h3">Antes de fazer uma proposta</h2>
          <p class="text-size-regular text-color-secondary">Confira a modalidade de venda, a situação de ocupação, as formas de pagamento e os custos além do valor do imóvel. O <a href="/como-funciona/">guia Como funciona</a> explica cada etapa, e a <a href="/recursos/checklist-antes-do-lance/">lista de verificação antes do lance</a> pode ser impressa.</p>
          <div class="imovel_actions">
            <a class="button is-secondary" href="/como-funciona/">Entender como funciona</a>
            <a class="button is-text" href="/contato/" data-evento-clique="click_assistance">Conhecer a assistência opcional</a>
          </div>
        </div>`, 'secondary');
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: 'Imóveis da Caixa à venda', inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE_URL}/#website` }, breadcrumb: crumbs.schema }],
  };
  return {
    path: BASE_PATH,
    html: layout({
      title: 'Imóveis da Caixa à venda: busca gratuita por cidade | Argos',
      description: 'Encontre imóveis da Caixa por estado e cidade, sem assinatura: valor mínimo, avaliação, ocupação, FGTS, financiamento e custos estimados. Confirme no site oficial da Caixa.',
      canonical: url,
      robots: empty ? 'noindex, follow' : 'index, follow',
      body: body + howTo,
      schema,
      pageView: 'view_search_results',
    }),
  };
}

// Títulos únicos: anúncios iguais na mesma rua ganham o número do imóvel.
function buildTitles(properties) {
  const base = new Map();
  for (const p of properties) {
    const size = p.area ? ` ${p.area.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m²` : '';
    const where = p.neighborhood ? `${p.neighborhood}, ${p.city}/${p.uf}` : `${p.city}/${p.uf}`;
    base.set(p.id, `${p.type}${size} em ${where}${p.price ? ` por ${money(p.price)}` : ''}`);
  }
  const counts = countBy(properties, p => base.get(p.id));
  const titles = new Map();
  for (const p of properties) {
    const text = base.get(p.id);
    titles.set(p.id, `${text}${counts.get(text) > 1 ? ` · nº ${p.sourceId || p.id}` : ''} | Imóvel Caixa | Argos`);
  }
  return titles;
}

function sitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${escapeHtml(u.loc)}</loc>\n  </url>`).join('\n')}
</urlset>
`;
}

// Gera todas as páginas em memória: { files: Map(path -> html), sitemap }.
function renderCatalog(properties, { now = new Date() } = {}) {
  const ctx = {
    now,
    updatedLabel: brDate(now.toISOString()),
    titles: buildTitles(properties),
  };
  const files = new Map();
  const sitemap = [];
  const add = (page, indexable = true) => {
    if (files.has(page.path)) throw new Error(`Rota duplicada no catálogo: ${page.path}`);
    files.set(page.path, page.html);
    // Sem lastmod: a API não informa quando cada anúncio mudou, e a data do
    // build mudaria todo dia sem mudança real, o que faz o Google ignorá-la.
    if (indexable) sitemap.push({ loc: `${SITE_URL}${page.path}` });
  };

  const byState = new Map();
  const byCity = new Map();
  for (const p of properties) {
    if (!byState.has(p.uf)) byState.set(p.uf, []);
    byState.get(p.uf).push(p);
    if (!byCity.has(p.citySlug)) byCity.set(p.citySlug, []);
    byCity.get(p.citySlug).push(p);
  }
  const cityEntry = items => ({ slug: items[0].citySlug, name: `${items[0].city}/${items[0].uf}`, count: items.length });
  const byCount = (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR');

  const states = [...byState.values()].map(items => ({ slug: items[0].stateSlug, name: items[0].state, count: items.length })).sort(byCount);
  const topCities = [...byCity.values()].map(cityEntry).sort(byCount).slice(0, 24);
  add(renderRoot(states, topCities, properties.length, ctx), properties.length > 0);

  for (const items of byState.values()) {
    const cities = [...byCity.values()].filter(c => c[0].uf === items[0].uf).map(cityEntry).sort(byCount);
    add(renderState(items, cities, ctx));
  }
  for (const items of byCity.values()) {
    for (const page of cityPages(items, ctx)) add(page, page.indexable);
  }
  for (const p of properties) add({ path: p.path, html: renderProperty(p, ctx) });

  return { files, sitemap: sitemapXml(sitemap), urls: sitemap.map(u => u.loc) };
}

function writeCatalog({ files, sitemap }, root = ROOT) {
  const outDir = path.join(root, 'imoveis');
  fs.rmSync(outDir, { recursive: true, force: true });
  for (const [pagePath, html] of files) {
    const dir = path.join(root, pagePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  fs.writeFileSync(path.join(root, 'sitemap-imoveis.xml'), sitemap);
}

// ---------------------------------------------------------------------------
// Leitura do catálogo
// ---------------------------------------------------------------------------

async function fetchCatalog(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'argos-site-build' }, signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 3000));
    }
  }
  throw new Error(`Falha ao ler ${url}: ${lastError && lastError.message}`);
}

async function loadCatalog() {
  if (process.env.CATALOG_FIXTURE) {
    return JSON.parse(fs.readFileSync(path.resolve(ROOT, process.env.CATALOG_FIXTURE), 'utf8'));
  }
  return fetchCatalog(CATALOG_API_URL);
}

async function main() {
  const required = process.env.VERCEL_ENV === 'production' || process.env.CATALOG_REQUIRED === '1';
  let properties;
  try {
    properties = normalizeCatalog(await loadCatalog());
    if (required && properties.length < MIN_PRODUCTION_ITEMS) {
      throw new Error(`catálogo com ${properties.length} imóveis, abaixo do mínimo de ${MIN_PRODUCTION_ITEMS}`);
    }
  } catch (error) {
    if (required) {
      console.error(`✗ Catálogo indisponível: ${error.message}. Build interrompido para manter o deploy anterior.`);
      process.exit(1);
    }
    console.warn(`! Catálogo indisponível (${error.message}). Gerando só a página de catálogo vazia, fora do índice.`);
    properties = [];
  }
  const result = renderCatalog(properties);
  writeCatalog(result);
  console.log(`  ✓ imoveis/caixa: ${properties.length} imóveis, ${result.files.size} páginas, ${result.urls.length} no sitemap-imoveis.xml`);
}

if (require.main === module) main();

module.exports = { normalizeCatalog, normalizeProperty, renderCatalog, writeCatalog, slugify, titleCase, modalityOf, BASE_PATH, MIN_INDEXABLE_CITY };
