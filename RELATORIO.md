# RELATÓRIO — compilação do blog

18/08/2026 · fonte: `argos-blog-perguntas-e-respostas.md` (revisão 2) + especificação de execução

---

## O que foi feito

**12 artigos criados**, todos em `status: draft`, com 66 das 68 perguntas do documento-fonte. As duas ausentes estão justificadas em [PENDENCIAS.md](PENDENCIAS.md) — nenhuma foi omitida por conveniência.

**5 artigos antigos removidos**, por decisão sua, sem redirecionamento.

**Gerador estendido** para atender à especificação.

---

## Mudanças no gerador

O `scripts/build-blog.js` foi estendido, não substituído. Migrar para Next.js ou CMS seria redesenho, que a Seção 8 coloca fora de escopo.

**Filtro de rascunho.** Era o bloqueio real: o gerador publicava tudo que estivesse em `blog/posts/`. Sem isso, criar os 12 arquivos os colocaria no ar no próximo deploy — o oposto do pedido. O default é `draft`, de propósito: um artigo só vai ao ar quando alguém escrever `published`, nunca por esquecimento.

**Limpeza de diretórios órfãos.** Artigo removido ou revertido para rascunho tem o diretório apagado. Sem isso o HTML antigo continuaria acessível por URL direta, mesmo fora da listagem e do sitemap. Foi o que despublicou os 5 antigos de fato.

**FAQ visível acoplado ao schema.** O gerador emitia `FAQPage` a partir do frontmatter sem que as perguntas aparecessem na página — violação de diretriz do Google, ativa nos 5 artigos que estavam no ar. Agora as duas saídas nascem da mesma função e não podem ser usadas em separado.

**`BreadcrumbList`** adicionado, exigido pela Seção 4 e ausente.

**Data de atualização visível.** "Atualizado em [data]" no cabeçalho de todo artigo, com `updatedAt` no frontmatter e `dateModified` no schema. O `updatedAt` nunca cai para a data de build: se faltar, herda a de publicação, que é um fato real.

**Disclaimer da Parte VI** no rodapé de todos os artigos, no texto exato da Seção 5.

**Frontmatter** com `keywordPrincipal`, `publishedAt`, `updatedAt`, `cluster` e `status`. Os nomes antigos seguem aceitos para não quebrar artigo legado.

---

## Decisões tomadas na conversão

**Marcadores ⚠️ — a ressalva virou texto de leitor.** Onde o documento-fonte trazia instrução explícita de como escrever, ela foi seguida literalmente. Os três pontos que precisavam sobreviver como controvérsia sobreviveram:

| Ponto | Onde | Como ficou |
|---|---|---|
| Tema 1134 no extrajudicial | Artigos 4 e 9 | Regra do edital como cenário de cálculo, Tema 1134 como argumento existente e não testado nesse contexto, resposta dependente do caso |
| Débitos condominiais | Artigo 9 | Duas correntes descritas, ausência de prequestionamento do art. 908, § 1º mencionada, e o não-julgamento de mérito de maio de 2026 |
| Primeira praça extrajudicial | Artigo 3 | Lacuna declarada, com a ressalva de que a prática dos editais é alocação contratual de risco, não solução dos tribunais |

Nenhum dos três saiu como afirmação categórica. Também não foi escrito "há divergência jurisprudencial" e ponto: em todos, o leitor sai sabendo o que fazer diante da incerteza.

Dois ⚠️ menores viraram ressalva no corpo: o alcance do Tema 1113 (firmado sobre compra e venda, não sobre arrematação) no Artigo 7, e o peso da orientação do DREI sobre territorialidade (recurso não conhecido, considerações de mérito subsidiárias) no Artigo 6. Um terceiro era instrução de **não** escrever algo — o Tema 1124 do STF, que não tem tese final — e por isso simplesmente não aparece.

**Nenhum marcador vazou.** Zero ocorrências de ⚠️, 🔲, "PONTO EM DISPUTA" ou "DADO A LEVANTAR" nos arquivos publicáveis.

**Referências `[Artigo N]` substituídas por links reais.** Todas.

**Malha de links da Seção 6 implementada.** O hub linka para os 11 demais; 9, 10 e 11 se cruzam; 4 → 3, 8, 9; 5 → 6; 2 → 3, 4; 12 → 9, 11; todos → 1. Âncoras em linguagem natural, sem "clique aqui" e sem repetir a mesma âncora para destinos diferentes. Cross-referências que o próprio documento-fonte fazia ("Ver Artigo 9") também viraram links. Verifiquei que todos apontam para slug existente.

**Estrutura preservada.** Perguntas como H2, na forma interrogativa, com a resposta direta nos dois primeiros períodos — o bloco que alimenta featured snippet e citação em IA. A ordem interna resposta direta → detalhe → base legal → na prática foi mantida.

**Uma duplicação da fonte foi consolidada.** No Artigo 4, o parágrafo "Como escrever isso sem induzir ninguém ao erro" aparece duas vezes no documento-fonte, em versões quase idênticas. Compilei uma vez, com o conteúdo das duas.

---

## O que precisa de revisão humana antes de publicar

1. **A ocorrência do filtro OAB** no Artigo 2 — a única, descrita em PENDENCIAS.md. Não corrigi por conta própria, como manda a Seção 5.
2. **A taxonomia de `cluster`**, derivada da Parte II porque o documento-fonte não a define.
3. **A assinatura dos artigos**, que a Parte VIII lista como decisão sua e segue pendente.
4. **O `publishedAt`**, hoje provisório em 18/08/2026.
5. **Revisão jurídica de leitura**, artigo por artigo. Compilei sem alterar conteúdo jurídico, mas a conversão das ressalvas de linguagem técnica para linguagem de leitor envolveu reescrita de forma — e é exatamente onde um deslize mudaria o sentido.

---

## Verificações executadas

- 12 arquivos criados, todos com `status: draft`
- Nenhum marcador interno vazou
- Nenhuma referência `[Artigo N]` sobrou
- Todos os links internos apontam para slug existente
- Todos os artigos linkam para o hub
- Filtro OAB rodado: nenhum termo de bloqueio direto; uma ocorrência sinalizada
- Build testado ponta a ponta com um artigo publicado: `Article`, `BreadcrumbList`, "Atualizado em" e disclaimer presentes no HTML; nenhum `FAQPage` sem FAQ visível
- Artigo revertido para `draft` e diretório de teste limpo pelo próprio gerador

**Uma observação sobre o ambiente:** durante o trabalho, quatro arquivos versionados foram apagados do diretório local sem que eu os tivesse tocado — `blog/blog-styles.css`, `lp/styles.css`, `data/.gitkeep` e `RESUMO-SESSAO-BLOG.md`. Restaurei os quatro a partir do git. Não identifiquei a causa; como o `lp/styles.css` sustenta a landing inteira, vale conferir se o diretório está sincronizado com OneDrive ou sob antivírus, que são as causas prováveis.

---

## O que não foi feito

Nada de ferramenta, redesign, alteração de pipeline ou imagem — tudo fora de escopo pela Seção 8. Nenhum conteúdo jurídico novo foi produzido: cada fato, número, prazo, artigo de lei e precedente do site existe no documento-fonte.
