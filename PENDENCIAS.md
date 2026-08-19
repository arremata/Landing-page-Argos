# PENDÊNCIAS — compilação dos 12 artigos

Gerado em 18/08/2026, a partir de `argos-blog-perguntas-e-respostas.md` (revisão 2) e da especificação de execução.

Nada aqui foi preenchido por estimativa. Onde o dado não existia, a pergunta saiu do artigo ou foi escrita sem número, conforme a Seção 3 da especificação.

---

## 1. Perguntas removidas por falta de dado (🔲)

### Artigo 4 — Leilão de imóveis da Caixa
**Pergunta removida:** "Quais são as modalidades de venda de imóvel da Caixa?"

O documento-fonte marca a lista de modalidades como dado a levantar, com a instrução de confirmar direto no portal de Imóveis Caixa e citar a data da consulta. Como a própria resposta direta depende exatamente do que precisa ser confirmado, a pergunta foi removida em vez de publicada pela metade.

**Para reativar:** consultar o portal de Imóveis Caixa, registrar a lista vigente e a data da consulta, e reinserir a pergunta com a data visível no texto. O documento-fonte alerta que vários concorrentes repetem nomenclatura desatualizada — não copiar de blog.

O artigo ficou com 4 perguntas, acima do mínimo de 3.

### Artigo 10 — Imóvel de leilão ocupado
**Pergunta removida:** "Quanto custa desocupar?"

O documento-fonte lista os componentes (honorários advocatícios, custas processuais, diligência de oficial de justiça e valor negociado para saída voluntária), mas não traz nenhum valor, e indica apenas que existe a via amigável — já coberta pela pergunta seguinte, que permaneceu.

**Para reativar:** levantar as tabelas públicas de custas e diligências por tribunal, que o documento-fonte aponta como levantáveis.

O artigo ficou com 9 perguntas.

---

## 2. Dados a produzir (mantidos como lacuna assumida no texto)

### Prazo médio de desocupação por tribunal — Artigo 10
A pergunta "Quanto tempo leva para desocupar na prática?" **foi mantida**, porque o documento-fonte indica o que é seguro afirmar: prazo legal de 60 dias, prazo real dependente do tribunal e da resistência do ocupante, e estimativa conservadora em meses. O texto diz explicitamente que não existe estatística pública consolidada e que número apresentado como "média nacional" não tem fonte verificável.

O documento-fonte classifica este como o dado mais valioso a produzir: fonte possível é o DataJud/CNJ, cruzando classe de reintegração/imissão com data de distribuição e data de cumprimento do mandado.

### Alíquotas de ITBI e emolumentos por município — Artigo 7
A pergunta "Quanto custa além do lance?" **foi mantida** com a faixa de 4% a 6% que o próprio documento-fonte afirma para custos de transmissão. O 🔲 correspondente trata de dado municipal a produzir, não invalida a resposta.

Primeiro lote sugerido pelo documento-fonte: alíquotas de ITBI dos 30 maiores municípios do Paraná e das capitais. É o dado que destrava as páginas por cidade.

---

## 3. Filtro OAB — ocorrência a revisar

Uma única ocorrência, **não corrigida por decisão própria**, conforme a Seção 5 da especificação.

**Artigo 2 — "Preciso de advogado para arrematar?"**

Trecho: *"decidir se vale a pena participar daquele leilão específico, é onde a assessoria se paga"*, seguido de *"O custo de uma análise prévia é uma fração do custo de arrematar um imóvel com uma penhora que você não viu na matrícula."*

O texto é do documento-fonte e não nomeia escritório, não oferece serviço, não menciona honorários nem exibe número de OAB. Ainda assim, afirma o valor econômico da assessoria jurídica, o que fica próximo da linha do Provimento CFOAB 205/2021.

Sinalizo porque o custo de um falso positivo é uma pergunta e o de um falso negativo é uma representação disciplinar. **Decisão sua:** manter como está, suavizar para linguagem estritamente informativa, ou remover a última frase.

---

## 4. Divergências entre a especificação e o repositório

### URL: `/guias/` na especificação, `/blog/` no repositório
A especificação define slugs sob `/guias/`. Por decisão sua, os artigos foram publicados sob `/blog/`, mantendo o slug exato da especificação — por exemplo, `/blog/como-funciona-leilao-de-imoveis/` em vez de `/guias/como-funciona-leilao-de-imoveis`.

O nome do slug não foi alterado; apenas o caminho pai. Se o `/guias/` for retomado depois, será necessário redirecionar.

### Campo `cluster` não existe no documento-fonte
A Seção 2.2 exige o campo e manda não suprimi-lo, mas o documento-fonte não define uma taxonomia de clusters — usa a palavra apenas duas vezes, de forma informal.

Para não inventar taxonomia, o valor foi derivado do próprio raciocínio de ordem de publicação da Parte II: `hub`, `maior volume`, `constrói confiança`, `maior dor` e `fundamentos e apoio`. **Confirme ou substitua** por uma taxonomia própria.

### Assinatura dos artigos ainda não decidida
A Parte VIII lista a assinatura como decisão sua, ainda pendente, e registra que a formulação segura é biografia factual, sem número de OAB como credencial e sem chamada para serviço jurídico.

Todos os 12 artigos estão com `author: "Equipe Argos"`, que era o padrão do gerador. **Decisão pendente:** manter autoria institucional ou adotar autor nomeado com biografia factual, o que o documento aponta como melhor para E-E-A-T e citação em IA.

### `publishedAt` provisório
Os 12 artigos estão com `publishedAt: "2026-08-18"`, data da revisão 2 do documento-fonte. Como estão em `draft`, a data real de publicação ainda não existe. **Atualizar ao mudar o status para `published`.**

---

## 5. Conteúdo antigo — conflito resolvido

Os 5 artigos publicados anteriormente foram despublicados e removidos, por decisão sua, sem redirecionamento. Eram substituídos um a um pelos novos e afirmavam categoricamente pontos que o documento-fonte marca como controvertidos.

As URLs antigas passam a responder 404:

- `/blog/custos-ocultos-leilao-imovel/`
- `/blog/imovel-ocupado-leilao/`
- `/blog/leilao-judicial-vs-extrajudicial/`
- `/blog/como-analisar-edital-leilao/`
- `/blog/como-saber-se-leilao-vale-a-pena/`

O conteúdo permanece no histórico do git.

---

## 6. Fora de escopo, registrado para depois

- **Artigo próprio sobre negociação amigável de saída.** O documento-fonte anota que praticamente ninguém escreve sobre isso no nicho, embora seja o desfecho mais frequente. Hoje é uma pergunta dentro do Artigo 10.
- **Verificador de leiloeiro, calculadora de custo e simulador de financiamento.** A Seção 8 da especificação os coloca fora deste trabalho, com especificação própria. Os artigos 6 e 7 são os pontos naturais de conexão.
- **Páginas programáticas por cidade.** Dependem das alíquotas de ITBI do item 2.
- **`FAQPage` nos novos artigos.** Nenhum dos 12 declara o campo `faq:`, então nenhum emite o schema — o que é conforme. Como as perguntas já são H2 visíveis com resposta logo abaixo, seria legítimo gerar `FAQPage` a partir delas. Decisão editorial, não bloqueio.
- **Ampliação da planilha de palavras-chave.** A Parte I do documento-fonte lista 21 termos a levantar na próxima rodada do Keyword Planner.
