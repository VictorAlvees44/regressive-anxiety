/** Estreias e relançamentos confirmados que a descoberta automática pode omitir. */
const DESTAQUES = [
  {
    id: "amazon-mgm-verity-2026",
    titulo: "Verity",
    aliases: ["Colleen Hoover Verity"],
    descricao: "Adaptação do romance de Colleen Hoover, com Anne Hathaway e Dakota Johnson.",
    data: "2026-10-02",
    fonte: "amazon-mgm",
    imagemUrl: "https://assets.aboutamazon.com/dims4/default/dd8630a/2147483647/strip/true/crop/4500x2532%2B0%2B0/resize/1320x743%21/quality/90/?url=https%3A%2F%2Fassets.aboutamazon.com%2Fec%2F21%2Fba7027754337b1316c5b337b9420%2Fverity-v-17037-r-rgb.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=xdPMKhjMSFs",
    urlOficial: "https://www.aboutamazon.com/news/entertainment/verity-colleen-hoover-amazon-mgm-studios",
  },
  {
    id: "disney-endgame-encore-2026",
    titulo: "Vingadores: Ultimato Encore",
    aliases: ["Avengers Endgame Encore", "Vingadores Ultimato", "Avengers Endgame"],
    descricao: "Relançamento de Vingadores: Ultimato nos cinemas, em apresentação especial antes de Avengers: Doomsday.",
    data: "2026-09-24",
    fonte: "disney",
    imagemUrl: "https://lumiere-a.akamaihd.net/v1/images/image002_85a2fd37.png?region=0%2C0%2C397%2C591",
    trailerUrl: "https://www.youtube.com/watch?v=L2NAh3CIdig",
    urlOficial: "https://prensa.disneylatino.com/novedades/marvel-studios-presenta-los-nuevos-tr%C3%A1iler-y-p%C3%B3ster-de-avengers-endgame-bonus",
  },
];

export function destaquesFilmesConfirmados(agora = Date.now()) {
  return DESTAQUES.filter(({ data }) => {
    const lancamento = Date.parse(`${data}T12:00:00.000Z`);
    return lancamento >= agora - 183 * 86_400_000 && lancamento <= agora + 730 * 86_400_000;
  }).map(({ id, titulo, aliases, descricao, data, fonte, imagemUrl, trailerUrl, urlOficial }) => {
    const dataLancamentoISO = `${data}T12:00:00.000Z`;
    return {
      id: `sug-${id}`, titulo, aliases, descricao, categoria: "filmes", dataLancamentoISO,
      imagemUrl, plataformas: ["Cinema"], linksOficiais: [{ label: "Fonte oficial", url: urlOficial }],
      trailerUrl, idExterno: id, fonte, tipoConteudo: "lancamento", relevancia: 150_000,
      momento: Date.parse(dataLancamentoISO) < agora ? "disponivel" : "em-breve",
    };
  });
}
