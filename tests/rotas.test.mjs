import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const fallback = await readFile(new URL("../public/404.html", import.meta.url), "utf8");
const script = (html) => html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];

test("GitHub Pages preserva rota de detalhes, filtros e hash no acesso direto", () => {
  let redirecionamento, destino;
  vm.runInNewContext(script(fallback), { location: { pathname: "/regressive-anxiety/titulo/steam-1", search: "?from=jogos", hash: "#trailer", replace: (url) => { redirecionamento = url; } } });
  vm.runInNewContext(script(index).replaceAll("%BASE_URL%", "/regressive-anxiety/"), { URL, URLSearchParams, location: { search: new URL(redirecionamento, "https://site.test").search, origin: "https://site.test" }, history: { replaceState: (_, __, url) => { destino = url; } } });
  assert.equal(destino, "/regressive-anxiety/titulo/steam-1?from=jogos#trailer");
});
test("restauração de rota não permite escapar da aplicação", () => {
  for (const rota of ["//evil.test", "../fora", "\\evil.test"]) {
    let destino;
    vm.runInNewContext(script(index).replaceAll("%BASE_URL%", "/regressive-anxiety/"), { URL, URLSearchParams, location: { search: "?__route=" + encodeURIComponent(rota), origin: "https://site.test" }, history: { replaceState: (_, __, url) => { destino = url; } } });
    assert.equal(destino, undefined);
  }
});
