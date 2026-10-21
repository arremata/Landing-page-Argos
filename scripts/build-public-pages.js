const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { marked } = require('marked');

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildPublicPages({ root, siteUrl, fonts = '' }) {
  const sourceDir = path.join(root, 'content', 'pages');
  const pages = fs.readdirSync(sourceDir).filter(file => file.endsWith('.md')).sort().map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(sourceDir, file), 'utf8'));
    if (!/^\/(editorial|como-funciona|sobre|contato|metodologia|recursos\/[a-z0-9-]+)\/$/.test(data.path) ||
        !data.title || !data.description || !/^\d{4}-\d{2}-\d{2}$/.test(data.updatedAt) ||
        !['WebPage', 'AboutPage', 'ContactPage'].includes(data.type)) {
      throw new Error(`${file}: metadados de página pública inválidos`);
    }
    // Perguntas frequentes visíveis na página e, só por isso, também no FAQPage.
    if (data.faq !== undefined && (!Array.isArray(data.faq) || !data.faq.every(item => item && item.q && item.a))) {
      throw new Error(`${file}: faq precisa de itens com q e a`);
    }
    return { ...data, content };
  });
  if (new Set(pages.map(page => page.path)).size !== pages.length) throw new Error('Rotas públicas duplicadas');

  for (const page of pages) {
    const url = `${siteUrl}${page.path}`;
    const schema = {
      '@context': 'https://schema.org', '@type': page.type,
      '@id': `${url}#webpage`, url, name: page.title, description: page.description,
      inLanguage: 'pt-BR', dateModified: page.updatedAt, isAccessibleForFree: true,
      author: { '@type': 'Organization', '@id': `${siteUrl}/editorial/#equipe-argos`, name: 'Equipe Argos', url: `${siteUrl}/editorial/` },
      isPartOf: { '@type': 'WebSite', '@id': `${siteUrl}/#website` },
    };
    if (page.mainEntity === 'organization') {
      schema.mainEntity = { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Argos', url: `${siteUrl}/` };
    } else if (page.type === 'AboutPage') {
      schema.mainEntity = {
        ...schema.author,
        parentOrganization: { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Argos', url: `${siteUrl}/` },
      };
    }
    // Âncoras estáveis permitem compartilhar uma seção, não apenas a página.
    const ids = new Set();
    const body = marked(page.content)
      // Roteiro de impressão, não um formulário desabilitado sem rótulos.
      .replace(/<input disabled="" type="checkbox">/g, '<span aria-hidden="true">☐</span>')
      .replace(/<h2>(.*?)<\/h2>/g, (_, rawTitle) => {
        // "## Título {#ancora}" fixa a âncora usada por links de outras páginas.
        const fixed = rawTitle.match(/\s*\{#([a-z0-9-]+)\}$/);
        const title = fixed ? rawTitle.slice(0, fixed.index) : rawTitle;
        const id = fixed ? fixed[1] : title.replace(/<[^>]*>/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (ids.has(id)) throw new Error(`${page.path}: título de seção duplicado`);
        ids.add(id);
        return `<h2 id="${id}">${title}</h2>`;
      });
    const faq = page.faq || [];
    const faqHtml = faq.length ? `<section class="blog-faq" aria-labelledby="perguntas-frequentes"><h2 id="perguntas-frequentes">Perguntas frequentes</h2>${faq.map(item =>
      `<details class="faq-item"><summary>${escapeHtml(item.q)}</summary><div class="faq-answer"><p>${marked.parseInline(item.a)}</p></div></details>`).join('')}</section>` : '';
    const faqSchema = faq.length ? {
      '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: faq.map(item => ({
        '@type': 'Question', name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*/g, '') },
      })),
    } : null;
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.title)} | Argos</title>
<meta name="description" content="${escapeHtml(page.description)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(url)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
${fonts}
<link rel="stylesheet" href="/lp/styles.css">
<link rel="stylesheet" href="/blog/blog-styles.css">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
<header class="public-page-nav"><div class="container blog-container">
  <a href="/" class="logo"><span class="logo-mark" aria-hidden="true"><img src="/brand/argos-mark.svg" alt=""></span><span class="logo-word">Argos</span></a>
  <nav aria-label="Navegação"><a href="/imoveis/caixa/">Imóveis da Caixa</a> <a href="/como-funciona/">Como funciona</a> <a href="/blog/">Blog</a> <a href="/dicionario">Dicionário</a> <a href="/contato/">Contato</a></nav>
</div></header>
<main class="public-page-main"><article class="container blog-container">
  <header class="blog-header"><h1 class="blog-title">${escapeHtml(page.title)}</h1>
    <p class="blog-desc">${escapeHtml(page.description)}</p>
    <p class="blog-updated">Por <a href="/editorial/">Equipe Argos</a> · Atualizado em <time datetime="${page.updatedAt}">${page.updatedAt.split('-').reverse().join('/')}</time></p>
  </header>
  <div class="blog-body">${body}</div>
  ${faqHtml}
  <aside class="blog-cta-box"><h2>Encontre imóveis da Caixa sem pagar assinatura</h2><p>Compare valor mínimo, avaliação, ocupação e custos estimados de cada imóvel, por cidade.</p><a href="/imoveis/caixa/" class="btn-primary" data-evento-clique="start_search">Buscar imóveis da Caixa →</a></aside>
</article></main>
<footer class="footer"><div class="container blog-container"><nav class="footer-links" aria-label="Materiais públicos"><a href="/sobre/">Sobre</a><a href="/contato/">Contato</a><a href="/metodologia/">Metodologia</a><a href="/editorial/">Política editorial</a><a href="/recursos/checklist-antes-do-lance/">Checklist</a><a href="/recursos/custo-total-imovel-leilao/">Exemplo de custos</a><a href="/privacidade/#preferencias">Privacidade e preferências</a><a href="/termos/">Termos</a></nav><p class="footer-copy">O Argos é independente e não tem vínculo com a Caixa Econômica Federal.</p><p class="footer-copy">&copy; 2026 Argos.</p></div></footer>
<script src="/lp/medicao.js" defer></script>
</body></html>`;
    const outputDir = path.join(root, page.path);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }
  return pages.map(({ path: pagePath, updatedAt }) => ({ path: pagePath, updatedAt }));
}

module.exports = { buildPublicPages };
