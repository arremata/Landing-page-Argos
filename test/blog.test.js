const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

test('indice do blog segue a comunicacao publica da landing page', () => {
  const html = fs.readFileSync(path.join(ROOT, 'blog', 'index.html'), 'utf8');

  assert.match(html, /<title>Guias sobre leilão de imóveis \| Blog Argos<\/title>/);
  assert.match(html, /href="https:\/\/www\.argosleiloes\.com\.br\/#leilao">Como funciona<\/a>/);
  assert.doesNotMatch(html, /#passo-a-passo|inteligência artificial/i);
});

test('todos os artigos estao publicados com autoria, revisao e fontes', () => {
  assert.equal(files.length, 12);

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    assert.equal(data.status, 'published', file);
    assert.match(data.publishedAt, /^\d{4}-\d{2}-\d{2}$/, file);
    assert.ok(data.updatedAt >= data.publishedAt, `${file}: updatedAt anterior a publishedAt`);
    assert.equal(data.author, 'Equipe Argos', file);
    assert.ok(data.reviewedBy, file);
    assert.ok(data.reviewedAt && data.reviewedAt <= data.updatedAt, `${file}: reviewedAt fora do intervalo`);
    assert.ok(['judicial', 'extrajudicial', 'ambos'].includes(data.modalidade), `${file}: modalidade invalida`);
    assert.ok(Array.isArray(data.sources) && data.sources.length >= 2, file);

    for (const source of data.sources) {
      assert.ok(source.title, `${file}: fonte sem titulo`);
      assert.match(source.url, /^https:\/\//, `${file}: fonte sem HTTPS`);
    }

    assert.doesNotMatch(
      content,
      /\b(assessoria|consultoria jurídica|análise jurídica|parecer|recomendamos|vale a pena|você deve|depende)\b/i,
      file,
    );
  }
});

// Padrao editorial: artigos publicados em dias diferentes, nunca em lote.
test('nenhum par de artigos compartilha a mesma data de publicacao', () => {
  const datas = files.map(file => matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')).data.publishedAt);
  assert.equal(new Set(datas).size, datas.length, `datas repetidas: ${datas.sort().join(', ')}`);
});

test('paginas geradas exibem sinais editoriais e schema de citacao', () => {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

  for (const file of files) {
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'));
    const generatedPath = path.join(ROOT, 'blog', data.slug, 'index.html');
    assert.equal(fs.existsSync(generatedPath), true, generatedPath);

    const html = fs.readFileSync(generatedPath, 'utf8');
    assert.match(html, /class="blog-byline"/, data.slug);
    assert.match(html, /class="blog-sources"/, data.slug);
    assert.match(html, /"reviewedBy"/, data.slug);
    assert.match(html, /"citation"/, data.slug);
    assert.match(html, new RegExp(`class="blog-modalidade is-${data.modalidade}"`), data.slug);
    assert.doesNotMatch(html, /\{(judicial|extrajudicial)\}/, `${data.slug}: marca de secao nao convertida`);
    assert.doesNotMatch(html, /:::\s*nota/, `${data.slug}: quadro ::: nota nao convertido`);
    const leiaTambem = html.match(/class="blog-related-card"/g) || [];
    assert.equal(leiaTambem.length, 3, `${data.slug}: "Leia também" precisa de 3 artigos`);
    assert.doesNotMatch(html, new RegExp(`class="blog-related"[\\s\\S]*href="/blog/${data.slug}/"`), `${data.slug}: indica a si mesmo`);
    assert.match(sitemap, new RegExp(`<loc>https://www\\.argosleiloes\\.com\\.br/blog/${data.slug}/</loc>`));
  }
});

test('links entre artigos apontam para slugs existentes', () => {
  const slugs = new Set(files.map(file => {
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'));
    return data.slug;
  }));

  for (const file of files) {
    const { content } = matter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'));
    for (const match of content.matchAll(/\]\(\/blog\/([^/)]+)\/\)/g)) {
      assert.ok(slugs.has(match[1]), `${file}: link para slug inexistente ${match[1]}`);
    }
  }
});
