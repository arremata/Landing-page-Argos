// Pessoas que revisam os artigos do blog. O artigo aponta para uma delas com
// `revisor: <id>` no frontmatter e ganha "Revisado por" com biografia e, se
// tiver `notaRevisor`, uma nota com as palavras dessa pessoa.
//
// Biografia so com fatos: sem numero de OAB como credencial, sem nome de
// escritorio e sem oferta de servico juridico.
//
// Enquanto nome ou bio estiverem com PREENCHER, o build recusa publicar artigo
// que use esse revisor: nada sai no ar com dado provisorio.

module.exports = {
  guilherme: {
    nome: 'PREENCHER',
    bio: 'PREENCHER',
  },
};
