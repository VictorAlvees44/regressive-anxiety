const CATEGORIAS = ["jogos", "filmes", "series"];

/** Uma indisponibilidade de fonte não pode substituir o catálogo por poucos itens. */
export function validarContinuidadeCatalogo(anteriores, novos) {
  for (const categoria of CATEGORIAS) {
    const quantidadeAnterior = anteriores.filter((item) => item.categoria === categoria).length;
    const quantidadeNova = novos.filter((item) => item.categoria === categoria).length;
    if (quantidadeAnterior >= 20 && quantidadeNova < Math.max(10, Math.floor(quantidadeAnterior / 2))) {
      throw new Error(`Coleta incompleta de ${categoria}: ${quantidadeNova} itens, antes ${quantidadeAnterior}. Catálogo anterior preservado.`);
    }
  }
}
