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
export function baseCatalogo(itens: SugestaoLancamento[], categoria?: SugestaoLancamento["categoria"], noticias = false, agora = Date.now()) {
  return itens.filter((s) => (!categoria || s.categoria === categoria) && dentroDaJanelaAtual(s, agora) && jogoApropriadoERelevante(s) && (noticias ? s.tipoConteudo === "atualizacao-oficial" : s.tipoConteudo !== "atualizacao-oficial"));
}

export function selecionarCatalogo(itens: SugestaoLancamento[], filtros: FiltrosCatalogo, ocultados: string[], finalizados: Set<string>, analises: Map<string, { pontuacao: number }>, agora = Date.now()): SugestaoLancamento[] {
  const termos = normalizarTexto(filtros.busca).trim().split(/\s+/).filter(Boolean);
  return baseCatalogo(itens, filtros.categoria, filtros.noticias, agora).filter((s) => {
    const texto = normalizarTexto([s.titulo, s.descricao, ...(s.generos ?? []), ...(s.elenco ?? []), ...(s.plataformas ?? [])].join(" "));
    return !ocultados.includes(s.idExterno) && (filtros.incluirFinalizados || !finalizados.has(s.idExterno)) &&
      (filtros.categoria !== "jogos" || correspondePlataforma(s, filtros.plataforma)) &&
      (filtros.servico === "todos" || (s.plataformas ?? []).some((p) => normalizarTexto(p).includes(normalizarTexto(filtros.servico)))) &&
      (filtros.momento === "todos" || s.momento === filtros.momento) && termos.every((t) => texto.includes(t));
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
