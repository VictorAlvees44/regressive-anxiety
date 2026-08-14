import { useMemo, useState } from "react";

export interface DiaCalendario {
  data: Date;
  noMesAtual: boolean;
  hoje: boolean;
}

const NOMES_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const NOMES_DIA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export { NOMES_MES, NOMES_DIA_SEMANA };

/** Gera a grade de dias (6 semanas) para um mês, incluindo dias de meses vizinhos para preencher a grade. */
export function useCalendarioMensal(mesInicial = new Date()) {
  const [mesReferencia, setMesReferencia] = useState(new Date(mesInicial.getFullYear(), mesInicial.getMonth(), 1));

  const dias = useMemo<DiaCalendario[]>(() => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    const diaSemanaPrimeiro = primeiroDiaMes.getDay();
    const inicioGrade = new Date(primeiroDiaMes);
    inicioGrade.setDate(primeiroDiaMes.getDate() - diaSemanaPrimeiro);

    return Array.from({ length: 42 }, (_, indice) => {
      const data = new Date(inicioGrade);
      data.setDate(inicioGrade.getDate() + indice);
      return {
        data,
        noMesAtual: data.getMonth() === mesReferencia.getMonth(),
        hoje: data.toDateString() === hoje.toDateString(),
      };
    });
  }, [mesReferencia]);

  return {
    mesReferencia,
    dias,
    irParaMesAnterior: () =>
      setMesReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1)),
    irParaProximoMes: () =>
      setMesReferencia((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1)),
    irParaHoje: () => setMesReferencia(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
  };
}
