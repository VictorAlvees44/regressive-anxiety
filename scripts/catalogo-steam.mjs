const DIA = 86_400_000;
const MESES = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const GENEROS = { Action: "Ação", Adventure: "Aventura", RPG: "RPG", Strategy: "Estratégia", Simulation: "Simulação", Sports: "Esportes", Racing: "Corrida", Casual: "Casual", Indie: "Indie", "Free To Play": "Gratuito", "Massively Multiplayer": "Multijogador" };

export function dataSteamISO(texto) {
  // Não invente um dia para datas vagas como "Coming soon", "2027" ou "Q4 2026".
  if (typeof texto !== "string") return null;
  const m = texto.match(/^(\d{1,2}) ([A-Za-z]{3}),? (\d{4})$/) ?? texto.match(/^([A-Za-z]{3}) (\d{1,2}),? (\d{4})$/);
  if (!m) return null;
  const americano = /^[A-Za-z]/.test(m[1]);
  const dia = Number(americano ? m[2] : m[1]);
  const mes = MESES[(americano ? m[1] : m[2]).toLowerCase()];
  if (mes === undefined || dia < 1) return null;
  const data = new Date(Date.UTC(Number(m[3]), mes, dia));
  return data.getUTCDate() === dia ? data.toISOString() : null;
}

export function normalizarJogoSteam(dados, agora = Date.now()) {
  if (!dados || dados.type !== "game" || !Number.isInteger(dados.steam_appid) || !dados.name) return null;
  const texto = [dados.name, dados.short_description, dados.content_descriptors?.notes].filter(Boolean).join(" ");
  if (/hentai|adult only|erotic|sexual|nsfw|nudity|porn|wallpaper/i.test(texto)) return null;
  const data = dataSteamISO(dados.release_date?.date);
  if (!data || Date.parse(data) > agora + 730 * DIA) return null;
  // Jogos antigos só permanecem se tiverem sinais reais de relevância.
  const avaliacoes = Number(dados.recommendations?.total ?? 0);
  const nota = Number(dados.metacritic?.score ?? 0);
  if (Date.parse(data) < agora - 365 * DIA && avaliacoes < 1000 && nota < 80) return null;
  if (!dados.release_date.coming_soon && avaliacoes < 100 && nota < 65) return null;
  if (!dados.platforms?.windows && !dados.platforms?.linux && !dados.platforms?.mac) return null;
  const futuro = Boolean(dados.release_date.coming_soon);
  return {
    id: "sug-steam-" + dados.steam_appid, titulo: dados.name,
    descricao: "Listado na Steam" + (dados.developers?.length ? " por " + dados.developers.join(", ") : "") + ". Consulte a página oficial para detalhes e requisitos.",
    categoria: "jogos", dataLancamentoISO: data, imagemUrl: dados.header_image,
    bannerUrl: dados.background_raw || dados.header_image,
    plataformas: ["Steam", "PC"], generos: (dados.genres ?? []).map((g) => GENEROS[g.description] ?? g.description).filter(Boolean),
    trailerUrl: dados.movies?.find((m) => m.mp4?.max)?.mp4?.max,
    linksOficiais: [{ label: "Ver na Steam", url: "https://store.steampowered.com/app/" + dados.steam_appid }],
    idExterno: "steam-" + dados.steam_appid, fonte: "steam", momento: futuro ? "em-breve" : "disponivel",
    relevancia: 20_000 + Math.min(30_000, avaliacoes) + nota * 100,
  };
}

async function lerJson(url) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(15_000) }); return r.ok ? await r.json() : null; } catch { return null; }
}

export async function buscarJogosSteam() {
  const feed = await lerJson("https://store.steampowered.com/api/featuredcategories?cc=br&l=english");
  const candidatos = [...(feed?.top_sellers?.items ?? []), ...(feed?.new_releases?.items ?? []), ...(feed?.coming_soon?.items ?? [])];
  const ids = [...new Set(candidatos.filter((i) => Number.isInteger(i.id) && !/hentai|erotic|sexual|porn|wallpaper/i.test(i.name ?? "")).map((i) => i.id))].slice(0, 24);
  const jogos = [];
  for (let inicio = 0; inicio < ids.length; inicio += 3) {
    const lote = await Promise.all(ids.slice(inicio, inicio + 3).map(async (id) => {
      const resposta = await lerJson("https://store.steampowered.com/api/appdetails?appids=" + id + "&cc=br&l=english");
      return resposta?.[id]?.success ? normalizarJogoSteam(resposta[id].data) : null;
    }));
    jogos.push(...lote.filter(Boolean));
  }
  return jogos;
}
