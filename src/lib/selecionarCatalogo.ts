import type { SugestaoLancamento } from "../types";
import { correspondePlataforma, dentroDaJanelaAtual, jogoApropriadoERelevante, normalizarTexto, type FiltroJogo } from "./filtrosCatalogo.ts";

export interface FiltrosCatalogo {
  categoria?: SugestaoLancamento["categoria"];
  plataforma: FiltroJogo;
  servico: string;
  momento: string;
  noticias: boolean;
  busca: string;
  incluirFinalizados: boolean;
  ordem: "data" | "para-voce";
}
function distanciaMaximaUm(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, erros = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++erros > 1) return false;
    if (a.length >= b.length) i++;
    if (a.length <= b.length) j++;
  }
  return erros + a.length - i + b.length - j <= 1;
}

function correspondeBusca(termo: string, texto: string): boolean {
  if (texto.includes(termo)) return true;
  return termo.length >= 5 && texto.split(/[^a-z0-9]+/).some((palavra) => palavra.length >= 5 && distanciaMaximaUm(termo, palavra));
}

export function baseCatalogo(itens: SugestaoLancamento[], categoria?: SugestaoLancamento["categoria"], noticias = false, agora = Date.now()) {
  return itens.filter((s) => (!categoria || s.categoria === categoria) && dentroDaJanelaAtual(s, agora) && jogoApropriadoERelevante(s) && (noticias ? s.tipoConteudo === "atualizacao-oficial" : s.tipoConteudo !== "atualizacao-oficial"));
}

export function selecionarCatalogo(itens: SugestaoLancamento[], filtros: FiltrosCatalogo, ocultados: string[], finalizados: Set<string>, analises: Map<string, { pontuacao: number }>, agora = Date.now()): SugestaoLancamento[] {
  const termos = normalizarTexto(filtros.busca).trim().split(/\s+/).filter(Boolean);
  return baseCatalogo(itens, filtros.categoria, filtros.noticias, agora).filter((s) => {
    const texto = normalizarTexto([s.titulo, ...(s.aliases ?? []), s.descricao, ...(s.generos ?? []), ...(s.elenco ?? []), ...(s.plataformas ?? [])].join(" "));
    return !ocultados.includes(s.idExterno) && (filtros.incluirFinalizados || !finalizados.has(s.idExterno)) &&
      (filtros.categoria !== "jogos" || correspondePlataforma(s, filtros.plataforma)) &&
      (filtros.servico === "todos" || (s.plataformas ?? []).some((p) => normalizarTexto(p).includes(normalizarTexto(filtros.servico)))) &&
      (filtros.momento === "todos" || s.momento === filtros.momento) && termos.every((t) => correspondeBusca(t, texto));
  }).sort((a, b) => {
    if (filtros.ordem === "para-voce") {
      const diferenca = (analises.get(b.idExterno)?.pontuacao ?? 0) - (analises.get(a.idExterno)?.pontuacao ?? 0);
      if (diferenca !== 0) return diferenca;
    }
    const aData = Date.parse(a.dataLancamentoISO), bData = Date.parse(b.dataLancamentoISO);
    const futuroA = aData >= agora, futuroB = bData >= agora;
    if (futuroA !== futuroB) return futuroA ? -1 : 1;
    return (futuroA ? aData - bData : bData - aData) || a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}
