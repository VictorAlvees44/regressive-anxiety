import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { filtrarEOrdenarEventos, useProximosEventos } from "./useEventosFiltrados";
import type { Evento } from "../types";

function criarEvento(sobrescritas: Partial<Evento>): Evento {
  return {
    id: sobrescritas.id ?? "evt-teste",
    titulo: "Evento de teste",
    categoria: "outros",
    dataHoraISO: new Date().toISOString(),
    possuiHorario: false,
    favorito: false,
    status: "futuro",
    origem: "manual",
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    ...sobrescritas,
  };
}

describe("filtrarEOrdenarEventos", () => {
  const eventos: Evento[] = [
    criarEvento({ id: "1", titulo: "Zelda", categoria: "jogos", dataHoraISO: "2030-01-10T00:00:00.000Z" }),
    criarEvento({
      id: "2",
      titulo: "Avatar 3",
      categoria: "filmes",
      dataHoraISO: "2030-01-01T00:00:00.000Z",
      favorito: true,
    }),
    criarEvento({ id: "3", titulo: "Bolo", categoria: "outros", dataHoraISO: "2030-06-01T00:00:00.000Z" }),
    criarEvento({
      id: "4",
      titulo: "Concluído",
      categoria: "outros",
      dataHoraISO: "2020-01-01T00:00:00.000Z",
      status: "concluido",
    }),
  ];

  it("ordena por mais próximo (data crescente) por padrão", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "mais-proximo" });
    // A ordenação "mais-proximo" é puramente cronológica; ela não exclui
    // eventos concluídos (essa exclusão é feita por useProximosEventos).
    // Por isso o evento de 2020 (concluído) aparece primeiro.
    expect(resultado.map((e) => e.id)).toEqual(["4", "2", "1", "3"]);
  });

  it("ordena por mais distante (data decrescente)", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "mais-distante" });
    expect(resultado[0].id).toBe("3");
  });

  it("ordena alfabeticamente pelo título", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "alfabetico" });
    expect(resultado.map((e) => e.titulo)).toEqual(["Avatar 3", "Bolo", "Concluído", "Zelda"]);
  });

  it("filtra por categoria", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "mais-proximo", categoria: "jogos" });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe("1");
  });

  it("filtra apenas favoritos", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "mais-proximo", apenasFavoritos: true });
    expect(resultado.map((e) => e.id)).toEqual(["2"]);
  });

  it("filtra apenas concluídos", () => {
    const resultado = filtrarEOrdenarEventos(eventos, { ordenacao: "mais-proximo", apenasConcluidos: true });
    expect(resultado.map((e) => e.id)).toEqual(["4"]);
  });

  it("não modifica o array original", () => {
    const copia = [...eventos];
    filtrarEOrdenarEventos(eventos, { ordenacao: "alfabetico" });
    expect(eventos).toEqual(copia);
  });
});

describe("useProximosEventos", () => {
  const eventos: Evento[] = [
    criarEvento({ id: "1", titulo: "Zelda", dataHoraISO: "2030-01-10T00:00:00.000Z" }),
    criarEvento({ id: "2", titulo: "Avatar 3", dataHoraISO: "2030-01-01T00:00:00.000Z" }),
    criarEvento({ id: "3", titulo: "Concluído", dataHoraISO: "2020-01-01T00:00:00.000Z", status: "concluido" }),
  ];

  it("exclui eventos concluídos", () => {
    const { result } = renderHook(() => useProximosEventos(eventos));
    expect(result.current.map((e) => e.id)).not.toContain("3");
  });

  it("ordena os restantes do mais próximo ao mais distante", () => {
    const { result } = renderHook(() => useProximosEventos(eventos));
    expect(result.current.map((e) => e.id)).toEqual(["2", "1"]);
  });

  it("respeita o limite informado", () => {
    const { result } = renderHook(() => useProximosEventos(eventos, 1));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("2");
  });
});
