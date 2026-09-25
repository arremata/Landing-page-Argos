# Argos — Landing Page + Blog

Landing page e blog do Argos, plataforma de inteligência para leilões de imóveis.

Site em produção: https://www.argosleiloes.com.br/ (projeto `landing-page-argos`
no time `argos33` da Vercel; cada push na `main` publica sozinho). O domínio sem
`www` redireciona para ele, e `SITE_URL` na Vercel fixa o `www` nos canonicals e no sitemap.

> A plataforma (app React) fica em https://app.argosleiloes.com.br/ — projeto
> `leilao-br` do mesmo time, repositório `arremata/leilao-br`.

## Stack

HTML, CSS e JavaScript puros — sem framework. O blog é gerado estaticamente a partir de Markdown por um script Node.

## Estrutura

```
├── index.html              # LP principal "Quero morar" (/)
├── investidor/
│   └── index.html          # LP "Quero investir" (/investidor/)
├── lp/
│   ├── styles.css          # Design system (usado pelas LPs e pelo blog)
│   ├── script.js           # Interações comuns às LPs (nav, modal, formulário)
│   ├── morar.css           # Estilos só da LP "Quero morar"
│   └── morar.js            # Interações só da LP "Quero morar"
├── blog/
│   ├── index.html          # Listagem de artigos (GERADO — não editar)
│   ├── blog-styles.css     # Estilos do blog
│   ├── posts/              # Fonte dos artigos em Markdown
│   └── <slug>/index.html   # Artigos (GERADOS — não editar)
├── scripts/
│   └── build-blog.js       # Markdown → HTML + sitemap + robots
├── api/
│   └── waitlist.js         # Endpoint serverless da lista de espera
├── dev-server.js           # Servidor local (simula roteamento da Vercel)
├── sitemap.xml             # GERADO
└── robots.txt              # GERADO
```

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000 (LP de morar), http://localhost:3000/investidor/ (LP de investidor) e http://localhost:3000/blog/ (blog).

### Workspaces do Superset

`.superset/config.json` prepara cada workspace sozinho: copia `.env`/`.vercel`
do checkout principal, roda `npm ci` e reserva uma porta própria (3020, 3040, ...)
para o dev server não colidir com outros workspaces. O botão **Run** sobe o
servidor nessa porta; apagar o workspace para o servidor e libera a porta.

## Publicando um novo artigo

1. Crie um `.md` em `blog/posts/` com o frontmatter abaixo
2. Rode `npm run blog`
3. Commit dos HTMLs gerados

```markdown
---
title: "Título do Artigo"
slug: "slug-do-artigo"
description: "Resumo de 1 a 2 linhas para SEO e para o card na listagem."
date: "2026-07-29"
author: "Equipe Argos"
tags: ["tag1", "tag2"]
keyword: "palavra-chave principal"
faq:
  - q: "Pergunta frequente?"
    a: "Resposta objetiva — vira FAQ Schema para o Google."
---

Conteúdo em Markdown. Use `##` para seções (entram no índice automático).
```

O build gera: HTML do artigo, listagem atualizada, `sitemap.xml` e `robots.txt`.

Artigos são curtos por definição editorial — cerca de 1.500 caracteres, tom didático, sempre com link para o site principal no corpo do texto.

## Deploy

A Vercel serve os arquivos estáticos direto da raiz e reconhece `api/waitlist.js` como função serverless. O `dev-server.js` existe apenas para desenvolvimento local — não é usado em produção.

O `vercel.json` é obrigatório: sem ele a Vercel detecta o `build` do `package.json`, roda o script e depois procura uma pasta `public/` que não existe — o deploy falha. O arquivo aponta `outputDirectory` para a raiz e roda `npm run blog` no build, então os HTMLs do blog são regerados a cada deploy.

Como a raiz inteira vira site público, o `.vercelignore` tira do deploy o que é interno: os `.md` da raiz (relatórios, pendências), o `dev-server.js`, `data/`, `.superset/` e arquivos `.env*`.

O domínio usado nos canonicals, no sitemap e nos links do blog vem de `SITE_URL`; se não estiver definida, o build usa `VERCEL_PROJECT_PRODUCTION_URL`, que a própria Vercel injeta. Hoje `SITE_URL` está definida em produção como `https://www.argosleiloes.com.br`; trocar de domínio não exige mexer no código, só atualizar essa variável e fazer um novo deploy.

## Notas de produto

- A plataforma agrega leilões de todo o Brasil; quando um leiloeiro não está no catálogo, o usuário cola o link do leilão e a IA analisa na hora.
- Não existe "score de viabilidade". A análise entrega valor de mercado, custos reais e lance máximo — a decisão de viabilidade é do usuário.
- O formulário da lista de espera grava em `data/signups.json` (local) e tem honeypot anti-spam.
