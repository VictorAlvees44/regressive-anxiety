import type { Categoria } from "../types";

/**
 * Catálogo de categorias.
 *
 * Para adicionar uma nova categoria:
 * 1. Adicione o novo `id` em `CategoriaId` (src/types/index.ts).
 * 2. Adicione a entrada correspondente aqui.
 * 3. Se ela for opcional, inclua o id em `CATEGORIAS_OPCIONAIS`.
 * Nenhum outro ponto do app precisa ser alterado — componentes como
 * filtros, badges e o calendário leem este catálogo dinamicamente.
 */
export const CATALOGO_CATEGORIAS: Record<string, Categoria> = {
  jogos: { id: "jogos", nome: "Jogos", icone: "Gamepad2", cor: "violeta" },
  filmes: { id: "filmes", nome: "Filmes", icone: "Clapperboard", cor: "azul" },
  series: { id: "series", nome: "Séries", icone: "Tv", cor: "ciano" },
  "datas-pessoais": { id: "datas-pessoais", nome: "Datas pessoais", icone: "Heart", cor: "rosa" },
  viagens: { id: "viagens", nome: "Viagens", icone: "Plane", cor: "âmbar" },
  financeiro: { id: "financeiro", nome: "Financeiro", icone: "Wallet", cor: "verde" },
  cartoes: { id: "cartoes", nome: "Cartões", icone: "CreditCard", cor: "indigo" },
  outros: { id: "outros", nome: "Outros", icone: "Sparkles", cor: "grafite" },
};

export function obterCategoria(id: string): Categoria {
  return CATALOGO_CATEGORIAS[id] ?? CATALOGO_CATEGORIAS.outros;
}
