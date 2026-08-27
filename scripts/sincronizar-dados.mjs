#!/usr/bin/env node
/**
 * Monta o catálogo público diário. As fontes são consultadas no servidor da
 * Action; nenhuma chave ou chamada de terceiros chega ao navegador.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SAIDA = path.resolve("public/data/sugestoes.json");
const SAUDE_SAIDA = path.resolve("public/data/saude-sincronizacao.json");
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const DIA = 86_400_000;
const agora = Date.now();
const emDoisAnos = new Date(agora + 730 * DIA).toISOString().slice(0, 10);
const haUmAno = new Date(agora - 365 * DIA).toISOString().slice(0, 10);
const haSeisMeses = new Date(agora - 183 * DIA).toISOString().slice(0, 10);
const haDezoitoMeses = new Date(agora - 548 * DIA).toISOString().slice(0, 10);
const PLATAFORMAS_PREFERIDAS = /steam|gog|playstation|xbox/i;
const TERMOS_INADEQUADOS = /hentai|adult|erotic|sexual|nsfw|nudity|porn/i;

function iso(data) {
  const valor = new Date(data).getTime();
  return Number.isNaN(valor) ? null : new Date(valor).toISOString();
}
function momento(data) { return new Date(data).getTime() < agora ? "disponivel" : "em-breve"; }
function normalizarImagemIgdb(url) { return url ? `https:${url.replace("t_thumb", "t_cover_big")}` : undefined; }
function prioridadeJogo(jogo) {
  const base = Number(jogo.total_rating_count ?? jogo.rating_count ?? 0);
  const plataformas = (jogo.platforms ?? []).map((plataforma) => plataforma.name ?? plataforma).join(" ");
  return base + (PLATAFORMAS_PREFERIDAS.test(plataformas) ? 50_000 : 0);
}
function jogoIndesejado(jogo) {
  return TERMOS_INADEQUADOS.test([jogo.name, jogo.title, jogo.summary, ...(jogo.tags ?? []).map((tag) => tag.name ?? tag)].filter(Boolean).join(" "));
}

async function json(url, opcoes) {
  try {
    const resposta = await fetch(url, opcoes);
    return resposta.ok ? resposta.json() : null;
  } catch { return null; }
}

async function obterTokenIgdb() {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) return null;
  const dados = await json(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`, { method: "POST" });
  return dados?.access_token ?? null;
}

async function buscarJogosIgdb() {
  const token = await obterTokenIgdb();
  if (!token) return [];
  const inicio = Math.floor((agora - 365 * DIA) / 1000);
  const fim = Math.floor((agora + 730 * DIA) / 1000);
  const corpo = `fields name, first_release_date, cover.url, screenshots.url, websites.url, platforms.name, total_rating_count; where first_release_date >= ${inicio} & first_release_date <= ${fim}; sort total_rating_count desc; limit 400;`;
  const jogos = await json("https://api.igdb.com/v4/games", { method: "POST", headers: { "Client-ID": IGDB_CLIENT_ID, Authorization: `Bearer ${token}`, "Content-Type": "text/plain" }, body: corpo });
  return (jogos ?? []).filter((jogo) => !jogoIndesejado(jogo) && Number(jogo.total_rating_count ?? 0) >= 10).map((jogo) => {
    const data = iso(jogo.first_release_date * 1000);
    return data && { id: `sug-igdb-${jogo.id}`, titulo: jogo.name, categoria: "jogos", dataLancamentoISO: data, imagemUrl: normalizarImagemIgdb(jogo.cover?.url), bannerUrl: normalizarImagemIgdb(jogo.screenshots?.[0]?.url), plataformas: jogo.platforms?.map((plataforma) => plataforma.name), linksOficiais: jogo.websites?.slice(0, 2).map((site) => ({ label: "Site oficial", url: site.url })), idExterno: `igdb-${jogo.id}`, fonte: "igdb", momento: momento(data), relevancia: prioridadeJogo(jogo) };
  }).filter(Boolean);
}

/** Fonte sem credencial: catálogo de lançamentos recentes e próximos da Steam. */
async function buscarJogosSteam() {
  const dados = await json("https://store.steampowered.com/api/featuredcategories?cc=br&l=portuguese");
  const itens = [...(dados?.coming_soon?.items ?? []), ...(dados?.specials?.items ?? [])];
  return itens.map((jogo) => {
    const data = iso((jogo.release_date ?? 0) * 1000);
    if (!data || new Date(data).getTime() < agora - 365 * DIA || new Date(data).getTime() > agora + 730 * DIA) return null;
    return { id: `sug-steam-${jogo.id}`, titulo: jogo.name, categoria: "jogos", dataLancamentoISO: data, imagemUrl: jogo.large_capsule_image ?? jogo.small_capsule_image, plataformas: ["Steam"], linksOficiais: [{ label: "Ver na Steam", url: `https://store.steampowered.com/app/${jogo.id}` }], idExterno: `steam-${jogo.id}`, fonte: "steam", momento: momento(data), relevancia: 5_000 };
  }).filter((jogo) => jogo && !jogoIndesejado(jogo));
}

/** Catálogo público da Epic Games Store, sem depender de chave de API. */
async function buscarJogosEpic() {
  const dados = await json("https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR");
  const jogos = dados?.data?.Catalog?.searchStore?.elements ?? dados?.Catalog?.searchStore?.elements ?? [];
  return jogos.map((jogo) => {
    const data = iso(jogo.releaseDate ?? jogo.effectiveDate);
    if (!data || new Date(data).getTime() < agora - 365 * DIA || new Date(data).getTime() > agora + 730 * DIA) return null;
    const imagem = jogo.keyImages?.find((item) => item.type === "OfferImageWide" || item.type === "DieselStoreFrontWide")?.url ?? jogo.keyImages?.[0]?.url;
    const slug = jogo.productSlug ?? jogo.urlSlug;
    return { id: `sug-epic-${jogo.id}`, titulo: jogo.title, descricao: jogo.description?.slice(0, 300), categoria: "jogos", dataLancamentoISO: data, imagemUrl: imagem, plataformas: ["Epic Games Store"], linksOficiais: slug ? [{ label: "Ver na Epic", url: `https://store.epicgames.com/pt-BR/p/${slug}` }] : undefined, idExterno: `epic-${jogo.id}`, fonte: "epic", momento: momento(data), relevancia: 5_000 };
  }).filter((jogo) => jogo?.titulo && !jogoIndesejado(jogo));
}

/** Catálogo da GOG para ampliar os jogos de PC sem depender da Steam. */
async function buscarJogosGog() {
  const dados = await json("https://catalog.gog.com/v1/catalog?limit=100&order=desc:trending&productType=game&country=BR&locale=pt-BR");
  return (dados?.products ?? []).filter((jogo) => !jogoIndesejado(jogo)).map((jogo) => {
    const data = iso(jogo.storeReleaseDate || jogo.releaseDate);
    if (!data || new Date(data).getTime() < agora - 365 * DIA || new Date(data).getTime() > agora + 730 * DIA || !jogo.title) return null;
    return { id: `sug-gog-${jogo.id}`, titulo: jogo.title, descricao: jogo.developers?.length ? `Jogo para PC da ${jogo.developers.join(", ")}.` : "Jogo para PC disponível na GOG.", categoria: "jogos", dataLancamentoISO: data, imagemUrl: jogo.coverHorizontal ?? jogo.galleryBackgroundImage ?? jogo.coverVertical, plataformas: ["GOG", "PC"], linksOficiais: jogo.storeLink ? [{ label: "Ver na GOG", url: jogo.storeLink }] : undefined, idExterno: `gog-${jogo.id}`, fonte: "gog", momento: momento(data), relevancia: 25_000 + Number(jogo.reviewsCount ?? 0) };
  }).filter(Boolean);
}

/** RAWG voltou a operar e complementa os jogos relevantes sem virar dependência única. */
async function buscarJogosRawg() {
  if (!RAWG_API_KEY) return [];
  const dados = await json(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${haUmAno},${emDoisAnos}&ordering=-metacritic&page_size=100`);
  return (dados?.results ?? []).filter((jogo) => !jogoIndesejado(jogo) && (Number(jogo.metacritic ?? 0) >= 65 || Number(jogo.ratings_count ?? 0) >= 150)).map((jogo) => {
    const data = iso(jogo.released);
    if (!data || !jogo.name) return null;
    const plataformas = (jogo.parent_platforms ?? []).map((item) => item.platform?.name).filter(Boolean);
    return { id: `sug-rawg-${jogo.id}`, titulo: jogo.name, categoria: "jogos", dataLancamentoISO: data, imagemUrl: jogo.background_image ?? undefined, plataformas, linksOficiais: [{ label: "Ver detalhes", url: `https://rawg.io/games/${jogo.slug}` }], idExterno: `rawg-${jogo.id}`, fonte: "rawg", momento: momento(data), relevancia: prioridadeJogo({ rating_count: jogo.ratings_count, platforms: plataformas }) + Number(jogo.metacritic ?? 0) * 1_000 };
  }).filter(Boolean);
}

const CATALOGOS_BR = [
  { rotulo: "Netflix", nomes: ["Netflix"] },
  { rotulo: "Prime Video", nomes: ["Amazon Prime Video", "Prime Video"] },
  { rotulo: "Disney+", nomes: ["Disney Plus", "Disney+"] },
  { rotulo: "Max", nomes: ["Max", "HBO Max"] },
];

function sugestaoTmdbFilme(item, plataforma) {
  const data = iso(item.release_date);
  return data && {
    id: `sug-tmdb-movie-${plataforma.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.id}`,
    titulo: item.title,
    descricao: item.overview?.slice(0, 300) || "Sinopse em português ainda não disponível.",
    categoria: "filmes",
    dataLancamentoISO: data,
    imagemUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
    plataformas: [plataforma],
    linksOficiais: [{ label: "Ver detalhes", url: `https://www.themoviedb.org/movie/${item.id}?language=pt-BR` }],
    idExterno: `tmdb-movie-${item.id}`,
    fonte: "tmdb",
    momento: momento(data),
  };
}

function sugestaoTmdbSerie(item, plataforma) {
  const data = iso(item.first_air_date);
  return data && {
    id: `sug-tmdb-tv-${plataforma.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${item.id}`,
    titulo: item.name,
    descricao: item.overview?.slice(0, 300) || "Série disponível no Brasil.",
    categoria: "series",
    dataLancamentoISO: data,
    imagemUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
    bannerUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
    plataformas: [plataforma],
    linksOficiais: [{ label: "Ver detalhes", url: `https://www.themoviedb.org/tv/${item.id}?language=pt-BR` }],
    idExterno: `tmdb-tv-${item.id}`,
    fonte: "tmdb",
    momento: "disponivel",
  };
}

/** Filmes que de fato estão disponíveis no Brasil pelos catálogos escolhidos. */
async function buscarFilmesDosCatalogosBr() {
  if (!TMDB_API_KEY) return [];
  const provedores = await json(`https://api.themoviedb.org/3/watch/providers/movie?api_key=${TMDB_API_KEY}&language=pt-BR`);
  if (!provedores?.results?.length) {
    console.warn("TMDB não retornou os provedores de filmes do Brasil. Confira a chave TMDB_API_KEY.");
    return [];
  }
  const porNome = new Map((provedores?.results ?? []).map((item) => [item.provider_name, item.provider_id]));
  const buscas = CATALOGOS_BR.map(async ({ rotulo, nomes }) => {
    const id = nomes.map((nome) => porNome.get(nome)).find(Boolean);
    if (!id) return [];
    const paginas = await Promise.all([1, 2, 3].map((pagina) => json(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_monetization_types=flatrate&with_watch_providers=${id}&primary_release_date.gte=${haSeisMeses}&sort_by=popularity.desc&page=${pagina}`)));
    return paginas.flatMap((dados) => dados?.results ?? []).map((item) => sugestaoTmdbFilme(item, rotulo)).filter(Boolean);
  });
  return (await Promise.all(buscas)).flat();
}

/** Lançamentos recentes em salas brasileiras; a disponibilidade por rede varia por cidade. */
async function buscarFilmesEmCartazNoBrasil() {
  if (!TMDB_API_KEY) return [];
  const inicio = haSeisMeses;
  const dados = await json(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=pt-BR&region=BR&with_release_type=2|3&primary_release_date.gte=${inicio}&primary_release_date.lte=${emDoisAnos}&sort_by=popularity.desc`);
  return (dados?.results ?? []).map((item) => sugestaoTmdbFilme(item, "Em cartaz nos cinemas do Brasil")).filter(Boolean);
}

function decodificarXml(texto = "") { return texto.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); }
function removerHtml(texto = "") { return decodificarXml(texto).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
function valorXml(bloco, tag) {
  return decodificarXml(bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "");
}

/** Séries disponíveis no Brasil pelos mesmos catálogos escolhidos para filmes. */
async function buscarSeriesDosCatalogosBr() {
  if (!TMDB_API_KEY) return [];
  const provedores = await json(`https://api.themoviedb.org/3/watch/providers/tv?api_key=${TMDB_API_KEY}&language=pt-BR`);
  if (!provedores?.results?.length) {
    console.warn("TMDB não retornou os provedores de séries do Brasil. Confira a chave TMDB_API_KEY.");
    return [];
  }
  const porNome = new Map((provedores?.results ?? []).map((item) => [item.provider_name, item.provider_id]));
  const buscas = CATALOGOS_BR.map(async ({ rotulo, nomes }) => {
    const id = nomes.map((nome) => porNome.get(nome)).find(Boolean);
    if (!id) return [];
    const paginas = await Promise.all([1, 2, 3].map((pagina) => json(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&watch_region=BR&with_watch_monetization_types=flatrate&with_watch_providers=${id}&first_air_date.gte=${haDezoitoMeses}&sort_by=popularity.desc&page=${pagina}`)));
    return paginas.flatMap((dados) => dados?.results ?? []).map((item) => sugestaoTmdbSerie(item, rotulo)).filter(Boolean);
  });
  return (await Promise.all(buscas)).flat();
}

async function buscarImagemDaPagina(url) {
  try {
    const resposta = await fetch(url, { headers: { "User-Agent": "RegressiveAnxiety/1.0" } });
    if (!resposta.ok) return undefined;
    const html = await resposta.text();
    const meta = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["'][^>]*>/i);
    return meta?.[1]?.replace(/&amp;/g, "&");
  } catch { return undefined; }
}

/** Comunicados diretos das fabricantes; data é a publicação, nunca uma data de lançamento presumida. */
async function buscarAtualizacoesOficiais({ fonte, nome, plataforma, url, baseUrl }) {
  try {
    const resposta = await fetch(url, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
    if (!resposta.ok) return [];
    const xml = await resposta.text();
    const entradas = [...xml.matchAll(/<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g)].slice(0, 40);
    return Promise.all(entradas.slice(0, 20).map(async ([, entrada], indice) => {
      const titulo = removerHtml(valorXml(entrada, "title"));
      const data = iso(valorXml(entrada, "pubDate") || valorXml(entrada, "published") || valorXml(entrada, "updated"));
      const linkDireto = valorXml(entrada, "link");
      const linkAtom = entrada.match(/<link[^>]+href=["']([^"']+)["']/)?.[1];
      const link = linkDireto || linkAtom;
      if (!titulo || !data || !link || new Date(data).getTime() < agora - 30 * DIA) return null;
      const urlCompleta = /^https?:\/\//i.test(link) ? link : new URL(link, baseUrl).toString();
      const imagemUrl = await buscarImagemDaPagina(urlCompleta);
      return { id: `sug-${fonte}-${new Date(data).getTime()}-${indice}`, titulo, descricao: `Novidade oficial publicada pela ${nome}. Abra para conferir os detalhes.`, categoria: "jogos", dataLancamentoISO: data, imagemUrl, plataformas: [plataforma], linksOficiais: [{ label: `Abrir no ${nome}`, url: urlCompleta }], idExterno: `${fonte}-${urlCompleta}`, fonte, momento: "disponivel", tipoConteudo: "atualizacao-oficial", relevancia: 20_000 };
    })).then((itens) => itens.filter(Boolean));
  } catch { return []; }
}

/** Destaques de lançamento confirmados pelas próprias publicadoras. */
async function buscarDestaquesConfirmados() {
  const gtaVI = "2026-11-19T05:00:00.000Z";
  if (new Date(gtaVI).getTime() < agora - 30 * DIA || new Date(gtaVI).getTime() > agora + 730 * DIA) return [];
  const siteOficial = "https://www.rockstargames.com/VI";
  const capaRawg = RAWG_API_KEY
    ? await json(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent("Grand Theft Auto VI")}&page_size=1`)
    : null;
  const imagemUrl = await buscarImagemDaPagina(siteOficial) ?? capaRawg?.results?.[0]?.background_image ?? undefined;
  return [{
    id: "sug-rockstar-gta-vi",
    titulo: "Grand Theft Auto VI",
    descricao: "A volta a Vice City chega primeiro ao PlayStation 5 e Xbox Series X|S.",
    categoria: "jogos",
    dataLancamentoISO: gtaVI,
    imagemUrl,
    plataformas: ["PlayStation 5", "Xbox Series X|S"],
    linksOficiais: [{ label: "Site oficial", url: siteOficial }],
    idExterno: "rockstar-gta-vi",
    fonte: "rockstar",
    momento: momento(gtaVI),
    tipoConteudo: "lancamento",
    relevancia: 150_000,
  }];
}
async function buscarNoticias(sugestao) {
  const termo = sugestao.categoria === "jogos" ? "jogo" : sugestao.categoria === "filmes" ? "filme" : "série";
  try {
    const resposta = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(`${sugestao.titulo} ${termo}`)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`);
    if (!resposta.ok) return [];
    const xml = await resposta.text();
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3).map(([, item]) => {
      const pegar = (tag) => decodificarXml(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "");
      const url = pegar("link"); const titulo = pegar("title");
      return url && titulo ? { titulo, url, fonte: pegar("source"), publicadaEmISO: iso(pegar("pubDate")) ?? undefined } : null;
    }).filter(Boolean);
  } catch { return []; }
}

function deduplicar(itens) {
  const porChave = new Map();
  itens.forEach((item) => {
    const chave = `${item.categoria}:${item.titulo}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const existente = porChave.get(chave);
    if (!existente) {
      porChave.set(chave, item);
      return;
    }
    existente.plataformas = [...new Set([...(existente.plataformas ?? []), ...(item.plataformas ?? [])])];
    existente.relevancia = Math.max(existente.relevancia ?? 0, item.relevancia ?? 0);
    existente.imagemUrl ??= item.imagemUrl;
    existente.bannerUrl ??= item.bannerUrl;
  });
  return [...porChave.values()];
}

/** Acrescenta elenco e gêneros aos títulos TMDB para a busca local, sem expor a chave ao navegador. */
async function enriquecerMetadadosTmdb(itens) {
  if (!TMDB_API_KEY) return;
  const titulosTmdb = itens.filter((item) => item.fonte === "tmdb").slice(0, 140);
  for (let inicio = 0; inicio < titulosTmdb.length; inicio += 8) {
    await Promise.all(titulosTmdb.slice(inicio, inicio + 8).map(async (item) => {
      const resultado = item.idExterno.match(/^tmdb-(movie|tv)-(\d+)$/);
      if (!resultado) return;
      const [, tipo, id] = resultado;
      const detalhes = await json(`https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits`);
      if (!detalhes) return;
      item.generos = (detalhes.genres ?? []).map((genero) => genero.name).filter(Boolean);
      item.elenco = (detalhes.credits?.cast ?? []).slice(0, 10).map((pessoa) => pessoa.name).filter(Boolean);
    }));
  }
}

function jogoRelevante(item) {
  if (item.categoria !== "jogos") return true;
  return (item.relevancia ?? 0) >= 20_000 || item.fonte === "rockstar";
}

async function main() {
  if (!TMDB_API_KEY) console.warn("TMDB_API_KEY não configurada: filmes e séries do Brasil ficarão fora desta atualização.");
  const [destaques, igdb, steam, epic, gog, rawg, playstation, xbox, filmesStreaming, filmesCinema, seriesBrasil] = await Promise.all([
    buscarDestaquesConfirmados(),
    buscarJogosIgdb(),
    buscarJogosSteam(),
    buscarJogosEpic(),
    buscarJogosGog(),
    buscarJogosRawg(),
    buscarAtualizacoesOficiais({ fonte: "playstation", nome: "PlayStation", plataforma: "PlayStation 5", url: "https://blog.playstation.com/feed/", baseUrl: "https://blog.playstation.com" }),
    buscarAtualizacoesOficiais({ fonte: "xbox", nome: "Xbox Wire", plataforma: "Xbox Series X|S", url: "https://news.xbox.com/en-us/feed/", baseUrl: "https://news.xbox.com" }),
    buscarFilmesDosCatalogosBr(), buscarFilmesEmCartazNoBrasil(), buscarSeriesDosCatalogosBr(),
  ]);
  const sugestoes = deduplicar([...destaques, ...igdb, ...steam, ...epic, ...gog, ...rawg, ...playstation, ...xbox, ...filmesStreaming, ...filmesCinema, ...seriesBrasil])
    .filter(jogoRelevante)
    .sort((a, b) => {
      const aData = new Date(a.dataLancamentoISO).getTime();
      const bData = new Date(b.dataLancamentoISO).getTime();
      const aFuturo = aData >= agora;
      const bFuturo = bData >= agora;
      if (aFuturo !== bFuturo) return aFuturo ? -1 : 1;
      if (aFuturo) return aData - bData;
      return (b.relevancia ?? 0) - (a.relevancia ?? 0) || bData - aData;
    });
  await enriquecerMetadadosTmdb(sugestoes);
  // Jogos de maior relevância têm prioridade nas notícias; o restante privilegia as datas próximas.
  const jogosEmDestaque = sugestoes.filter((item) => item.categoria === "jogos").sort((a, b) => (b.relevancia ?? 0) - (a.relevancia ?? 0)).slice(0, 12);
  const porDataProxima = [...sugestoes].sort((a, b) => Math.abs(new Date(a.dataLancamentoISO).getTime() - agora) - Math.abs(new Date(b.dataLancamentoISO).getTime() - agora));
  const comNoticias = [...new Map([...jogosEmDestaque, ...porDataProxima].map((item) => [item.id, item])).values()];
  const noticiasPriorizadas = comNoticias.slice(0, 160);
  for (let inicio = 0; inicio < noticiasPriorizadas.length; inicio += 10) {
    await Promise.all(noticiasPriorizadas.slice(inicio, inicio + 10).map(async (sugestao) => { sugestao.noticias = await buscarNoticias(sugestao); }));
  }
  await mkdir(path.dirname(SAIDA), { recursive: true });
  await writeFile(SAIDA, JSON.stringify(sugestoes, null, 2), "utf-8");
  const resumo = Object.fromEntries(["jogos", "filmes", "series"].map((categoria) => [categoria, sugestoes.filter((item) => item.categoria === categoria).length]));
  const porFonte = Object.fromEntries([...new Set(sugestoes.map((item) => item.fonte))].sort().map((fonte) => [fonte, sugestoes.filter((item) => item.fonte === fonte).length]));
  await writeFile(SAUDE_SAIDA, JSON.stringify({ atualizadoEmISO: new Date().toISOString(), total: sugestoes.length, porCategoria: resumo, porFonte }, null, 2), "utf-8");
  console.log(`Sincronização concluída: ${sugestoes.length} sugestões salvas em ${SAIDA}. Jogos: ${resumo.jogos}; filmes: ${resumo.filmes}; séries: ${resumo.series}.`);
}
main().catch((erro) => { console.error("Falha na sincronização de dados:", erro); process.exitCode = 1; });
