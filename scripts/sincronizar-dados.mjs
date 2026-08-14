#!/usr/bin/env node
/**
 * Script de sincronização diária de dados públicos.
 *
 * Executado uma vez por dia via GitHub Actions (ver
 * .github/workflows/sincronizar-dados.yml). Consulta as APIs de
 * jogos (IGDB, com fallback para RAWG) e de filmes/séries (TMDB),
 * e grava o resultado em `public/data/sugestoes.json` — o único
 * arquivo que o frontend consome para a tela de Sugestões.
 *
 * Nunca é executado no navegador do usuário: por isso pode usar
 * variáveis de ambiente "secretas" (tokens de API) sem exposição.
 *
 * Como adicionar um novo provedor de dados:
 * 1. Crie uma função `buscarDoNovoProvedor()` seguindo o mesmo formato
 *    de retorno das funções existentes (mapeando para `SugestaoLancamento`).
 * 2. Chame-a em `main()` e concatene o resultado ao array final.
 * 3. Adicione as variáveis de ambiente necessárias no workflow e no
 *    `.env.example`.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SAIDA = path.resolve("public/data/sugestoes.json");

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID;
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

/** Obtém um token de acesso IGDB via OAuth do Twitch (necessário para toda chamada à IGDB). */
async function obterTokenIgdb() {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) return null;

  const resposta = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!resposta.ok) return null;
  const dados = await resposta.json();
  return dados.access_token ?? null;
}

async function buscarJogosIgdb() {
  const token = await obterTokenIgdb();
  if (!token) return null;

  const agoraSegundos = Math.floor(Date.now() / 1000);
  const corpo = `
    fields name, summary, first_release_date, cover.url, screenshots.url;
    where first_release_date > ${agoraSegundos};
    sort first_release_date asc;
    limit 20;
  `;

  const resposta = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: corpo,
  });

  if (!resposta.ok) return null;
  const jogos = await resposta.json();

  return jogos.map((jogo) => ({
    id: `sug-igdb-${jogo.id}`,
    titulo: jogo.name,
    descricao: jogo.summary?.slice(0, 240),
    categoria: "jogos",
    dataLancamentoISO: new Date(jogo.first_release_date * 1000).toISOString(),
    imagemUrl: jogo.cover?.url ? `https:${jogo.cover.url.replace("t_thumb", "t_cover_big")}` : undefined,
    idExterno: `igdb-${jogo.id}`,
    fonte: "igdb",
  }));
}

async function buscarJogosRawg() {
  if (!RAWG_API_KEY) return [];

  const hoje = new Date().toISOString().slice(0, 10);
  const emSeisMeses = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10);

  const resposta = await fetch(
    `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&dates=${hoje},${emSeisMeses}&ordering=released&page_size=20`,
  );
  if (!resposta.ok) return [];
  const dados = await resposta.json();

  return (dados.results ?? []).map((jogo) => ({
    id: `sug-rawg-${jogo.id}`,
    titulo: jogo.name,
    categoria: "jogos",
    dataLancamentoISO: new Date(jogo.released ?? Date.now()).toISOString(),
    imagemUrl: jogo.background_image ?? undefined,
    idExterno: `rawg-${jogo.id}`,
    fonte: "rawg",
  }));
}

async function buscarJogos() {
  const doIgdb = await buscarJogosIgdb();
  if (doIgdb && doIgdb.length > 0) return doIgdb;
  return buscarJogosRawg();
}

async function buscarTmdb(caminho, categoria, prefixoId) {
  if (!TMDB_API_KEY) return [];

  const resposta = await fetch(
    `https://api.themoviedb.org/3/${caminho}?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`,
  );
  if (!resposta.ok) return [];
  const dados = await resposta.json();
  const agora = Date.now();

  return (dados.results ?? [])
    .map((item) => {
      const dataLancamento = item.release_date || item.first_air_date;
      if (!dataLancamento) return null;
      return {
        id: `sug-${prefixoId}-${item.id}`,
        titulo: item.title ?? item.name,
        descricao: item.overview?.slice(0, 240),
        categoria,
        dataLancamentoISO: new Date(dataLancamento).toISOString(),
        imagemUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
        idExterno: `tmdb-${prefixoId}-${item.id}`,
        fonte: "tmdb",
      };
    })
    .filter((item) => item && new Date(item.dataLancamentoISO).getTime() > agora);
}

async function main() {
  const [jogos, filmes, series] = await Promise.all([
    buscarJogos(),
    buscarTmdb("movie/upcoming", "filmes", "movie"),
    buscarTmdb("tv/on_the_air", "series", "tv"),
  ]);

  const sugestoes = [...jogos, ...filmes, ...series].sort(
    (a, b) => new Date(a.dataLancamentoISO).getTime() - new Date(b.dataLancamentoISO).getTime(),
  );

  await mkdir(path.dirname(SAIDA), { recursive: true });
  await writeFile(SAIDA, JSON.stringify(sugestoes, null, 2), "utf-8");

  console.log(`Sincronização concluída: ${sugestoes.length} sugestões salvas em ${SAIDA}`);
}

main().catch((erro) => {
  console.error("Falha na sincronização de dados:", erro);
  process.exitCode = 1;
});
