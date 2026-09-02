import type { SugestaoLancamento } from "../types";

const CHAVE_PREFERENCIAS = "regressive-anxiety:preferencias-sugestoes";

export interface PreferenciasSugestoes {
  categorias: SugestaoLancamento["categoria"][];
  plataformas: string[];
  servicos: string[];
  generos: string[];
}

export const PREFERENCIAS_PADRAO: PreferenciasSugestoes = {
  categorias: [],
  plataformas: [],
  servicos: [],
  generos: [],
};

function listaDeTextos(valor: unknown): string[] {
  return Array.isArray(valor) ? [...new Set(valor.filter((v): v is string => typeof v === "string" && v.length > 0))].slice(0, 100) : [];
}

export function carregarPreferenciasSugestoes(): PreferenciasSugestoes {
  try {
    const valor = localStorage.getItem(CHAVE_PREFERENCIAS);
    if (!valor) return PREFERENCIAS_PADRAO;
    const preferencias = JSON.parse(valor) as Partial<PreferenciasSugestoes>;
    return {
      categorias: listaDeTextos(preferencias.categorias).filter((v): v is SugestaoLancamento["categoria"] => ["filmes", "series", "jogos"].includes(v)),
      plataformas: listaDeTextos(preferencias.plataformas),
      servicos: listaDeTextos(preferencias.servicos),
      generos: listaDeTextos(preferencias.generos),
    };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

export function salvarPreferenciasSugestoes(preferencias: PreferenciasSugestoes) {
  localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
}

function textoDaSugestao(sugestao: SugestaoLancamento) {
  return sugestao.plataformas?.join(" ").toLocaleLowerCase("pt-BR") ?? "";
}

export function pontuacaoDasPreferencias(sugestao: SugestaoLancamento, preferencias: PreferenciasSugestoes): number {
  const plataformas = textoDaSugestao(sugestao);
  const categoriaPreferida = preferencias.categorias.includes(sugestao.categoria);
  const plataformaPreferida = preferencias.plataformas.some((plataforma) => plataformas.includes(plataforma.toLocaleLowerCase("pt-BR")));
  const servicoPreferido = preferencias.servicos.some((servico) => plataformas.includes(servico.toLocaleLowerCase("pt-BR")));
  const generoPreferido = sugestao.generos?.some((genero) => preferencias.generos.some((preferido) => genero.toLocaleLowerCase("pt-BR") === preferido.toLocaleLowerCase("pt-BR"))) ?? false;

  return (categoriaPreferida ? 2_000 : 0) + (plataformaPreferida ? 5_000 : 0) + (servicoPreferido ? 5_000 : 0) + (generoPreferido ? 4_000 : 0);
}
