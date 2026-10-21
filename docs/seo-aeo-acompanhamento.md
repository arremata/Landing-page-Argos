# SEO e AEO: acompanhamento editorial

## Base consultada em 19/10/2026

Search Console, pesquisa Web, período visível de 05 a 17/10/2026:
169 impressões, 1 clique, CTR de 0,6% e posição média de 20,8.
Consultas mais frequentes: “licitação aberta o que é” (19 impressões),
“o que é licitação aberta” (14) e “desocupação imóvel leilão” (10).
Esses números são agregados e não medem o efeito das mudanças desta branch.

Na aba Páginas do mesmo período: licitação aberta, 80 impressões e nenhum
clique; desocupação, 27 e nenhum clique; dívidas, 20 e nenhum clique;
verificação do leiloeiro, 16 impressões e 1 clique. O volume ainda é pequeno
para atribuir diferenças a uma alteração de título ou estimar conversão.

O título do verbete de licitação aberta foi ajustado no PR #11. Não trocar
novamente com base no mesmo período anterior à publicação.

## Próxima leitura dos dados

Após o Google rastrear as páginas alteradas e acumular dados, comparar períodos
equivalentes de 28 dias, separando página, consulta, dispositivo e país.
Usar impressão, posição e intenção da consulta para interpretar a CTR;
posição média agregada não é a posição fixa de uma página.

- Confirmar que o sitemap foi lido e verificar a cobertura das três novas URLs.
- Inspecionar a URL canônica escolhida pelo Google quando houver divergência.
- Priorizar páginas com impressões recorrentes e intenção compatível.
- Alterar título ou descrição quando houver um descompasso concreto com a busca.
- Registrar data e hipótese de cada mudança; não trocar todos os títulos juntos.
- Não usar uma meta description como promessa de que o Google exibirá aquele texto.

## Recursos disponíveis para citações externas

- `/recursos/checklist-antes-do-lance/`: roteiro público imprimível.
- `/recursos/custo-total-imovel-leilao/`: conta didática com premissas explícitas.
- `/editorial/`: autoria institucional, critérios e canal para correções.

Uma eventual apresentação desses materiais a publicações de educação financeira
ou moradia exige escolha de destinatários e coordenação real. Não há parceiros,
backlinks ou contatos obtidos por esta implementação. Não comprar links, fabricar
depoimentos ou oferecer citações em troca de links que transmitam sinais de ranking.

## Limites de AEO

HTML público, respostas claras e fontes identificáveis facilitam a compreensão,
mas não garantem citações por assistentes, indexação ou posições na busca.
Não existe um schema que assegure presença em respostas de IA. Manter os dados
estruturados coerentes com o conteúdo visível; não atribuir revisão a uma pessoa
sem confirmação de identidade e da participação dela no artigo.

## Catálogo público de imóveis da Caixa (21/10/2026)

Mudança: páginas indexáveis por imóvel, cidade e estado em `/imoveis/caixa/`,
geradas no build a partir do catálogo público do app, com `RealEstateListing`,
`BreadcrumbList`, canonical, Open Graph, data da consulta, fonte e aviso de
confirmação no canal oficial. Novas páginas institucionais: `/como-funciona/`
(com FAQ), `/sobre/`, `/contato/` e `/metodologia/`. A home passou a abrir com
"Encontre imóveis da Caixa sem pagar assinatura" e busca pública.

Hipótese: consultas de cauda longa com cidade e tipo ("apartamento Caixa
Curitiba", "imóveis da Caixa em Londrina") passam a ter páginas que respondem
diretamente. Medir por 28 dias após a indexação, separando `/imoveis/caixa/`
das demais páginas no Search Console.

Pendências externas:

- Enviar `https://www.argosleiloes.com.br/sitemap-imoveis.xml` no Search
  Console e no Bing Webmaster Tools (o robots.txt já aponta os dois sitemaps).
- Criar o Deploy Hook da `main` na Vercel e salvar em `VERCEL_DEPLOY_HOOK_URL`.
- Preencher `GA4_ID` em `lp/medicao.js` e marcar `lead_submit` como evento-chave.
- Quando o app abrir sem login, evitar conteúdo duplicado: as páginas do app
  devem apontar canonical para a página pública equivalente ou ficar `noindex`.
