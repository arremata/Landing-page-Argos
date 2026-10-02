# Padrão visual da LP do Argos (Client-First)

Este é o contrato de interface da landing page. **Todo trabalho novo na home
(`index.html`, `lp/client-first.css`, `lp/morar.css`, `lp/leilao.css`) segue
este documento.** Se algo não couber nas regras, ajuste o documento primeiro
(com aprovação) e só depois o código.

A organização das classes segue o **Client-First, da Finsweet**: estrutura
global, utilitários globais e componentes com nome da seção.

> Escopo: a home. A página `/investidor` e o blog ainda usam o CSS antigo
> (`lp/styles.css`) e não foram migrados. Não quebre os dois ao mexer em
> arquivos compartilhados (`lp/styles.css`, `lp/script.js`).

---

## 1. Estrutura de toda seção

```html
<section class="section_[nome]">
  <div class="padding-global">
    <div class="container-[small|medium|large]">
      <div class="padding-section-[small|medium|large]">
        <!-- conteúdo: [nome]_component, [nome]_header, [nome]_list ... -->
      </div>
    </div>
  </div>
</section>
```

- `section_[nome]`: uma por seção, em minúsculas, com `_` (ex.: `section_hero`,
  `section_leilao`, `section_faq`). O `id` da âncora fica na section.
- Classes de componente usam o prefixo da seção: `faq_item`, `faq_question`,
  `leilao_slide`, `hero_myths`.
- Variações usam combo class `is-*`: `button is-secondary`, `card is-hoverable`.
- Não crie classe nova se já existe uma global que resolve.

### Fundos alternados (fixo)

| Ordem | Seção | Fundo |
| --- | --- | --- |
| 1 | hero | `background-color-primary` (branco) |
| 2 | leilão em 1 minuto | `background-color-secondary` (cinza) |
| 3 | vídeo | branco |
| 4 | atendimento | cinza |
| 5 | dúvidas | branco |
| 6 | chamada final | cinza |

Seção nova entra mantendo a alternância.

## 2. Tokens (em `lp/styles.css :root`)

### Cores
| Token | Uso |
| --- | --- |
| `--violet` #7C3AED | marca, botão principal, destaques |
| `--violet-hover` #6D28D9 | hover do botão principal |
| `--violet-bg` | fundo de selo/ícone roxo claro |
| `--violet-border` | borda roxa suave (hover de card) |
| `--text` / `--text-2` / `--text-3` | título / corpo / apoio (todos AA) |
| `--bg-soft` | fundo das seções cinza e campos |
| `--border` | bordas neutras |
| `--green` / `--green-bg` / `--green-text` | confirmação, desconto |

Nenhuma cor em hex fora do `:root` (exceção: ilustrações SVG inline).

### Raios — só estes quatro
| Token | Valor | Onde |
| --- | --- | --- |
| `--radius-round` | 999px | **todos os botões**, selos, chips, pílulas, pontos |
| `--radius-medium` | 12px | campos de formulário, itens pequenos (linhas de FAQ, ícones quadrados) |
| `--radius-large` | 20px | cards, painéis, modal, carrossel, faixa da chamada final |
| `50%` | — | círculos (ícones redondos, check) |

Nada de 4/6/8/10/14/28px soltos.

### Larguras (containers)
| Classe | Largura | Uso |
| --- | --- | --- |
| `container-small` | 800px | hero, dúvidas |
| `container-medium` | 960px | carrossel, vídeo, atendimento |
| `container-large` | 1120px | chamada final, menu |
| `max-width-small` | 640px | títulos e textos de seção centralizados |

`padding-global`: 24px nas laterais (16px abaixo de 640px).

### Espaço vertical das seções
| Classe | Desktop | Celular |
| --- | --- | --- |
| `padding-section-small` | 64px | 48px |
| `padding-section-medium` | 96px | 64px |
| `padding-section-large` | 128px | 80px |

Padrão: `padding-section-medium`. Chamada final: `small`.

## 3. Tipografia

| Classe | Tamanho | Uso |
| --- | --- | --- |
| `heading-style-h1` | clamp(34px, 4.1vw, 54px), 800, entrelinha 1.14 | só o título do hero |
| `heading-style-h2` | clamp(28px, 3.2vw, 40px), 700 | título de seção |
| `heading-style-h3` | clamp(22px, 2.4vw, 28px), 800 | título de slide/card grande |
| `heading-style-h4` | 18px, 700 | título de card/item |
| `text-size-large` | 18px, entrelinha 1.75 | subtítulo do hero |
| `text-size-medium` | 16px | corpo |
| `text-size-regular` | 15px | listas, apoio |
| `text-size-small` | 13px | notas, rótulos |
| `text-style-tagline` | 13px, 700, roxo, maiúsculas | rótulo acima do título de seção |

Utilitários: `text-weight-semibold`, `text-weight-bold`, `text-color-primary`,
`text-color-secondary`, `text-color-muted`, `text-color-brand`, `text-align-center`.

Destaque dentro de texto: `<strong>` em `--text`, peso 600. Nada de sublinhado ou
cor nova para destacar.

## 4. Botões — formato único: pílula

| Classe | Aparência | Hover (só com mouse) |
| --- | --- | --- |
| `button` | fundo roxo, texto branco | fundo `--violet-hover`, sombra roxa |
| `button is-secondary` | fundo branco, borda `--border`, texto `--text` | borda e texto roxos, fundo `--violet-bg` |
| `button is-inverse` | fundo branco, texto roxo (para fundo escuro) | fundo roxo, texto branco, borda branca |
| `button is-text` | só texto roxo, sublinhado ao passar | sublinhado aparece |

Tamanhos: `is-small` 40px de altura, padrão 48px, `is-large` 52px.
Ícone: `<svg>` 16px dentro do botão, à esquerda (ação) ou à direita (seta).

Regras:
- **Todo botão é pílula** (`--radius-round`). Sem exceção.
- Press em todos: `transform: scale(0.97)` em 160ms.
- Hover nunca move o botão para cima.
- Um botão principal por bloco. Os outros são `is-secondary` ou `is-text`.
- Textos de ação: "Quero ser avisado", "Quero me inscrever", "Falar com a equipe",
  "Entrar em contato", "Entender o leilão em 1 minuto".

## 5. Cards, selos e campos

- `card`: fundo branco, borda `--border`, `--radius-large`, sombra `--shadow-sm`.
  - `card is-hoverable` só quando **clicável**: hover com borda `--violet-border`
    e sombra `--shadow-md`. Card que não é clicável não reage ao mouse, exceto os
    cartões didáticos do carrossel, que só realçam a borda.
- `tag`: selo pílula, 13px/600. Variações `is-brand`, `is-success`, `is-warning`,
  `is-neutral`.
- Campos (`form_input`, `form_textarea`): `--radius-medium`, fundo `--bg-soft`,
  foco com borda roxa e anel de 3px.

## 6. Movimento

Siga as skills de Emil Kowalski em `.claude/skills/` (`emil-design-eng`,
`review-animations`). Resumo obrigatório:

- Animar só `transform` e `opacity`. Nunca `transition: all`.
- Curvas: `--ease-out` (entradas), `--ease-in-out` (movimento na tela), `ease`
  (cor/hover). Nunca `ease-in`.
- Durações: press 160ms, hover/cor 150–200ms, UI 200–300ms, modal 240ms,
  entrada de página até 600ms.
- Todo hover dentro de `@media (hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion`: sem deslocamento, só fade curto.
- Sem animação infinita. Animação só com propósito (feedback, estado,
  explicação, evitar salto).

## 7. Texto (regras do produto)

Público: quem nunca comprou em leilão. Tom sério, linguagem culta, frases curtas,
segunda pessoa, valores em reais.
Proibido: "análise jurídica", "parecer", "assessoria/consultoria jurídica",
"recomendamos", "vale a pena", "você deve", "depende", frases de preenchimento
("Grátis. Sem cartão…", "Sem spam", "Sem palavra difícil").
Exemplos numéricos sempre rotulados "Exemplo ilustrativo".

## 8. Como validar antes de entregar

1. `npm run lint:design` — checagem automática deste documento (raios soltos,
   cores fora do `:root`, `transition: all`, hover sem `@media (hover: hover)`,
   botão sem a classe `button`).
2. `npm test`.
3. Abrir em 1440px e 390px, com e sem "reduzir movimento"; sem erro no console e
   sem rolagem horizontal.
4. Pedir revisão ao agente `design-system-reviewer` (`.claude/agents/`).
