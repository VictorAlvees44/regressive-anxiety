import test from "node:test";
import assert from "node:assert/strict";
import { correspondePlataforma, formatarDataLancamento, urlExternaSegura } from "../src/lib/filtrosCatalogo.ts";
import { baseCatalogo, selecionarCatalogo } from "../src/lib/selecionarCatalogo.ts";
import { dataSteamISO, normalizarJogoSteam } from "../scripts/catalogo-steam.mjs";
import { destaquesFilmesConfirmados } from "../scripts/destaques-filmes.mjs";
import { validarContinuidadeCatalogo } from "../scripts/catalogo-qualidade.mjs";
import { readFileSync } from "node:fs";

const agora = Date.parse("2026-09-02T12:00:00Z");
const item = (extras = {}) => ({ id: "1", idExterno: "tmdb-movie-1", titulo: "Ação no espaço", descricao: "Uma aventura", categoria: "filmes", dataLancamentoISO: "2026-09-01T00:00:00Z", momento: "disponivel", fonte: "tmdb", plataformas: ["Netflix"], ...extras });
const filtros = { categoria: "filmes", plataforma: "todos", servico: "todos", momento: "todos", noticias: false, busca: "", incluirFinalizados: false, ordem: "para-voce" };
const selecionar = (itens, extra = {}, finalizados = new Set(), ocultados = [], analises = new Map()) => selecionarCatalogo(itens, { ...filtros, ...extra }, ocultados, finalizados, analises, agora);

test("categorias ficam separadas; notícias não se passam por jogos", () => {
  const itens = [item(), item({ categoria: "series" }), item({ categoria: "jogos" }), item({ categoria: "jogos", tipoConteudo: "atualizacao-oficial" })];
  assert.equal(selecionar(itens).length, 1);
  assert.equal(baseCatalogo(itens, "series", false, agora).length, 1);
  assert.equal(baseCatalogo(itens, "jogos", false, agora).length, 1);
  assert.equal(baseCatalogo(itens, "jogos", true, agora).length, 1);
});
test("Steam exige evidência de loja; PC aceita Steam, mas não o contrário", () => {
  const pc = item({ categoria: "jogos", plataformas: ["PC (Microsoft Windows)"] });
  assert.equal(correspondePlataforma(pc, "pc"), true);
  assert.equal(correspondePlataforma(pc, "steam"), false);
  const steam = { ...pc, plataformas: ["Steam"] };
  assert.equal(correspondePlataforma(steam, "pc"), true);
  assert.equal(correspondePlataforma(steam, "steam"), true);
  assert.equal(correspondePlataforma({ ...pc, linksOficiais: [{ label: "Steam", url: "https://store.steampowered.com/app/1" }] }, "steam"), true);
  assert.equal(correspondePlataforma({ ...pc, linksOficiais: [{ label: "Steam", url: "https://store.steampowered.com.evil.test/app/1" }] }, "steam"), false);
});
test("Xbox e PlayStation não incluem PC não confirmado", () => {
  const console = item({ categoria: "jogos", plataformas: ["Xbox Series X|S", "PlayStation 5"] });
  assert.equal(correspondePlataforma(console, "xbox"), true);
  assert.equal(correspondePlataforma(console, "playstation"), true);
  assert.equal(correspondePlataforma(console, "pc"), false);
  assert.equal(correspondePlataforma(item(), "xbox"), false);
});
test("busca combina palavras e ignora acentos; serviço é um filtro real", () => {
  assert.equal(selecionar([item()], { busca: "acao netflix" }).length, 1);
  assert.equal(selecionar([item()], { busca: "acao xbox" }).length, 0);
  assert.equal(selecionar([item()], { servico: "Max" }).length, 0);
});

test("Verity e Ultimato Encore aparecem, inclusive em busca com erro de digitação", () => {
  const filmes = destaquesFilmesConfirmados(Date.parse("2026-09-18T12:00:00Z"));
  assert.equal(selecionar(filmes, { busca: "Verity" }).length, 1);
  assert.equal(selecionar(filmes, { busca: "Vingadores Endcore" }).length, 1);
  assert.equal(selecionar(filmes, { busca: "Avengers Endgame" }).length, 1);
  assert.equal(selecionar(filmes, { servico: "Cinema" }).length, 2);
  assert.equal(destaquesFilmesConfirmados(Date.parse("2027-05-01T12:00:00Z")).length, 0);
  const publicado = JSON.parse(readFileSync("public/data/sugestoes.json", "utf8"));
  for (const filme of destaquesFilmesConfirmados()) assert.ok(publicado.some((item) => item.idExterno === filme.idExterno));
});

test("sincronização incompleta preserva o catálogo anterior", () => {
  const anteriores = [
    ...Array.from({ length: 30 }, () => ({ categoria: "filmes" })),
    ...Array.from({ length: 30 }, () => ({ categoria: "series" })),
  ];
  assert.throws(() => validarContinuidadeCatalogo(anteriores, [{ categoria: "filmes" }]), /Coleta incompleta de filmes/);
  assert.doesNotThrow(() => validarContinuidadeCatalogo(anteriores, [
    ...Array.from({ length: 16 }, () => ({ categoria: "filmes" })),
    ...Array.from({ length: 16 }, () => ({ categoria: "series" })),
  ]));
});
test("finalizados não são sugeridos por padrão e podem ser reexibidos", () => {
  const finalizados = new Set(["tmdb-movie-1"]);
  assert.equal(selecionar([item()], {}, finalizados).length, 0);
  assert.equal(selecionar([item()], { incluirFinalizados: true }, finalizados).length, 1);
  assert.equal(selecionar([item()], { incluirFinalizados: true }, finalizados, ["tmdb-movie-1"]).length, 0);
});
test("catálogo exclui datas inválidas, filmes antigos e conteúdo inadequado", () => {
  assert.equal(selecionar([item({ dataLancamentoISO: "invalida" }), item({ dataLancamentoISO: "2020-01-01" })]).length, 0);
  assert.equal(selecionar([item({ categoria: "jogos", titulo: "NSFW game" })], { categoria: "jogos" }).length, 0);
});
test("ranking usa pontuação e data como desempate sem alterar o catálogo original", () => {
  const a = item({ idExterno: "a" }), b = item({ idExterno: "b" });
  const itens = [a, b];
  assert.equal(selecionar(itens, {}, new Set(), [], new Map([["a", { pontuacao: 1 }], ["b", { pontuacao: 2 }]]))[0], b);
  assert.deepEqual(itens, [a, b]);
});
test("data de lançamento não recua um dia no fuso brasileiro", () => {
  assert.match(formatarDataLancamento("2026-09-02T00:00:00Z"), /^02 de setembro/);
  assert.equal(formatarDataLancamento("x"), "Data a confirmar");
});
test("links externos rejeitam scripts, dados e credenciais", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,a", "https://user:password@example.com", "/admin", "inválida"]) assert.equal(urlExternaSegura(url), undefined);
  assert.equal(urlExternaSegura("https://example.com/video"), "https://example.com/video");
});
test("Steam aceita somente datas exatas e válidas", () => {
  assert.equal(dataSteamISO("5 Dec, 2019"), "2019-12-05T00:00:00.000Z");
  assert.equal(dataSteamISO("Dec 5, 2019"), "2019-12-05T00:00:00.000Z");
  for (const data of ["Coming soon", "Q4 2026", "2027", "31 Feb, 2026", "00 Feb, 2026", undefined]) assert.equal(dataSteamISO(data), null);
});
test("Steam não transforma DLCs e wallpapers em jogos nem inventa lançamentos", () => {
  const dados = { steam_appid: 1, name: "Um jogo", type: "game", release_date: { date: "1 Sep, 2026", coming_soon: false }, platforms: { windows: true }, recommendations: { total: 500 } };
  assert.deepEqual(normalizarJogoSteam(dados, agora).plataformas, ["Steam", "PC"]);
  assert.equal(normalizarJogoSteam({ ...dados, type: "dlc" }, agora), null);
  assert.equal(normalizarJogoSteam({ ...dados, name: "Wallpaper Pack" }, agora), null);
  assert.equal(normalizarJogoSteam({ ...dados, release_date: { date: "Coming soon" } }, agora), null);
});
