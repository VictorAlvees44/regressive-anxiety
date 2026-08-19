import sugestoesMock from "../data/sugestoes.mock.json";
import type { SugestaoLancamento } from "../types";

/**
 * Em produção, o app consome apenas `public/data/sugestoes.json`,
 * gerado uma vez por dia pelo workflow `sincronizar-dados.yml`
 * (ver `scripts/sincronizar-dados.mjs`). O app nunca chama IGDB, Steam,
 * TMDB, RAWG ou Google News diretamente. Em desenvolvimento, se o arquivo ainda não existir ou
 * estiver vazio, caímos no mock para manter a tela navegável.
 */
export async function listarSugestoes(): Promise<SugestaoLancamento[]> {
  try {
    // `BASE_URL` preserva o nome do repositório no GitHub Pages. Usar uma
    // barra inicial aqui apontava para `github.io/data/...`, fora do app,
    // e fazia o PWA cair nos três itens de demonstração.
    const resposta = await fetch(`${import.meta.env.BASE_URL}data/sugestoes.json`, { cache: "no-store" });
    if (resposta.ok) {
      const dados = (await resposta.json()) as SugestaoLancamento[];
      if (dados.length > 0) {
        return dados
          // O feed japonês antigo da Nintendo e o catálogo mundial anterior não
          // pertencem à curadoria brasileira atual.
          .filter((item) => item.fonte !== "nintendo")
          .filter((item) => !/[\u3040-\u30ff]/.test(item.titulo))
          .filter((item) => item.categoria !== "filmes" || (item.fonte === "tmdb" && (item.plataformas?.length ?? 0) > 0))
          .map((item) => ({
            ...item,
            imagemUrl: item.imagemUrl?.replace(/^http:/i, "https:"),
            bannerUrl: item.bannerUrl?.replace(/^http:/i, "https:"),
          }));
      }
    }
  } catch {
    // Ignorado propositalmente: cai para o mock abaixo.
  }
  return sugestoesMock as SugestaoLancamento[];
}
