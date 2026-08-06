# Argos — Landing Page + Blog

Landing page e blog do Argos, plataforma de inteligência para leilões de imóveis.

Site em produção: https://leilao-br.vercel.app/

## Stack

HTML, CSS e JavaScript puros — sem framework. O blog é gerado estaticamente a partir de Markdown por um script Node.

## Estrutura

```
├── index.html              # Landing page (single scroll)
├── lp/
│   ├── styles.css          # Design system (usado pela LP e pelo blog)
│   └── script.js           # Interações da LP
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

Acesse http://localhost:3000 (LP) e http://localhost:3000/blog/ (blog).

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

Rode `npm run blog` antes de cada deploy que inclua alteração em artigos.

## Notas de produto

- A plataforma agrega leilões de todo o Brasil; quando um leiloeiro não está no catálogo, o usuário cola o link do leilão e a IA analisa na hora.
- Não existe "score de viabilidade". A análise entrega valor de mercado, custos reais e lance máximo — a decisão de viabilidade é do usuário.
- O formulário da lista de espera grava em `data/signups.json` (local) e tem honeypot anti-spam.
