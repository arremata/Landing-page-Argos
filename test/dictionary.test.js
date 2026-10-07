const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');
const { GLOSSARY, GLOSSARY_GROUPS } = require('../content/glossary');
const {
  buildDictionary,
  dictionaryMeta,
  dictionarySitemapPaths,
  isIndexableTerm,
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

test('gera o dicionário completo a partir das fontes editoriais', () => {
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
  assert.match(html, /Entender o leilão em 1 minuto/);
  assert.match(html, /Quero ser avisado/);
  assert.doesNotMatch(html, /\/entrar|app\.argosleiloes\.com\.br/);
});

test('a página principal usa IDs únicos e âncoras válidas para os grupos', () => {
  const html = fs.readFileSync(path.join(outputRoot, 'dicionario', 'index.html'), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicateIds, []);
  for (const group of GLOSSARY_GROUPS) {
    assert.match(html, new RegExp(`href="#grupo-${group.id}"`));
    assert.match(html, new RegExp(`id="grupo-${group.id}"`));
  }
});

test('todos os verbetes têm conteúdo próprio e estão liberados para indexação', () => {
  for (const [key, entry] of Object.entries(GLOSSARY)) {
    assert.equal(isIndexableTerm(key), true, key);
    assert.ok(entry.detail.length >= 2, `${key}: explicação insuficiente`);
    assert.ok(entry.detail.join(' ').split(/\s+/).length >= 45, `${key}: texto muito curto`);
    assert.ok(entry.checks.length >= 3, `${key}: faltam pontos de conferência`);

    const html = fs.readFileSync(path.join(outputRoot, 'dicionario', termPath(key).split('/').at(-1), 'index.html'), 'utf8');
    assert.match(html, /<meta name="robots" content="index, follow">/, key);
    assert.match(html, /class="dictionary-byline"/, key);
    assert.match(html, /class="dictionary-practical"/, key);
    assert.match(html, /class="dictionary-sources"/, key);
    assert.match(html, /class="dictionary-related-guide"/, key);
    assert.match(html, /"@type":"WebPage"/, key);
    assert.doesNotMatch(
      html,
      /\b(assessoria|consultoria jurídica|análise jurídica|parecer|recomendamos|vale a pena|você deve|depende)\b/i,
      key,
    );
  }

  assert.equal(dictionarySitemapPaths().length, Object.keys(GLOSSARY).length + 1);
  assert.ok(dictionarySitemapPaths().includes('/dicionario/itbi'));
  assert.equal(termPath('primeira_rodada'), '/dicionario/primeira-rodada');
});

test('fontes são carregadas sem bloquear a primeira renderização', () => {
  const html = fs.readFileSync(path.join(outputRoot, 'dicionario', 'index.html'), 'utf8');
  assert.match(html, /rel="stylesheet" media="print" onload="this\.media='all'"/);
  assert.match(html, /display=optional/);
});

test('metadados usam o endereço solicitado pelo ambiente de build', () => {
  const meta = dictionaryMeta(null, 'https://preview.example');
  assert.equal(meta.canonical, 'https://preview.example/dicionario');
});
