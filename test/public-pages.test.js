const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const matter = require('gray-matter');
const { buildPublicPages } = require('../scripts/build-public-pages');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.argosleiloes.com.br';
const pages = fs.readdirSync(path.join(ROOT, 'content/pages')).map(file =>
  matter(fs.readFileSync(path.join(ROOT, 'content/pages', file), 'utf8')));

test('materiais públicos têm canonical, schema fiel, autoria e sitemap', () => {
  assert.equal(pages.length, 3);
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const { data } of pages) {
    const html = fs.readFileSync(path.join(ROOT, data.path, 'index.html'), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${SITE}${data.path}">`));
    assert.match(html, /name="robots" content="index, follow"/);
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /href="\/editorial\/">Equipe Argos/);
    assert.doesNotMatch(html, /PREENCHER|"@type":"Person"|"reviewedBy"|noindex/);
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(schema.name, data.title);
    assert.equal(schema.url, `${SITE}${data.path}`);
    assert.equal(schema.dateModified, data.updatedAt);
    assert.equal(schema['@type'], data.type);
    assert.equal(schema.author.url, `${SITE}/editorial/`);
    assert.equal(schema.author['@id'], `${SITE}/editorial/#equipe-argos`);
    if (data.type === 'AboutPage') {
      assert.equal(schema.mainEntity['@id'], schema.author['@id']);
      assert.equal(schema.mainEntity.parentOrganization['@id'], `${SITE}/#organization`);
    }
    assert.equal(schema.isAccessibleForFree, true);
    assert.ok(sitemap.includes(`<loc>${SITE}${data.path}</loc>\n    <lastmod>${data.updatedAt}</lastmod>`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(html, /<script src="\/lp\/medicao.js" defer><\/script>/);
    assert.match(html, /href="\/privacidade\/#preferencias"/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    assert.ok(ids.length >= 3, `${data.path}: faltam âncoras para seções`);
  }
});

test('checklist oferece itens imprimíveis sem campos desabilitados sem rótulo', () => {
  const html = fs.readFileSync(path.join(ROOT, 'recursos/checklist-antes-do-lance/index.html'), 'utf8');
  assert.equal((html.match(/<span aria-hidden="true">☐<\/span>/g) || []).length, 10);
  assert.doesNotMatch(html, /<input/);
  assert.match(html, /Imprimir/);
  assert.match(fs.readFileSync(path.join(ROOT, 'blog/blog-styles.css'), 'utf8'), /@media print/);
});

test('links locais dos materiais apontam para páginas existentes', () => {
  for (const { data } of pages) {
    const html = fs.readFileSync(path.join(ROOT, data.path, 'index.html'), 'utf8');
    for (const [, target] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)) {
      const resolved = path.join(ROOT, target);
      assert.ok(fs.existsSync(resolved) || fs.existsSync(path.join(resolved, 'index.html')), `${data.path}: ${target}`);
    }
  }
});

test('exemplo de custo total soma as linhas e identifica hipóteses e reservas', () => {
  const page = pages.find(({ data }) => data.path.includes('custo-total'));
  const values = [...page.content.matchAll(/^\|[^\n]*\| R\$ ([\d.]+) \|$/gm)].map(match => Number(match[1].replace(/\./g, '')));
  assert.equal(values.length, 8);
  const total = values.reduce((sum, value) => sum + value, 0);
  assert.equal(total, 261000);
  assert.equal(values[1], values[0] * 0.05);
  assert.equal(values[2], values[0] * 0.03);
  assert.ok(page.content.includes(`R$ ${total.toLocaleString('pt-BR')}`));
  assert.ok(page.content.includes(((total - values[0]) / values[0] * 100).toLocaleString('pt-BR') + '%'));
  assert.match(page.content, /Exemplo ilustrativo/);
  assert.match(page.content, /não cotações, médias de mercado/);
  assert.match(page.content, /não estima duração ou custo de processo de desocupação/);
});

test('gerador usa domínio configurado e rejeita rotas fora do escopo', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'argos-public-pages-'));
  try {
    fs.mkdirSync(path.join(root, 'content'), { recursive: true });
    fs.cpSync(path.join(ROOT, 'content/pages'), path.join(root, 'content/pages'), { recursive: true });
    const result = buildPublicPages({ root, siteUrl: 'https://example.test' });
    assert.equal(result.length, 3);
    const html = fs.readFileSync(path.join(root, 'editorial/index.html'), 'utf8');
    assert.match(html, /href="https:\/\/example.test\/editorial\/"/);
    assert.doesNotMatch(html, /www.argosleiloes.com.br/);
    fs.writeFileSync(path.join(root, 'content/pages/invalid.md'), '---\npath: /../../escape/\n---\n');
    assert.throws(() => buildPublicPages({ root, siteUrl: 'https://example.test' }), /metadados/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
