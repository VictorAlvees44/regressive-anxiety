import type { ItemBiblioteca, StatusBiblioteca, SugestaoLancamento } from "../types";

export const CHAVE_BIBLIOTECA = "regressive-anxiety:biblioteca:v1";
export const STATUS_BIBLIOTECA: { id: StatusBiblioteca; rotulo: string }[] = [
  { id: "quero", rotulo: "Quero ver / jogar" },
  { id: "em-andamento", rotulo: "Em andamento" },
  { id: "finalizado", rotulo: "Finalizados" },
];

export function validarItemBiblioteca(valor: unknown): valor is ItemBiblioteca {
  if (!valor || typeof valor !== "object") return false;
  const v = valor as ItemBiblioteca;
  return Boolean(v.sugestao && typeof v.sugestao.idExterno === "string" && v.sugestao.idExterno.length > 0 && v.sugestao.idExterno.length <= 1000 &&
    typeof v.sugestao.id === "string" && typeof v.sugestao.titulo === "string" && v.sugestao.titulo.length > 0 &&
    ["filmes", "series", "jogos"].includes(v.sugestao.categoria) && Number.isFinite(Date.parse(v.sugestao.dataLancamentoISO)) &&
    ["generos", "elenco", "plataformas"].every((campo) => {
      const lista = v.sugestao[campo as "generos"];
      return lista === undefined || (Array.isArray(lista) && lista.every((s) => typeof s === "string"));
    }) &&
    (v.sugestao.linksOficiais === undefined || (Array.isArray(v.sugestao.linksOficiais) && v.sugestao.linksOficiais.every((l) => l && typeof l.url === "string" && typeof l.label === "string"))) &&
    (v.sugestao.noticias === undefined || (Array.isArray(v.sugestao.noticias) && v.sugestao.noticias.every((n) => n && typeof n.url === "string" && typeof n.titulo === "string"))) &&
    STATUS_BIBLIOTECA.some((s) => s.id === v.status) &&
    (v.nota === null || (Number.isInteger(v.nota) && v.nota >= 1 && v.nota <= 5)) &&
    Number.isFinite(Date.parse(v.criadoEm)) && Number.isFinite(Date.parse(v.atualizadoEm)));
}

export function lerBiblioteca(bruto: string | null): ItemBiblioteca[] {
  if (!bruto) return [];
  const dados: unknown = JSON.parse(bruto);
  if (!Array.isArray(dados) || !dados.every(validarItemBiblioteca)) throw new Error("Biblioteca inválida. Restaure um backup válido antes de gravar novos dados.");
  return [...new Map(dados.map((item) => [item.sugestao.idExterno, item])).values()];
}

export function prepararItemBiblioteca(sugestao: SugestaoLancamento, status: StatusBiblioteca, nota: number | null, anterior?: ItemBiblioteca, agora = new Date().toISOString()): ItemBiblioteca {
  // Um snapshot mantém o histórico útil mesmo se o título sair do catálogo.
  const item: ItemBiblioteca = { sugestao, status, nota, criadoEm: anterior?.criadoEm ?? agora, atualizadoEm: agora };
  if (!validarItemBiblioteca(item)) throw new Error("Não foi possível salvar: confira o título, o status e a nota (1 a 5).");
  return item;
}

export function atualizarBiblioteca(itens: ItemBiblioteca[], item: ItemBiblioteca): ItemBiblioteca[] {
  return [...itens.filter((atual) => atual.sugestao.idExterno !== item.sugestao.idExterno), item];
}
