import test from "node:test";
import assert from "node:assert/strict";
import { lerBiblioteca, prepararItemBiblioteca, atualizarBiblioteca, validarItemBiblioteca } from "../src/lib/biblioteca.ts";
import { construirPerfilRecomendacoes, analisarRecomendacao } from "../src/lib/recomendacoesInteligentes.ts";
import { PREFERENCIAS_PADRAO } from "../src/lib/preferenciasSugestoes.ts";

const sugestao = { id: "sug-1", idExterno: "tmdb-movie-1", titulo: "Aventura espacial", categoria: "filmes", dataLancamentoISO: "2026-09-01T00:00:00Z", momento: "disponivel", fonte: "tmdb", generos: ["Ficção científica"], plataformas: ["Netflix"] };
const feedback = { positivas: [], ocultadas: [] };
test("progresso é independente do lançamento e notas persistem em reload", () => {
  const item = prepararItemBiblioteca(sugestao, "em-andamento", 4);
  const lida = lerBiblioteca(JSON.stringify([item]));
  assert.equal(lida[0].status, "em-andamento");
  assert.equal(lida[0].nota, 4);
  assert.equal(lida[0].sugestao.momento, "disponivel");
});
test("atualizar status preserva criação e não duplica o mesmo título", () => {
  const primeiro = prepararItemBiblioteca(sugestao, "quero", null, undefined, "2026-09-01T10:00:00Z");
  const segundo = prepararItemBiblioteca(sugestao, "finalizado", 5, primeiro, "2026-09-02T10:00:00Z");
  const resultado = atualizarBiblioteca([primeiro], segundo);
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].criadoEm, primeiro.criadoEm);
  assert.notEqual(resultado[0].atualizadoEm, primeiro.atualizadoEm);
});
test("dados corrompidos não são silenciosamente apagados", () => {
  assert.throws(() => lerBiblioteca("{quebrado"));
  assert.throws(() => lerBiblioteca('{"itens":[]}'));
  assert.throws(() => lerBiblioteca('[null]'));
  assert.deepEqual(lerBiblioteca(null), []);
});
test("valida notas inteiras e mantém opção sem nota", () => {
  for (const nota of [0, 6, 1.5, NaN, "5"]) assert.throws(() => prepararItemBiblioteca(sugestao, "quero", nota));
  assert.equal(validarItemBiblioteca(prepararItemBiblioteca(sugestao, "quero", null)), true);
  assert.throws(() => prepararItemBiblioteca({ ...sugestao, generos: "ação" }, "quero", 5));
});
test("histórico continua influenciando o ranking quando título sai do catálogo", () => {
  const favorito = prepararItemBiblioteca(sugestao, "finalizado", 5);
  const perfil = construirPerfilRecomendacoes([], [], feedback, [favorito]);
  assert.equal(perfil.quantidadeAvaliacoes, 1);
  assert.equal(perfil.generos.get("ficcao cientifica"), 5);
  const compativel = analisarRecomendacao({ ...sugestao, idExterno: "novo" }, perfil, PREFERENCIAS_PADRAO);
  const neutro = analisarRecomendacao({ ...sugestao, idExterno: "novo", generos: ["Comédia"] }, perfil, PREFERENCIAS_PADRAO);
  assert.ok(compativel.pontuacao > neutro.pontuacao);
  assert.ok(compativel.motivos.some((m) => m.includes("avaliações")));
});
test("nota baixa reduz afinidade e mesmo título não soma biblioteca, agenda e feedback", () => {
  const ruim = prepararItemBiblioteca(sugestao, "finalizado", 1);
  const perfil = construirPerfilRecomendacoes([sugestao], [{ idExterno: sugestao.idExterno, favorito: true }], { positivas: [sugestao.idExterno], ocultadas: [] }, [ruim]);
  assert.equal(perfil.quantidadeSinais, 1);
  assert.equal(perfil.generos.size, 0);
  assert.equal(perfil.generosRejeitados.get("ficcao cientifica"), 2);
  const semHistorico = construirPerfilRecomendacoes([], [], feedback);
  assert.ok(analisarRecomendacao(sugestao, perfil, PREFERENCIAS_PADRAO).pontuacao < analisarRecomendacao(sugestao, semHistorico, PREFERENCIAS_PADRAO).pontuacao);
});
