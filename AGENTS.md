# AGENTS.md — instruções para agentes (Claude Code e outros)

## O projeto

Landing page e blog do **Argos**, plataforma que explica imóveis de leilão
(Caixa e bancos) para quem nunca comprou em leilão. HTML, CSS e JavaScript
puros, sem framework e sem build (o blog é gerado de Markdown por
`scripts/build-blog.js`). Publicação automática na Vercel a cada push na `main`.

Páginas:

| Página | Arquivos |
| --- | --- |
| Home "Quero morar" (`/`) | `index.html`, `lp/client-first.css`, `lp/morar.css`, `lp/leilao.css`, `lp/morar.js`, `lp/leilao.js` |
| Investidor (`/investidor/`) | `investidor/index.html` |
| Blog (`/blog/`) | `blog/posts/*.md` → gerado; `blog/blog-styles.css` |
| Compartilhados | `lp/styles.css` (tokens + base), `lp/script.js` (menu, modal, formulário, reveal) |

## Regra principal: a home segue o DESIGN-SYSTEM.md

**Toda mudança visual na home obedece a `DESIGN-SYSTEM.md`, sem exceção.**
Se algo não couber nas regras, proponha a mudança no documento primeiro e só
mexa no código depois de aprovada.

Resumo (o documento manda):

- Estrutura Client-First em toda seção:
  `section_[nome] > padding-global > container-[small|medium|large] > padding-section-[small|medium|large]`.
- Globais em `lp/client-first.css` (tipografia, `button`, `card`, `tag`,
  `form_input`). Componentes com o prefixo da seção em `lp/morar.css` /
  `lp/leilao.css`. Não crie classe nova se um global resolve.
- Botões: sempre `button` (pílula), variações `is-secondary`, `is-inverse`,
  `is-text`, tamanhos `is-small` / `is-large`.
- Raios: só `var(--radius-round)`, `var(--radius-medium)`, `var(--radius-large)`
  e `50%`. Cores: só tokens (hex apenas no `:root`).
- Movimento: só `transform`/`opacity`, nunca `transition: all`, hover sempre
  dentro de `@media (hover: hover) and (pointer: fine)`, press `scale(0.97)`,
  `prefers-reduced-motion` tratado. Siga as skills de animação em
  `.claude/skills/` (`emil-design-eng`, `review-animations`).
- Fundos das seções alternam branco/cinza na ordem da tabela do documento.

Arquivos compartilhados (`lp/styles.css`, `lp/script.js`) também servem
`/investidor` e o blog: mudanças neles precisam ser aditivas ou testadas nas
três páginas. Classes que o JS usa (`nav`, `nav-links`, `mobile-menu`,
`nav-toggle`, `signup-fab`, `modal-*`, `is-open`, `is-visible`, `is-hidden`,
`lm-*`, `faq-*`, ids e atributos `data-*`) não podem ser renomeadas sem
atualizar o JS — confira com `grep` em `lp/*.js` antes.

## Como rodar

```bash
npm install
npm run dev          # http://localhost:3000 (PORT=3400 npm run dev para outra porta)
npm test             # testes da API da lista de espera
npm run lint:design  # validador do DESIGN-SYSTEM.md
npm run blog         # regenera o blog a partir de blog/posts/
```

## Fluxo de validação (antes de entregar qualquer mudança visual)

1. `npm run lint:design` — tem que passar. Ele aponta raio solto, hex fora do
   `:root`, `transition: all`, `:hover` fora de `@media (hover: hover)`, botão
   sem a classe `button` e texto proibido. Exceções só na lista justificada no
   topo de `scripts/check-design.js`.
2. `npm test`.
3. Abrir a home e `/investidor/` em 1440px e 390px, com e sem "reduzir
   movimento": sem erro no console (falha de Google Fonts offline é esperada),
   sem rolagem horizontal; testar menu que some ao rolar, botão flutuante,
   carrossel, modal "Quero ser avisado" e modal de contato.
4. Pedir revisão ao subagente `design-system-reviewer`
   (`.claude/agents/design-system-reviewer.md`).

## Regras de texto (produto)

- Público: quem nunca comprou em leilão. Tom sério, linguagem culta, frases
  curtas, segunda pessoa, valores em reais.
- Proibido: "análise jurídica", "parecer", "assessoria/consultoria jurídica",
  "recomendamos", "vale a pena", "você deve", "depende" (como resposta
  evasiva), frases de preenchimento ("Grátis. Sem cartão…", "Sem spam",
  "Sem palavra difícil").
- Exemplos numéricos sempre rotulados "Exemplo ilustrativo".
- Não mude textos aprovados sem pedido explícito.

## Git

Commits em português, mensagens curtas e descritivas. Não faça push sem pedido.
