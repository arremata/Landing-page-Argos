const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { GLOSSARY } = require('../content/glossary');
const {
  buildDictionary,
  dictionaryMeta,
  dictionarySitemapPaths,
  termPath,
} = require('../scripts/build-dictionary');

let outputRoot;

before(() => {
  outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'argos-dictionary-'));
  buildDictionary({
    root: outputRoot,
    siteUrl: 'https://www.argosleiloes.com.br',
    appUrl: 'https://app.argosleiloes.com.br',
  });
});

after(() => {
  fs.rmSync(outputRoot, { recursive: true, force: true });
});

test('gera o dicionário completo com uma única fonte editorial', () => {
  const generatedTerms = fs.readdirSync(path.join(outputRoot, 'dicionario'), { withFileTypes: true })
    .filter(entry => entry.isDirectory());
  assert.equal(generatedTerms.length, Object.keys(GLOSSARY).length);
  assert.equal(fs.existsSync(path.join(outputRoot, 'dicionario', 'index.html')), true);
});

test('a página principal é indexável e aponta para o domínio público', () => {
  const html = fs.readFileSync(path.join(outputRoot, 'dicionario', 'index.html'), 'utf8');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.argosleiloes\.com\.br\/dicionario">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.match(html, /DefinedTermSet/);
  assert.match(html, /Criar conta grátis e ver os imóveis/);
  assert.match(html, /https:\/\/app\.argosleiloes\.com\.br\/entrar/);
});

test('verbetes curtos ficam fora do índice até ganharem explicação própria', () => {
  const html = fs.readFileSync(path.join(outputRoot, 'dicionario', 'itbi', 'index.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /ITBI: o que é no leilão da Caixa/);
  assert.deepEqual(dictionarySitemapPaths(), ['/dicionario']);
  assert.equal(termPath('primeira_rodada'), '/dicionario/primeira-rodada');
});

test('metadados usam o endereço solicitado pelo ambiente de build', () => {
  const meta = dictionaryMeta(null, 'https://preview.example');
  assert.equal(meta.canonical, 'https://preview.example/dicionario');
});
