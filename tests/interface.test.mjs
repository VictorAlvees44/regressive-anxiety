import test, { after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

// Testes de renderização sem browser, rede, credenciais ou gravação de dados reais.
const vite = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: "custom", logLevel: "error", optimizeDeps: { noDiscovery: true, include: [] }, define: { __APP_VERSION__: JSON.stringify("teste"), __BUILD_TIME__: JSON.stringify("2026-09-02T12:00:00Z") } });
after(() => vite.close());
const { BibliotecaContext } = await vite.ssrLoadModule("/src/contexts/bibliotecaContextValue.ts");
const { EventosContext } = await vite.ssrLoadModule("/src/contexts/eventosContextValue.ts");
const { ThemeContext } = await vite.ssrLoadModule("/src/contexts/themeContextValue.ts");
const { ControlesBiblioteca } = await vite.ssrLoadModule("/src/components/catalogo/ControlesBiblioteca.tsx");
const { CartaoTitulo } = await vite.ssrLoadModule("/src/components/catalogo/CartaoTitulo.tsx");
const { Sugestoes } = await vite.ssrLoadModule("/src/pages/Sugestoes.tsx");
const { TabBar } = await vite.ssrLoadModule("/src/components/layout/TabBar.tsx");
const sugestao = { id: "sug-1", idExterno: "tmdb-movie-1", titulo: "Filme de teste", categoria: "filmes", dataLancamentoISO: "2026-09-01T00:00:00Z", momento: "disponivel", fonte: "tmdb", plataformas: ["Netflix"] };
const contexto = { itens: [], erro: null, carregando: false, ocupados: new Set(), modo: "local", offline: false, salvar: async () => true, remover: async () => true, ativarLocal() {}, usarConta() {} };
function render(elemento, dados = {}, rota = "/") {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [rota] }, React.createElement(ThemeContext.Provider, { value: { tema: "escuro", alternarTema() {} } }, React.createElement(EventosContext.Provider, { value: { eventos: [] } }, React.createElement(BibliotecaContext.Provider, { value: { ...contexto, ...dados } }, elemento)))));
}

test("biblioteca pede escolha explícita antes de persistir somente no aparelho", () => {
  const html = render(React.createElement(ControlesBiblioteca, { sugestao }), { modo: "escolher" });
  assert.match(html, /Usar neste aparelho/);
  assert.doesNotMatch(html, /Quero ver<\/button>/);
});
test("progresso e estrelas acessíveis refletem o estado salvo", () => {
  const html = render(React.createElement(ControlesBiblioteca, { sugestao }), { itens: [{ sugestao, status: "finalizado", nota: 4 }] });
  assert.match(html, /value="finalizado" selected=""/);
  assert.match(html, /Dar 4 de 5 para Filme de teste" aria-pressed="true"/);
  assert.match(html, /Limpar nota/);
});
test("card aponta para detalhes e não renderiza imagem com protocolo inseguro", () => {
  const html = render(React.createElement(CartaoTitulo, { sugestao: { ...sugestao, imagemUrl: "javascript:alert(1)" } }));
  assert.match(html, /href="\/titulo\/tmdb-movie-1"/);
  assert.doesNotMatch(html, /javascript:/);
});
test("Filmes, Séries e Jogos têm cabeçalhos próprios; mini filtros são só de jogos", () => {
  for (const [categoria, titulo] of [["filmes", "Filmes"], ["series", "Séries"], ["jogos", "Jogos"]]) {
    const html = render(React.createElement(Sugestoes, { categoria }));
    assert.match(html, new RegExp(">" + titulo + "<\\/h1>"));
    if (categoria === "jogos") for (const filtro of ["Steam", "PC", "Xbox", "PlayStation"]) assert.ok(html.includes(filtro));
    else assert.doesNotMatch(html, /Plataformas e lojas de jogos/);
  }
});
test("navegação móvel tem biblioteca e mantém apenas Jogos ativo nessa rota", () => {
  const html = render(React.createElement(TabBar), {}, "/jogos");
  assert.match(html, /Biblioteca/);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/jogos"/);
});
