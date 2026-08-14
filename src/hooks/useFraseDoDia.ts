import { useMemo } from "react";
import { todasAsFrases } from "../data/frases";
import type { FraseDoDia } from "../types";

/** Hash simples e estável de string -> número, usado para escolher a frase do dia. */
function hashString(valor: string): number {
  let hash = 0;
  for (let i = 0; i < valor.length; i++) {
    hash = (hash << 5) - hash + valor.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Seleciona uma frase do dia de forma determinística (mesma frase o dia
 * inteiro, mesma para todos os dispositivos) e sem repetir a frase do
 * dia anterior.
 */
export function useFraseDoDia(): FraseDoDia {
  return useMemo(() => {
    const frases = todasAsFrases();
    const hoje = new Date();
    const chaveDia = `${hoje.getFullYear()}-${hoje.getMonth()}-${hoje.getDate()}`;
    const chaveOntem = new Date(hoje.getTime() - 86_400_000);
    const chaveDiaAnterior = `${chaveOntem.getFullYear()}-${chaveOntem.getMonth()}-${chaveOntem.getDate()}`;

    let indice = hashString(chaveDia) % frases.length;
    const indiceOntem = hashString(chaveDiaAnterior) % frases.length;

    if (indice === indiceOntem) {
      indice = (indice + 1) % frases.length;
    }

    return frases[indice];
  }, []);
}
