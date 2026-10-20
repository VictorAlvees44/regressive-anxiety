import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("sincronização diária dispara a publicação do catálogo", async () => {
  const workflow = await readFile(".github/workflows/sincronizar-dados.yml", "utf8");
  assert.match(workflow, /actions:\s*write/);
  assert.match(workflow, /gh workflow run publicar\.yml --ref main/);
});

test("dados compartilhados exigem administrador sem e-mails no repositório", async () => {
  const regras = await readFile("firestore.rules", "utf8");
  assert.match(regras, /administradores\/\$\(request\.auth\.uid\)/);
  assert.match(regras, /match \/eventos\/\{eventoId\}[\s\S]*allow read, write: if ehAdministrador\(\)/);
  assert.match(regras, /match \/listaDesejos\/\{itemId\}[\s\S]*allow read, write: if ehAdministrador\(\)/);
  assert.doesNotMatch(regras, /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
});

test("lista de desejos trata falhas antes de alterar a interface", async () => {
  const pagina = await readFile("src/pages/ListaDesejos.tsx", "utf8");
  const inicioExclusao = pagina.indexOf("async function removerItem");
  const fimExclusao = pagina.indexOf("\n  return (", inicioExclusao);
  const exclusao = pagina.slice(inicioExclusao, fimExclusao);
  assert.ok(exclusao.indexOf("await listaDesejosRepositorio.excluirItem") < exclusao.indexOf("setItens"));
  assert.match(pagina, /\.catch\(\(\) =>/);
  assert.match(pagina, /role="alert"/);
});
