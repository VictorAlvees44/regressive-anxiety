import { useEffect, useState } from "react";

function calcularSaudacao(): string {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Retorna a saudação apropriada para o horário atual, atualizando-se ao longo do dia. */
export function useSaudacao(): string {
  const [saudacao, setSaudacao] = useState(calcularSaudacao);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setSaudacao(calcularSaudacao());
    }, 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  return saudacao;
}
