const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { normalizeCatalog, renderCatalog, writeCatalog, titleCase, modalityOf } = require('../scripts/build-catalog');

const SITE = 'https://www.argosleiloes.com.br';
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/catalogo.json'), 'utf8'));
const properties = normalizeCatalog(raw);
const NOW = new Date('2026-10-21T12:00:00-03:00');
const { files, sitemap, urls } = renderCatalog(properties, { now: NOW });
const page = p => files.get(p);
const schemaOf = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));

test('só imóveis ativos da Caixa com cidade e UF válidas viram página', () => {
  const ids = properties.map(p => p.id).sort((a, b) => a - b);
  assert.deepEqual(ids, [101, 102, 103, 104, 201, 301, 404]);
  for (const id of [401, 402, 403]) {
    assert.ok(![...files.keys()].some(p => p.endsWith(`-${id}/`)), `id ${id} não pode ser publicado`);
  }
});

test('URL do imóvel é estável: cidade-uf, tipo e id, sem parâmetros', () => {
  assert.ok(files.has('/imoveis/caixa/curitiba-pr/apartamento-101/'));
  assert.ok(files.has('/imoveis/caixa/sao-jose-dos-campos-sp/terreno-301/'));
  for (const route of files.keys()) assert.match(route, /^\/imoveis\/caixa\/([a-z0-9-]+\/)*$/);
});

test('HTML inicial do imóvel traz título, local, tipo, preço, modalidade, foto, fonte e aviso', () => {
  const html = page('/imoveis/caixa/curitiba-pr/apartamento-101/');
  assert.match(html, /<title>Apartamento 52 m² em Portao, Curitiba\/PR por R\$ 180\.000 \| Imóvel Caixa \| Argos<\/title>/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<h1[^>]*>Apartamento de 52 m² no bairro Portao, Curitiba\/PR<\/h1>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.argosleiloes\.com\.br\/imoveis\/caixa\/curitiba-pr\/apartamento-101\/">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /<meta name="description" content="[^"]{80,}">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/venda-imoveis\.caixa\.gov\.br\/fotos\/F878770875359421\.jpg">/);
  assert.match(html, /R\$ 180\.000/);
  assert.match(html, /Valor de avaliação da Caixa: <strong>R\$ 290\.000/);
  assert.match(html, /38% abaixo do valor de avaliação/);
  assert.match(html, /1ª rodada · 01\/10\/2026, 10:00 \(encerrada\)/);
  assert.match(html, /2ª rodada · 05\/11\/2026, 10:00/);
  assert.match(html, /A Caixa informa que o imóvel está ocupado\./);
  assert.match(html, /href="https:\/\/venda-imoveis\.caixa\.gov\.br\/sistema\/detalhe-imovel\.asp\?hdnimovel=8787708753594"[^>]*data-evento-clique="click_official_listing"/);
  assert.match(html, /consultado pelo Argos em 21\/10\/2026/);
  assert.match(html, /confirme no canal oficial da Caixa/);
  assert.match(html, /não tem vínculo com a Caixa Econômica Federal/);
  assert.match(html, /ITBI estimado \(2,7% sobre R\$ 180\.000\)/);
  assert.match(html, /data-evento="view_property"/);
  // Rua e número não são publicados: o anúncio oficial tem o endereço completo.
  assert.doesNotMatch(html, /RUA EXEMPLO/i);
});

test('dados estruturados são fiéis: listing, oferta da Caixa e breadcrumb, sem nota nem disponibilidade inventadas', () => {
  const [graph] = schemaOf(page('/imoveis/caixa/curitiba-pr/apartamento-101/'));
  const listing = graph['@graph'][0];
  assert.equal(listing['@type'], 'RealEstateListing');
  assert.equal(listing.url, `${SITE}/imoveis/caixa/curitiba-pr/apartamento-101/`);
  assert.equal(listing.about['@type'], 'Apartment');
  assert.equal(listing.about.address.addressLocality, 'Curitiba');
  assert.equal(listing.about.floorSize.value, 52);
  assert.equal(listing.offers.price, 180000);
  assert.equal(listing.offers.priceCurrency, 'BRL');
  assert.equal(listing.offers.seller.name, 'Caixa Econômica Federal');
  assert.equal(listing.breadcrumb['@type'], 'BreadcrumbList');
  assert.deepEqual(listing.breadcrumb.itemListElement.map(i => i.name), ['Início', 'Imóveis da Caixa', 'Paraná', 'Curitiba/PR', 'Apartamento 101']);
  const text = JSON.stringify(graph);
  assert.doesNotMatch(text, /aggregateRating|review|availability|priceValidUntil|dateModified/);
});

test('valores ausentes ou inseguros não viram oferta nem link', () => {
  const html = page('/imoveis/caixa/curitiba-pr/loja-404/');
  assert.match(html, /Valor mínimo de venda<\/p>\s*<p class="imovel_price-value">Não informado/);
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /http:\/\/inseguro/);
  const [graph] = schemaOf(html);
  assert.equal(graph['@graph'][0].offers, undefined);
  assert.match(html, /href="https:\/\/venda-imoveis\.caixa\.gov\.br\/"[^>]*>Buscar no site da Caixa/);
});

test('avaliação abaixo do preço aparece como acima, sem desconto falso', () => {
  const html = page('/imoveis/caixa/sao-jose-dos-campos-sp/terreno-301/');
  assert.match(html, /6% acima do valor de avaliação/);
  assert.doesNotMatch(html, /abaixo do valor de avaliação/);
  assert.match(html, /Estimativa inicial de planejamento/);
});

test('títulos de imóveis são únicos mesmo com anúncios idênticos', () => {
  const titles = [...files.entries()].filter(([p]) => /-\d+\/$/.test(p)).map(([, html]) => html.match(/<title>(.*?)<\/title>/)[1]);
  assert.equal(new Set(titles).size, titles.length);
  assert.match(page('/imoveis/caixa/curitiba-pr/apartamento-103/'), /nº 1444400012346/);
});

test('cidade com poucos imóveis tem página navegável, mas fica fora do índice e do sitemap', () => {
  const londrina = page('/imoveis/caixa/londrina-pr/');
  assert.match(londrina, /<meta name="robots" content="noindex, follow">/);
  assert.ok(!urls.includes(`${SITE}/imoveis/caixa/londrina-pr/`));
  const curitiba = page('/imoveis/caixa/curitiba-pr/');
  assert.match(curitiba, /<meta name="robots" content="index, follow">/);
  assert.ok(urls.includes(`${SITE}/imoveis/caixa/curitiba-pr/`));
  assert.match(curitiba, /href="\/imoveis\/caixa\/curitiba-pr\/apartamento-101\/"/);
  assert.match(curitiba, /data-evento="view_search_results"/);
  assert.equal(schemaOf(curitiba)[0]['@graph'][0].mainEntity.numberOfItems, 5);
});

test('estado e raiz do catálogo ligam cidades e imóveis por links HTML', () => {
  const root = page('/imoveis/caixa/');
  assert.match(root, /<h1[^>]*>Imóveis da Caixa à venda<\/h1>/);
  assert.match(root, /href="\/imoveis\/caixa\/parana\/"/);
  assert.match(root, /href="\/imoveis\/caixa\/curitiba-pr\/"/);
  const parana = page('/imoveis/caixa/parana/');
  assert.match(parana, /<h1[^>]*>Imóveis da Caixa no Paraná<\/h1>/);
  assert.match(parana, /href="\/imoveis\/caixa\/londrina-pr\/"/);
  assert.match(page('/imoveis/caixa/sao-paulo/'), /<h1[^>]*>Imóveis da Caixa em São Paulo<\/h1>/);
});

test('paginação é rastreável por links, com canonical próprio por página', () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ ...raw[0], id: 1000 + i, sourceId: String(9000 + i), minBid: 100000 + i }));
  const result = renderCatalog(normalizeCatalog(many), { now: NOW });
  const first = result.files.get('/imoveis/caixa/curitiba-pr/');
  const second = result.files.get('/imoveis/caixa/curitiba-pr/pagina/2/');
  assert.ok(second);
  assert.match(first, /href="\/imoveis\/caixa\/curitiba-pr\/pagina\/2\/" rel="next"/);
  assert.match(second, /<link rel="canonical" href="https:\/\/www\.argosleiloes\.com\.br\/imoveis\/caixa\/curitiba-pr\/pagina\/2\/">/);
  assert.match(second, /href="\/imoveis\/caixa\/curitiba-pr\/" rel="prev"/);
  assert.equal((first.match(/class="card is-hoverable imoveis_card"/g) || []).length, 24);
  assert.equal((second.match(/class="card is-hoverable imoveis_card"/g) || []).length, 6);
});

test('sitemap de imóveis só tem URLs canônicas indexáveis e sem data fabricada', () => {
  assert.doesNotMatch(sitemap, /lastmod|<loc>[^<]*(\?|pagina\/1\/)/);
  assert.equal(urls.length, new Set(urls).size);
  for (const url of urls) {
    const html = page(url.replace(SITE, ''));
    assert.ok(html, url);
    assert.match(html, /content="index, follow"/);
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
  }
});

test('catálogo vazio gera só a página de busca, fora do índice', () => {
  const result = renderCatalog([], { now: NOW });
  assert.deepEqual([...result.files.keys()], ['/imoveis/caixa/']);
  assert.match(result.files.get('/imoveis/caixa/'), /noindex, follow/);
  assert.deepEqual(result.urls, []);
});

test('regravar o catálogo remove páginas de imóveis que saíram', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'argos-catalogo-'));
  try {
    writeCatalog({ files, sitemap }, dir);
    assert.ok(fs.existsSync(path.join(dir, 'imoveis/caixa/londrina-pr/casa-201/index.html')));
    const semLondrina = renderCatalog(properties.filter(p => p.id !== 201), { now: NOW });
    writeCatalog(semLondrina, dir);
    assert.ok(!fs.existsSync(path.join(dir, 'imoveis/caixa/londrina-pr/casa-201/index.html')));
    assert.ok(fs.existsSync(path.join(dir, 'sitemap-imoveis.xml')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('textos do catálogo da Caixa viram nomes legíveis e modalidades conhecidas', () => {
  assert.equal(titleCase('SAO JOSE DOS PINHAIS'), 'Sao Jose dos Pinhais');
  assert.equal(modalityOf('Leilão SFI - Edital Único').label, 'Leilão');
  assert.equal(modalityOf('Licitação Aberta').label, 'Licitação aberta');
  assert.equal(modalityOf('Venda Direta Online').label, 'Venda direta');
});

test('robots libera páginas públicas e aponta os dois sitemaps; 404 orienta sem indexar', () => {
  const robots = fs.readFileSync(path.join(__dirname, '..', 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*\nAllow: \/\nDisallow: \/api\/\n/);
  assert.match(robots, /Sitemap: https:\/\/www\.argosleiloes\.com\.br\/sitemap-imoveis\.xml/);
  const notFound = fs.readFileSync(path.join(__dirname, '..', '404.html'), 'utf8');
  assert.match(notFound, /noindex/);
  assert.match(notFound, /href="\/imoveis\/caixa\/"/);
  const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.equal(vercel.buildCommand, 'npm run build');
  assert.ok(vercel.redirects.some(r => r.source === '/imoveis' && r.destination === '/imoveis/caixa/' && r.permanent));
});
