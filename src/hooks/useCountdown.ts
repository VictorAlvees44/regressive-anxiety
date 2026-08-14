import { useEffect, useMemo, useState } from "react";

export interface TempoRestante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  /** true quando a data alvo já chegou/passou. */
  chegou: boolean;
  /** diferença total em milissegundos (negativa se já passou). */
  totalMs: number;
}

export function calcularTempoRestante(dataAlvoISO: string): TempoRestante {
  const totalMs = new Date(dataAlvoISO).getTime() - Date.now();

  if (totalMs <= 0) {
    return { dias: 0, horas: 0, minutos: 0, segundos: 0, chegou: true, totalMs };
  }

  const segundosTotais = Math.floor(totalMs / 1000);
  const dias = Math.floor(segundosTotais / 86400);
  const horas = Math.floor((segundosTotais % 86400) / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;

  return { dias, horas, minutos, segundos, chegou: false, totalMs };
}

/**
 * Hook de contagem regressiva em tempo real.
 * Atualiza a cada segundo enquanto a data alvo não chega.
 */
export function useCountdown(dataAlvoISO: string): TempoRestante {
  const [tempo, setTempo] = useState<TempoRestante>(() => calcularTempoRestante(dataAlvoISO));

  useEffect(() => {
    setTempo(calcularTempoRestante(dataAlvoISO));

    const intervalo = window.setInterval(() => {
      setTempo(calcularTempoRestante(dataAlvoISO));
    }, 1000);

    return () => window.clearInterval(intervalo);
  }, [dataAlvoISO]);

  return tempo;
}

/** Variante que não recalcula: útil para listas grandes onde só os segundos importam pontualmente. */
export function useTempoRestanteEstatico(dataAlvoISO: string): TempoRestante {
  return useMemo(() => calcularTempoRestante(dataAlvoISO), [dataAlvoISO]);
}
