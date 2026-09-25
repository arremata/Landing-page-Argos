const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const POSTS_DIR = path.join(__dirname, '..', 'blog', 'posts');
const BLOG_OUT = path.join(__dirname, '..', 'blog');
const ROOT = path.join(__dirname, '..');
// Canonicals, sitemap e todos os links do blog para a LP saem daqui. Precisa
// ser configuravel porque o dominio ainda vai mudar: VERCEL_PROJECT_PRODUCTION_URL
// e injetado pela Vercel no build, entao trocar de dominio nao exige mexer no codigo.
const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'https://www.argosleiloes.com.br'
).replace(/\/+$/, '');

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
});

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readingTime(text) {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function extractTOC(html) {
  const headings = [];
  const re = /<h([23])\s*(?:id="([^"]*)")?[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const raw = match[3].replace(/<[^>]+>/g, '');
    const id = match[2] || slugify(raw);
    headings.push({ level, id, text: raw });
  }
  return headings;
}

function addIdsToHeadings(html) {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (full, level, attrs, text) => {
    if (attrs.includes('id=')) return full;
    const raw = text.replace(/<[^>]+>/g, '');
    const id = slugify(raw);
    return `<h${level} id="${id}"${attrs}>${text}</h${level}>`;
  });
}

function buildTOCHtml(headings) {
  if (headings.length < 2) return '';
  let html = '<nav class="blog-toc" aria-label="Índice do artigo"><p class="toc-title">Neste artigo</p><ul>';
  for (const h of headings) {
    const indent = h.level === 3 ? ' class="toc-sub"' : '';
    html += `<li${indent}><a href="#${h.id}">${h.text}</a></li>`;
  }
  html += '</ul></nav>';
  return html;
}

// O FAQPage so pode ser emitido junto com o FAQ visivel na pagina. Marcar como
// FAQ um conteudo que o leitor nao ve viola diretriz do Google — por isso as
// duas saidas nascem da mesma funcao e nunca podem ser usadas em separado.
function buildFaq(faqs) {
  if (!faqs || faqs.length === 0) return { schema: '', html: '' };

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  });

  const items = faqs.map(f => `
        <details class="faq-item">
          <summary>${escapeHtml(f.q)}</summary>
          <div class="faq-answer">${marked.parseInline(f.a)}</div>
        </details>`).join('\n');

  return {
    schema: `<script type="application/ld+json">${schema}</script>`,
    html: `
      <section class="blog-faq" aria-labelledby="faq-titulo">
        <h2 id="faq-titulo">Perguntas frequentes</h2>
${items}
      </section>`
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildBreadcrumbSchema(post) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog/` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}/` }
    ]
  })}</script>`;
}

// Exigido pela Parte VI do documento-fonte (filtro OAB). O autor e advogado
// inscrito; a ausencia deste bloco em artigo juridico e exposicao disciplinar.
const DISCLAIMER_OAB = `
      <aside class="blog-disclaimer">
        <p>Este conteúdo tem finalidade informativa e educacional. Não constitui consultoria jurídica nem substitui a análise de um profissional habilitado sobre o seu caso concreto. Em um caso concreto, o edital, a matrícula, a legislação municipal e a cronologia da consolidação e da arrematação podem alterar substancialmente o resultado. Leis e entendimentos judiciais mudam; verifique a data de atualização no topo desta página.</p>
      </aside>`;

function postTemplate(post, content, toc) {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: 'Argos' },
    publisher: {
      '@type': 'Organization',
      name: 'Argos',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}/` }
  };

  const faq = buildFaq(post.faq);
  const breadcrumbSchema = buildBreadcrumbSchema(post);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${post.title}</title>
<meta name="description" content="${post.description}">
<link rel="canonical" href="${SITE_URL}/blog/${post.slug}/">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.description}">
<meta property="og:type" content="article">
<meta property="og:url" content="${SITE_URL}/blog/${post.slug}/">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%237C3AED'/%3E%3Cpath d='M4 12s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5-8-5.5-8-5.5Z' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='2.3' fill='white'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/lp/styles.css">
<link rel="stylesheet" href="/blog/blog-styles.css">
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
${breadcrumbSchema}
${faq.schema}
</head>
<body>

<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="${SITE_URL}/" class="logo">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </span>
      <span class="logo-word">Argos</span>
    </a>
    <nav class="nav-links" aria-label="Navegação">
      <a href="/blog/">Blog</a>
      <a href="${SITE_URL}/#passo-a-passo">Como funciona</a>
      <a href="${SITE_URL}/#faq">Dúvidas</a>
    </nav>
    <a href="${SITE_URL}/" class="btn-primary btn-sm nav-cta" target="_blank" rel="noopener">Conhecer o Argos</a>
  </div>
</header>

<main class="blog-main">
  <article class="blog-article">
    <div class="container blog-container">

      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${SITE_URL}/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/blog/">Blog</a>
        <span aria-hidden="true">/</span>
        <span>${post.title}</span>
      </nav>

      <header class="blog-header">
        <div class="blog-meta">
          <time datetime="${post.publishedAt}">${formatDate(post.publishedAt)}</time>
          <span class="meta-sep">·</span>
          <span>${post.readTime} min de leitura</span>
        </div>
        <h1 class="blog-title">${post.title}</h1>
        <p class="blog-desc">${post.description}</p>
        <p class="blog-updated">Atualizado em <time datetime="${post.updatedAt}">${formatDate(post.updatedAt)}</time></p>
      </header>

      ${toc}

      <div class="blog-body">
        ${content}
      </div>
${faq.html}
${DISCLAIMER_OAB}

      <div class="blog-cta-box">
        <h3>Quer analisar leilões com mais segurança?</h3>
        <p>O Argos cruza edital, mercado, custos e riscos jurídicos em minutos. Veja como funciona.</p>
        <a href="${SITE_URL}/" class="btn-primary" target="_blank" rel="noopener">Conhecer o Argos →</a>
      </div>

    </div>
  </article>
</main>

<footer class="footer">
  <div class="container footer-inner">
    <div class="logo">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </span>
      <span class="logo-word">Argos</span>
    </div>
    <p class="footer-sub">Inteligência em leilões imobiliários.</p>
    <nav class="footer-links">
      <a href="/blog/">Blog</a>
    </nav>
    <p class="footer-copy">&copy; 2026 Argos. Todos os direitos reservados.</p>
  </div>
</footer>

</body>
</html>`;
}

function formatDate(dateStr) {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function listingTemplate(posts) {
  const cards = posts.map(p => `
      <a href="/blog/${p.slug}/" class="blog-card">
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <time datetime="${p.publishedAt}">${formatDate(p.publishedAt)}</time>
            <span class="meta-sep">·</span>
            <span>${p.readTime} min</span>
          </div>
          <h2 class="blog-card-title">${p.title}</h2>
          <p class="blog-card-desc">${p.description}</p>
          <span class="blog-card-link">Ler artigo →</span>
        </div>
      </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog | Argos — Inteligência em Leilões Imobiliários</title>
<meta name="description" content="Guias, análises e dicas sobre leilão de imóveis. Aprenda a avaliar editais, calcular custos e evitar riscos com inteligência artificial.">
<link rel="canonical" href="${SITE_URL}/blog/">
<meta property="og:title" content="Blog | Argos">
<meta property="og:description" content="Guias, análises e dicas sobre leilão de imóveis.">
<meta property="og:type" content="website">
<meta name="theme-color" content="#FFFFFF">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%237C3AED'/%3E%3Cpath d='M4 12s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5-8-5.5-8-5.5Z' fill='none' stroke='white' stroke-width='1.5'/%3E%3Ccircle cx='12' cy='12' r='2.3' fill='white'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/lp/styles.css">
<link rel="stylesheet" href="/blog/blog-styles.css">
</head>
<body>

<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="${SITE_URL}/" class="logo">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </span>
      <span class="logo-word">Argos</span>
    </a>
    <nav class="nav-links" aria-label="Navegação">
      <a href="/blog/">Blog</a>
      <a href="${SITE_URL}/#passo-a-passo">Como funciona</a>
      <a href="${SITE_URL}/#faq">Dúvidas</a>
    </nav>
    <a href="${SITE_URL}/" class="btn-primary btn-sm nav-cta" target="_blank" rel="noopener">Conhecer o Argos</a>
  </div>
</header>

<main class="blog-main">
  <div class="container">
    <header class="blog-listing-header" data-reveal>
      <span class="overline">Blog</span>
      <h1 class="section-title">Guias e análises sobre leilão de imóveis</h1>
      <p class="section-sub">Conteúdo prático para quem quer investir com segurança em leilões imobiliários.</p>
    </header>

    <div class="blog-grid">
${cards}
    </div>
  </div>
</main>

<footer class="footer">
  <div class="container footer-inner">
    <div class="logo">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </span>
      <span class="logo-word">Argos</span>
    </div>
    <p class="footer-sub">Inteligência em leilões imobiliários.</p>
    <nav class="footer-links">
      <a href="/blog/">Blog</a>
    </nav>
    <p class="footer-copy">&copy; 2026 Argos. Todos os direitos reservados.</p>
  </div>
</footer>

</body>
</html>`;
}

function generateSitemap(posts) {
  const now = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/investidor/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

  for (const p of posts) {
    xml += `
  <url>
    <loc>${SITE_URL}/blog/${p.slug}/</loc>
    <lastmod>${p.updatedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  xml += '\n</urlset>\n';
  return xml;
}

function generateRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('Nenhuma pasta blog/posts/ encontrada. Criando...');
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('Nenhum post encontrado em blog/posts/. Nada para compilar.');
    return;
  }

  const posts = [];
  const skipped = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
    const { data, content } = matter(raw);

    // Rascunho nao vira pagina. O default e "draft" de proposito: um artigo so
    // vai ao ar quando alguem escrever published no frontmatter, nunca por
    // esquecimento. Frontmatter sem status nenhum tambem nao publica.
    const status = data.status || 'draft';
    if (status !== 'published') {
      skipped.push({ file, status });
      continue;
    }

    const slug = data.slug || slugify(data.title || path.basename(file, '.md'));
    const plainText = content.replace(/[#*_`\[\]()>|-]/g, '');
    const readTime = readingTime(plainText);

    let html = marked(content);
    html = addIdsToHeadings(html);
    const toc = extractTOC(html);
    const tocHtml = buildTOCHtml(toc);

    // publishedAt/updatedAt sao os nomes da especificacao; date/updated ficam
    // aceitos para nao quebrar artigo antigo. O updatedAt nunca cai para a data
    // de build — se faltar, herda a de publicacao, que e um fato real.
    const publishedAt = data.publishedAt || data.date;
    if (!publishedAt) throw new Error(`${file}: falta publishedAt (ou date) no frontmatter`);

    const post = {
      title: data.title,
      slug,
      description: data.description || '',
      publishedAt,
      updatedAt: data.updatedAt || data.updated || publishedAt,
      author: data.author || 'Equipe Argos',
      tags: data.tags || [],
      keywordPrincipal: data.keywordPrincipal || data.keyword || '',
      cluster: data.cluster || '',
      faq: data.faq || [],
      readTime,
    };

    const outDir = path.join(BLOG_OUT, slug);
    fs.mkdirSync(outDir, { recursive: true });

    const pageHtml = postTemplate(post, html, tocHtml);
    fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml, 'utf-8');

    posts.push(post);
    console.log(`  ✓ ${slug}/index.html`);
  }

  // Diretorio de artigo que deixou de existir (arquivo removido ou voltou para
  // draft) precisa sair do disco. Sem isto o HTML antigo continua publicado e
  // acessivel por URL direta, mesmo sem constar da listagem nem do sitemap.
  const publicados = new Set(posts.map(p => p.slug));
  const RESERVADOS = new Set(['posts']);
  for (const entry of fs.readdirSync(BLOG_OUT, { withFileTypes: true })) {
    if (!entry.isDirectory() || RESERVADOS.has(entry.name)) continue;
    if (publicados.has(entry.name)) continue;
    fs.rmSync(path.join(BLOG_OUT, entry.name), { recursive: true, force: true });
    console.log(`  ✗ ${entry.name}/ removido (nao publicado)`);
  }

  posts.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));

  const listHtml = listingTemplate(posts);
  fs.writeFileSync(path.join(BLOG_OUT, 'index.html'), listHtml, 'utf-8');
  console.log(`  ✓ blog/index.html (${posts.length} artigos)`);

  const sitemap = generateSitemap(posts);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('  ✓ sitemap.xml');

  const robots = generateRobots();
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf-8');
  console.log('  ✓ robots.txt');

  if (skipped.length) {
    console.log(`\nNao publicados (${skipped.length}):`);
    for (const s of skipped) console.log(`  · ${s.file} — status: ${s.status}`);
  }

  console.log(`\nBlog compilado: ${posts.length} artigo(s) publicado(s).`);
}

build();
