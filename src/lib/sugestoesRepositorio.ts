import sugestoesMock from "../data/sugestoes.mock.json";
import type { SugestaoLancamento } from "../types";

/**
 * Em produção, o app consome apenas `public/data/sugestoes.json`,
 * gerado uma vez por dia pelo workflow `sincronizar-dados.yml`
 * (ver `scripts/sincronizar-dados.mjs`). O app nunca chama IGDB, Steam,
 * TMDB, TVmaze ou Google News diretamente. Em desenvolvimento, se o arquivo ainda não existir ou
 * estiver vazio, caímos no mock para manter a tela navegável.
 */
export async function listarSugestoes(): Promise<SugestaoLancamento[]> {
  try {
    const resposta = await fetch("/data/sugestoes.json", { cache: "no-store" });
    if (resposta.ok) {
      const dados = (await resposta.json()) as SugestaoLancamento[];
      if (dados.length > 0) return dados;
    }
  } catch {
    // Ignorado propositalmente: cai para o mock abaixo.
  }
  return sugestoesMock as SugestaoLancamento[];
}
