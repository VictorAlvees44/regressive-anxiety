import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("dist/index.html", "utf8");
const entrada = html.match(/src="([^"]*\/assets\/[^"]+\.js)"/)?.[1];
assert.ok(entrada, "Entrada JavaScript não encontrada");
const base = entrada.slice(0, entrada.indexOf("assets/"));
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (url.startsWith(base) && !url.startsWith("//")) assert.ok(fs.existsSync("dist/" + url.slice(base.length)), "Arquivo ausente: " + url);
}
const sw = fs.readFileSync("dist/sw.js", "utf8");
assert.ok(sw.includes("SKIP_WAITING"), "Atualização com confirmação não encontrada");
assert.ok(sw.includes(base + "index.html"), "Fallback offline sem base correta");
assert.ok(fs.existsSync("dist/404.html"), "Fallback do Pages não encontrado");
assert.ok(fs.existsSync("dist/og.png"), "Imagem social não encontrada");
const dados = JSON.parse(fs.readFileSync("dist/data/sugestoes.json", "utf8"));
assert.equal(dados.length, new Set(dados.map((s) => s.idExterno)).size, "IDs externos duplicados");
console.log("Build verificado: arquivos estáticos, base " + base + ", PWA, fallback de rotas, imagem social e catálogo sem duplicados.");
