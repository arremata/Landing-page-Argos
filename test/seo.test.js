const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sitemap = fs.readFileSync(path.join(__dirname, '..', 'sitemap.xml'), 'utf8');

test('home declara canonical, Open Graph e entidades estruturadas', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.argosleiloes\.com\.br\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.argosleiloes\.com\.br\/">/);

  const blocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  assert.equal(blocks.length, 1);
  const schema = JSON.parse(blocks[0][1]);
  const types = new Set(schema['@graph'].map(entity => entity['@type']));

  assert.ok(types.has('Organization'));
  assert.ok(types.has('WebSite'));
  assert.ok(types.has('WebPage'));
  assert.ok(types.has('SoftwareApplication'));
});

test('home adia recursos que não precisam bloquear o primeiro conteúdo', () => {
  assert.match(html, /display=optional/);
  assert.match(html, /fonts\.googleapis\.com[^>]+rel="stylesheet" media="print" onload="this\.media='all'"/);
  assert.match(html, /href="\/lp\/leilao\.css" media="print" onload="this\.media='all'"/);
});

test('sitemap publica os 58 verbetes com data editorial real', () => {
  const dictionaryUrls = Array.from(sitemap.matchAll(/<loc>https:\/\/www\.argosleiloes\.com\.br\/dicionario\/[^<]+<\/loc>/g));
  assert.equal(dictionaryUrls.length, 58);
  assert.match(
    sitemap,
    /<loc>https:\/\/www\.argosleiloes\.com\.br\/dicionario\/itbi<\/loc>\s*<lastmod>2026-10-07<\/lastmod>/,
  );
});
