# Argos Landing Page — Resumo Completo da Sessão

## Contexto do Projeto

O **Argos** (nome da LP) / **Arremate** (nome da plataforma) é uma plataforma de inteligência em leilões de imóveis com IA. Analisa editais, mercado, custos e riscos jurídicos em minutos, gerando um Score de Viabilidade (0-100) e lance máximo recomendado.

### Stack atual da Landing Page
- **HTML estático puro** + CSS + JS vanilla
- Servidor: `dev-server.js` (Node.js simples, porta 3000)
- API: `api/waitlist.js` (salva leads em `data/signups.json`)
- Deploy: **Vercel** (frontend + serverless backend)
- Fontes: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (mono)
- Paleta: violeta `#7C3AED`, fundo branco `#FFFFFF`, soft `#F5F5F7`
- Design: minimalista, tech, clean — sem glassmorphism pesado

### Stack da plataforma (separada)
- Backend: Python 3.12, FastAPI, LangGraph (pipeline de agentes IA)
- Frontend: React 19 + Vite
- LLMs: Claude Sonnet/Opus + GPT-5.4 via LiteLLM
- Deploy: Vercel (frontend + serverless)

### Arquivos da LP
```
argos-landing/
├── index.html          ← Landing page completa (589 linhas)
├── styles.css          ← CSS (1347 linhas, design system completo)
├── script.js           ← JS (303 linhas — nav, modal, animações, form)
├── dev-server.js       ← Servidor local dev
├── api/waitlist.js     ← API de cadastro na waitlist
├── data/signups.json   ← Leads salvos
├── scripts/            ← (criado, vazio — para build-blog.js)
└── blog/posts/         ← (criado, vazio — para artigos .md)
```

---

## Diagnóstico da Landing Page Atual

### O que já funciona bem
- Estrutura de seções correta: DOR → SOLUÇÃO → COMO FUNCIONA → PROVA → CTA
- Live card animado com análise em tempo real (diferencial visual forte)
- Headline certeira: "Saiba se o leilão vale a pena antes de dar seu lance"
- FAQ com 6 perguntas cobrindo objeções principais
- Meta tags, OG tags, favicon e fontes corretas
- Formulário com honeypot anti-bot
- FAB flutuante de cadastro (aparece após 30% scroll)
- Animações de scroll reveal, contadores, stagger

### Gaps identificados
- **Sem WhatsApp flutuante** — decidido IGNORAR por enquanto (foco em email)
- **Vídeo demo vazio** — placeholder sem vídeo real
- **Sem Schema.org / structured data** — Google não entende o produto
- **Sem página de obrigado** — pixel de conversão não dispara
- **Prova social fraca** — credenciais genéricas sem nomes/fotos
- **Nav com 3 links** — cada link é uma saída potencial da página
- **Sem sitemap.xml** — Google não indexa eficientemente
- **Sem robots.txt**
- **Sem Google Analytics 4 / GTM**

---

## Decisões Tomadas

### 1. Blog: SIM, no mesmo domínio, pasta `/blog`
- **Não subdomínio** (`blog.argos.com` é tratado como site separado pelo Google)
- **URL pattern**: `argos.com/blog/slug-do-artigo/`
- **Timing**: pode começar agora, mas priorizar infraestrutura antes de conteúdo

### 2. WhatsApp: NÃO por enquanto
- Foco em email e formulário de waitlist
- Quando o produto lançar, reavaliar

### 3. Duas LPs coexistindo
- LP atual (demo) → sempre no ar, com blog
- LP de conversão (futura) → focada 100% em converter para o produto pago

### 4. Tecnologia do blog
- **Build script Node.js** (~120 linhas) que converte Markdown → HTML estático
- Reutiliza o CSS e identidade visual da LP
- Gera sitemap.xml e robots.txt automaticamente
- Zero dependência pesada (sem framework, sem CMS)
- Fluxo: escreve .md → `npm run blog` → git push → Vercel publica

---

## Arquitetura do Blog (planejada, não implementada ainda)

### Estrutura de arquivos
```
argos-landing/
├── blog/
│   ├── posts/                              ← Markdown dos artigos
│   │   ├── como-analisar-edital-leilao.md
│   │   ├── custos-ocultos-leilao-imovel.md
│   │   └── ...
│   ├── index.html                          ← Listagem (gerado pelo build)
│   └── como-analisar-edital-leilao/
│       └── index.html                      ← Post individual (gerado)
├── blog-styles.css                         ← CSS específico do blog
├── sitemap.xml                             ← Gerado pelo build
├── robots.txt                              ← Gerado pelo build
├── scripts/
│   └── build-blog.js                       ← Script de build
└── package.json                            ← Com script "blog"
```

### Frontmatter de cada post .md
```yaml
---
title: "Como Analisar o Edital de Leilão de Imóvel"
slug: "como-analisar-edital-leilao"
description: "Guia completo para ler e interpretar o edital..."
date: "2026-07-01"
author: "Equipe Argos"
tags: ["edital", "leilão", "guia"]
keyword: "como analisar edital leilão"
---
```

### SEO automático por post (gerado pelo build)
- `<title>` com título + " | Argos Blog"
- `meta description` do frontmatter
- `og:title`, `og:description`, `og:type` para compartilhamento
- Schema.org Article (JSON-LD)
- Canonical URL
- Sumário clicável gerado dos H2/H3
- CTA inline do Argos no meio e no final do artigo
- FAQ Schema se o post tiver seção de FAQ

### Design do blog
- Mesmo visual da LP: minimalista, tecnológico, Plus Jakarta Sans + Inter
- Fundo branco, cards com border sutil
- Tipografia de leitura otimizada (max-width ~680px para corpo do texto)
- Header sticky com logo + CTA
- Breadcrumb: Home > Blog > Artigo
- Cards de artigos na listagem com tag de categoria, data, tempo de leitura

---

## Estratégia de Conteúdo (do Playbook SEO)

### Keywords de Alta Prioridade
| Palavra-chave | Tipo de conteúdo |
|---|---|
| como analisar edital de leilão de imóvel | Artigo-guia completo |
| análise de viabilidade leilão imóveis | Página do produto + artigo |
| custos ocultos leilão de imóvel | Artigo com checklist |
| riscos de comprar imóvel em leilão | Artigo + infográfico |
| como calcular valor real imóvel leilão | Artigo com exemplo prático |
| leilão de imóvel ocupado o que fazer | Artigo jurídico acessível |
| como saber se leilão vale a pena | Artigo + CTA pro Argos |
| ferramenta para análise de leilão | Página do produto (SEO) |

### Keywords de Média Prioridade
| Palavra-chave | Tipo de conteúdo |
|---|---|
| como comprar imóvel em leilão judicial | Guia passo a passo |
| diferença leilão judicial e extrajudicial | Artigo comparativo |
| arrematação de imóveis como funciona | Guia para iniciantes |
| documentos necessários leilão de imóvel | Checklist prático |
| como financiar imóvel de leilão | Artigo prático |
| desocupação imóvel arrematado em leilão | Artigo jurídico acessível |

### Calendário editorial (primeiros 2 meses)
**Mês 1:**
1. "Como Analisar o Edital de Leilão de Imóvel: Guia Completo 2026"
2. "Custos Ocultos de Leilão de Imóvel: O Que Ninguém Te Conta"
3. "Riscos de Comprar Imóvel em Leilão: 7 Problemas e Como Evitar"
4. "Como Saber se um Leilão Vale a Pena (Método de 5 Passos)"

**Mês 2:**
5. "Leilão Judicial vs. Extrajudicial: Diferenças que Importam"
6. "Como Comprar Imóvel em Leilão Judicial: Passo a Passo"
7. "Leilão de Imóvel Ocupado: O Que Fazer?"
8. "Como Calcular o Valor Real de um Imóvel em Leilão"

### Estrutura de cada artigo (fórmula do playbook)
1. Título com a keyword principal
2. Introdução curta (2-3 parágrafos) — dor + o que vai aprender
3. Sumário/índice clicável
4. Corpo com H2/H3 contendo variações da keyword
5. Exemplos práticos com números reais
6. CTA natural pro Argos no meio e no final
7. Conclusão com resumo
8. FAQ — 3 a 5 perguntas frequentes sobre o tema

**Meta**: 1 artigo/semana. Mínimo 1.500 palavras para alta prioridade.

---

## Perguntas Frequentes sobre Leilão de Imóvel (para blog)

### INICIANTE — O que é, como funciona, é seguro
| # | Pergunta | Formato |
|---|---|---|
| 1 | O que é leilão de imóvel e como funciona? | Artigo standalone |
| 2 | Leilão de imóvel é seguro? Quais os riscos? | Artigo standalone |
| 3 | Qualquer pessoa pode participar de leilão de imóvel? | FAQ |
| 4 | Precisa de advogado para comprar imóvel em leilão? | FAQ |
| 5 | Qual a diferença entre leilão judicial e extrajudicial? | Artigo standalone |
| 6 | Como funciona o leilão da Caixa Econômica? | Artigo standalone |
| 7 | Leilão de imóvel do Banco do Brasil: como participar? | Artigo standalone |
| 8 | Leilão de imóvel online: como funciona? | Artigo standalone |
| 9 | Vale a pena comprar imóvel em leilão? | Artigo standalone |
| 10 | Quais as vantagens e desvantagens do leilão de imóvel? | Artigo standalone |

### EDITAL — Como ler, interpretar, cuidados
| # | Pergunta | Formato |
|---|---|---|
| 11 | Como analisar o edital de leilão de imóvel? | Artigo standalone (prioridade 1) |
| 12 | O que é matrícula do imóvel e como consultar? | FAQ |
| 13 | O que significa "ônus e gravames" no edital? | FAQ |
| 14 | O que é sub-rogação no edital de leilão? | FAQ |
| 15 | O que verificar antes de dar um lance? | Artigo standalone |
| 16 | O que é a comissão do leiloeiro e quem paga? | FAQ |
| 17 | O que são condições de pagamento no edital? | FAQ |
| 18 | O que é 1ª e 2ª praça no leilão? | FAQ |
| 19 | O que significa "venda ad corpus" no edital? | FAQ |
| 20 | Como saber se o edital tem cláusulas abusivas? | FAQ |

### CUSTOS — ITBI, cartório, comissão, reformas, dívidas
| # | Pergunta | Formato |
|---|---|---|
| 21 | Quais são todos os custos de comprar imóvel em leilão? | Artigo standalone (prioridade 1) |
| 22 | Como calcular o ITBI de imóvel arrematado em leilão? | Artigo standalone |
| 23 | Quanto custa o registro em cartório de imóvel de leilão? | FAQ |
| 24 | Quem paga a comissão do leiloeiro: comprador ou vendedor? | FAQ |
| 25 | O arrematante paga as dívidas de IPTU atrasado? | Artigo standalone |
| 26 | Quem paga o condomínio atrasado do imóvel arrematado? | FAQ |
| 27 | Quanto custa a reforma de um imóvel de leilão? | FAQ |
| 28 | Quais são os custos ocultos do leilão de imóvel? | Artigo standalone (prioridade 1) |
| 29 | É possível parcelar o pagamento no leilão? | FAQ |
| 30 | O desconto do leilão compensa todos os custos extras? | FAQ |

### JURÍDICO — Imóvel ocupado, penhoras, riscos, anulação
| # | Pergunta | Formato |
|---|---|---|
| 31 | Quais os riscos jurídicos de comprar imóvel em leilão? | Artigo standalone (prioridade 1) |
| 32 | O que fazer se o imóvel arrematado estiver ocupado? | Artigo standalone (prioridade 1) |
| 33 | O que é imissão na posse e como funciona? | Artigo standalone |
| 34 | Leilão de imóvel pode ser anulado? Em quais casos? | Artigo standalone |
| 35 | O que é bem de família e pode ser leiloado? | Artigo standalone |
| 36 | O que são penhoras sobrepostas no imóvel? | FAQ |
| 37 | O devedor pode anular o leilão depois da arrematação? | FAQ |
| 38 | O que é evicção no leilão de imóvel? | FAQ |
| 39 | O que acontece se houver ação judicial contra o imóvel? | FAQ |
| 40 | O inquilino tem direito de preferência no leilão? | FAQ |
| 41 | Imóvel com usufruto pode ser leiloado? | FAQ |
| 42 | O que é nulidade processual no leilão? | FAQ |
| 43 | Posso desistir depois de arrematar? | FAQ |
| 44 | O que é direito de preferência do devedor? | FAQ |
| 45 | Como verificar se o imóvel tem pendências judiciais? | FAQ |

### MERCADO — Valor real, desconto, vale a pena, ROI
| # | Pergunta | Formato |
|---|---|---|
| 46 | Como calcular o valor real de mercado de imóvel em leilão? | Artigo standalone (prioridade 1) |
| 47 | Qual o desconto médio em leilão de imóvel? | FAQ |
| 48 | Como calcular o ROI de investimento em leilão? | Artigo standalone |
| 49 | Como saber o preço do m² na região do imóvel? | FAQ |
| 50 | Vale a pena comprar imóvel em leilão para alugar? | Artigo standalone |
| 51 | Como comparar o preço do leilão com o mercado? | FAQ |
| 52 | Imóvel de leilão valoriza depois? | FAQ |
| 53 | Qual o lance máximo que faz sentido pagar? | FAQ |
| 54 | Como saber se o imóvel de leilão é um bom negócio? | Artigo standalone |

### PROCESSO — Como participar, documentos, lance, pagamento
| # | Pergunta | Formato |
|---|---|---|
| 55 | Como participar de leilão de imóvel: passo a passo | Artigo standalone (prioridade 1) |
| 56 | Quais documentos preciso para participar do leilão? | Artigo standalone |
| 57 | Como se habilitar para leilão judicial? | FAQ |
| 58 | Como dar lance em leilão online? | FAQ |
| 59 | Posso usar FGTS para comprar imóvel em leilão? | Artigo standalone |
| 60 | Posso financiar imóvel comprado em leilão? | Artigo standalone |
| 61 | O que é carta de crédito para leilão? | FAQ |
| 62 | Posso usar consórcio para comprar em leilão? | FAQ |
| 63 | Como funciona o pagamento após arrematar? | FAQ |
| 64 | Qual o prazo para pagar após a arrematação? | FAQ |
| 65 | Pessoa jurídica pode comprar imóvel em leilão? | FAQ |

### PÓS-ARREMATAÇÃO — Desocupação, registro, reforma, revenda
| # | Pergunta | Formato |
|---|---|---|
| 66 | O que acontece depois de arrematar o imóvel? | Artigo standalone |
| 67 | O que é carta de arrematação e como obter? | FAQ |
| 68 | Como registrar imóvel de leilão no cartório? | Artigo standalone |
| 69 | Quanto tempo demora o processo pós-arrematação? | FAQ |
| 70 | Como desocupar imóvel arrematado em leilão? | Artigo standalone |
| 71 | Quanto tempo leva a imissão na posse? | FAQ |
| 72 | Posso reformar o imóvel antes de registrar? | FAQ |
| 73 | Como revender imóvel comprado em leilão? | FAQ |
| 74 | Preciso pagar laudêmio em imóvel de leilão? | FAQ |
| 75 | Como transferir água, luz e gás após arrematação? | FAQ |

---

## Google Ads — Estrutura Planejada (do Playbook)

### Campanha A — "Quem já quer resolver" (70% budget)
**Grupo 1 — Busca por ferramenta:**
- "análise de leilão de imóveis"
- "ferramenta leilão imóveis"
- "viabilidade imóvel leilão"
- "analisar edital leilão"
- "software leilão de imóveis"

**Grupo 2 — Busca pela dor:**
- "riscos comprar imóvel leilão"
- "custos ocultos leilão imóvel"
- "como saber se leilão vale a pena"
- "análise jurídica leilão imóvel"

### Campanha B — "Quem está pesquisando" (30% budget)
- "como comprar imóvel em leilão"
- "leilão de imóveis para iniciantes"
- "leilão judicial como funciona"

### Palavras-chave negativas (adicionar ANTES de ativar)
veículos, carros, motos, gado, rural, emprego, vaga, curso, faculdade, arte, joias, eletrônicos, OLX, Mercado Livre, grátis (na Campanha A), leiloeiro, ser leiloeiro

### Orçamento sugerido
- Mês 1: R$ 1.500
- Mês 2: R$ 2.000
- Mês 3: R$ 2.500
- Mês 4-6: R$ 3.000-5.000

---

## Pré-requisitos Técnicos (antes de rodar Ads ou blog)

### Na LP
- [ ] Adicionar Schema.org (SoftwareApplication) no `<head>`
- [ ] Criar página `/obrigado` (para pixel de conversão)
- [ ] Instalar GTM + GA4
- [ ] Link "Blog" no footer (não no nav principal)
- [ ] Criar sitemap.xml
- [ ] Criar robots.txt
- [ ] Gravar vídeo demo (mesmo que rápido, 90s)

### Blog — Infraestrutura
- [ ] Script `build-blog.js` (Markdown → HTML)
- [ ] Template HTML do post
- [ ] Template da listagem
- [ ] CSS do blog (tipografia de leitura)
- [ ] sitemap.xml gerado automaticamente
- [ ] robots.txt

### Google Ads
- [ ] Conta Google Ads criada
- [ ] GTM instalado na LP
- [ ] Tag de conversão configurada
- [ ] Página `/obrigado` com pixel
- [ ] Campanha A com keywords + negativas

---

## Fluxo de Produção de Conteúdo

1. Escolhe keyword da tabela (alta prioridade primeiro)
2. Claude gera rascunho de 1.500+ palavras em .md
3. Revisão humana em ~15 min (tom, dados reais, exemplos locais)
4. Salva em `blog/posts/slug.md`
5. Roda `npm run blog` (gera HTML + sitemap)
6. `git push` → Vercel publica automaticamente
7. Submete ao Google Search Console

---

## Integração Blog + LP + Ads

- **Blog → LP**: Todo artigo tem 2 CTAs (meio + final) que levam para o modal de cadastro
- **LP → Blog**: Link sutil no footer, NÃO no hero
- **Google Ads → Blog**: Campanha B pode apontar para artigos (CPC menor)
- **Blog → SEO → LP**: Cada artigo ranqueado = porta de entrada permanente (custo R$ 0)
- **Remarketing**: Quem leu artigo sem converter → audiência de remarketing

---

## Documentos de Referência

- `Playbook_Argos_SEO_GoogleAds.pdf` — Estratégia completa de SEO + Google Ads
- `Landing Page Argos Otimizacao.md` — Guia de otimização de conversão (8 seções)
- `AGENTS.md` — Arquitetura da plataforma Arremate (backend, pipeline IA, roadmap)

---

## Próximos Passos (em ordem)

1. **Construir infraestrutura do blog** — build script, templates, CSS, sitemap, robots.txt
2. **Primeiro artigo** — "Como Analisar o Edital de Leilão de Imóvel" (1.500+ palavras)
3. **Ajustes na LP** — Schema.org, página /obrigado, link do blog no footer
4. **Configurar GTM + GA4** (precisa ser feito nas contas Google)
5. **Publicar e submeter ao Search Console**
6. **Segundo artigo** e assim por diante (1/semana)

---

*Gerado em 28/06/2026 — Sessão de planejamento Argos Blog + SEO*
