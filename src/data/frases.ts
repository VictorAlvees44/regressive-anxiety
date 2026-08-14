import type { CategoriaFrase, FraseDoDia } from "../types";

/**
 * Banco de frases-base.
 *
 * Como adicionar novas frases:
 * Basta incluir novas strings no array da categoria desejada.
 * O motor em `src/hooks/useFraseDoDia.ts` seleciona uma frase por dia
 * (determinística pela data) e evita repetir a mesma frase em dias
 * consecutivos.
 */
const BANCO_FRASES: Record<CategoriaFrase, string[]> = {
  romantica: [
    "Contando os dias, mas o melhor lançamento é poder contar com você.",
    "Toda contagem regressiva é mais gostosa ao seu lado.",
    "Enquanto o tempo não passa, a vontade de te ver só aumenta.",
    "O que eu mais espero na agenda é o nosso próximo capítulo juntos.",
  ],
  engracada: [
    "Faltam menos dias do que aquela vez que você disse 'já estou saindo'.",
    "A ansiedade regressiva bateu antes mesmo do café da manhã.",
    "Se contar os dias fosse esporte olímpico, a gente já tinha medalha.",
    "O relógio anda devagar, mas nossa lista de pendências não.",
  ],
  geek: [
    "Que a Força esteja com a sua paciência até o grande dia.",
    "Nível de hype: acima de qualquer barra de experiência.",
    "Carregando... a expectativa está em 100%.",
    "Este é o caminho: contar os dias sem perder o hype.",
  ],
  jogos: [
    "Save concluído: faltam poucos dias para o próximo lançamento.",
    "Enquanto o lançamento não chega, o backlog agradece.",
    "Loading da expectativa: quase completo.",
    "A barra de vida da paciência está enchendo de novo.",
  ],
  filmes: [
    "A pipoca já está escolhida, só falta a data chegar.",
    "Trailer visto pela décima vez? Sinal de que a espera está boa.",
    "Poltrona reservada mentalmente para o grande dia.",
    "A sessão da expectativa já começou.",
  ],
  series: [
    "Maratona planejada, só falta o novo episódio chegar.",
    "Ansiedade de quem já viu todo trailer disponível.",
    "Faltam poucos dias para o próximo cliffhanger.",
    "A pausa entre temporadas está quase no fim.",
  ],
  motivacional: [
    "Cada dia que passa é um dia mais perto do que você espera.",
    "Contar os dias também é comemorar o quanto já foi vivido.",
    "A espera constrói a alegria do dia certo.",
    "Um passo por dia até chegar exatamente onde você quer estar.",
  ],
};

/** Retorna todas as frases já normalizadas em um array plano. */
export function todasAsFrases(): FraseDoDia[] {
  const frases: FraseDoDia[] = [];
  (Object.keys(BANCO_FRASES) as CategoriaFrase[]).forEach((categoria) => {
    BANCO_FRASES[categoria].forEach((texto, indice) => {
      frases.push({ id: `${categoria}-${indice}`, texto, categoria });
    });
  });
  return frases;
}
