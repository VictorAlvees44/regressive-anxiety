import { clsx, type ClassValue } from "clsx";

/** Combina classes condicionalmente (wrapper fino sobre clsx, ponto único de import no projeto). */
export function cn(...entradas: ClassValue[]): string {
  return clsx(entradas);
}

const FORMATADOR_DATA_LONGA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatarData(dataISO: string, comHorario = false): string {
  const data = new Date(dataISO);
  return (comHorario ? FORMATADOR_DATA_HORA : FORMATADOR_DATA_LONGA).format(data);
}

export function gerarId(prefixo = "id"): string {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
