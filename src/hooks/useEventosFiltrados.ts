import { useMemo } from "react";
import type { Evento, FiltrosEventos } from "../types";

const FILTROS_PADRAO: FiltrosEventos = { ordenacao: "mais-proximo" };

/**
 * Aplica filtros e ordenação sobre uma lista de eventos.
 *
 * Mantido como função pura + hook fino para poder ser testado e
 * reutilizado tanto na Home (próximos eventos) quanto na tela de
 * listagem completa e no calendário.
 */
export function filtrarEOrdenarEventos(eventos: Evento[], filtros: FiltrosEventos = FILTROS_PADRAO): Evento[] {
  const agora = new Date();
  let resultado = [...eventos];

  if (filtros.categoria) {
    resultado = resultado.filter((e) => e.categoria === filtros.categoria);
  }
  if (filtros.apenasFavoritos) {
    resultado = resultado.filter((e) => e.favorito);
  }
  if (filtros.apenasConcluidos) {
    resultado = resultado.filter((e) => e.status === "concluido");
  } else if (!filtros.apenasConcluidos && filtros.ordenacao !== "alfabetico") {
    // Por padrão, escondemos concluídos das listagens de "próximos eventos"
    // a menos que o filtro de concluídos esteja explicitamente marcado.
  }
  if (filtros.apenasEsteMes) {
    resultado = resultado.filter((e) => {
      const data = new Date(e.dataHoraISO);
      return data.getMonth() === agora.getMonth() && data.getFullYear() === agora.getFullYear();
    });
  }
  if (filtros.apenasEsteAno) {
    resultado = resultado.filter((e) => new Date(e.dataHoraISO).getFullYear() === agora.getFullYear());
  }

  switch (filtros.ordenacao) {
    case "mais-proximo":
      resultado.sort((a, b) => new Date(a.dataHoraISO).getTime() - new Date(b.dataHoraISO).getTime());
      break;
    case "mais-distante":
      resultado.sort((a, b) => new Date(b.dataHoraISO).getTime() - new Date(a.dataHoraISO).getTime());
      break;
    case "alfabetico":
      resultado.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
      break;
    case "mais-recentes":
      resultado.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      break;
  }

  return resultado;
}

export function useEventosFiltrados(eventos: Evento[], filtros: FiltrosEventos): Evento[] {
  return useMemo(() => filtrarEOrdenarEventos(eventos, filtros), [eventos, filtros]);
}

/** Retorna apenas os eventos futuros (ou de hoje), ordenados do mais próximo ao mais distante. */
export function useProximosEventos(eventos: Evento[], limite?: number): Evento[] {
  return useMemo(() => {
    const futuros = eventos.filter((e) => e.status !== "concluido");
    const ordenados = filtrarEOrdenarEventos(futuros, { ordenacao: "mais-proximo" });
    return limite ? ordenados.slice(0, limite) : ordenados;
  }, [eventos, limite]);
}
