/**
 * Motor de geração de mensagens de notificação.
 *
 * Esta é a versão CommonJS usada pela Cloud Function de envio
 * (ambiente Node isolado do frontend). O conteúdo dos templates é
 * mantido em espelho com `src/data/notificacoes.ts` — ao adicionar
 * uma frase em um dos dois arquivos, replique no outro.
 */

const TEMPLATES = {
  jogos: [
    "O controle já está carregado para {titulo}.",
    "Faltam {dias} para {titulo}. Hora de avisar a guild.",
    "{titulo} chegando: já reservou o fim de semana pro save?",
    "Xbox, PlayStation ou Steam? Não importa, {titulo} está chegando.",
    "A barra de loading de {titulo} está quase completa.",
  ],
  filmes: [
    "Pipoca no ponto: {titulo} estreia em {dias}.",
    "Faltam {dias} para {titulo}. Bilheteria ou streaming, já decidiu?",
    "A sessão de {titulo} está cada vez mais perto.",
    "{titulo}: o trailer já rodou várias vezes, a estreia é em {dias}.",
  ],
  series: [
    "Maratona programada: {titulo} chega em {dias}.",
    "Faltam {dias} para o próximo episódio de {titulo}.",
    "{titulo} está voltando. Ansiedade nível cliffhanger.",
    "Pausa entre temporadas de {titulo} termina em {dias}.",
  ],
  cartao: [
    "A fatura de {titulo} vence em {dias}. Bora organizar as contas.",
    "Lembrete sem drama: {titulo} chega em {dias}.",
    "Faltam {dias} para o vencimento de {titulo}.",
  ],
  viagem: [
    "Malas quase prontas: {titulo} é em {dias}.",
    "Faltam {dias} para {titulo}. Já separou o protetor solar?",
    "A contagem para {titulo} está quase zerando.",
  ],
  "datas-pessoais": [
    "Não esquece: {titulo} é em {dias}.",
    "Faltam {dias} para {titulo}. Hora de planejar algo especial.",
    "{titulo} está chegando — separa a agenda.",
  ],
  generico: [
    "Faltam {dias} para {titulo}.",
    "{titulo} está cada vez mais próximo: {dias} restantes.",
    "Contagem atualizada: {dias} para {titulo}.",
  ],
};

const ROTULOS_GATILHO = {
  "resumo-semanal": "esta semana",
  "7-dias-antes": "7 dias",
  "3-dias-antes": "3 dias",
  "1-dia-antes": "1 dia",
  "no-dia": "hoje",
  "pre-venda-hoje": "hoje",
};

/**
 * Templates específicos para o dia em que a pré-venda de ingressos de
 * um filme abre (preenchida manualmente pelo administrador em
 * `dataPreVendaISO` — não existe API pública para essa informação).
 */
const TEMPLATES_PRE_VENDA = [
  "A pré-venda de {titulo} começou! Corre antes que esgote.",
  "Ingressos de {titulo} liberados para pré-venda.",
  "Pré-venda no ar: já dá pra garantir o ingresso de {titulo}.",
  "Bilheteria virtual aberta: pré-venda de {titulo} começou hoje.",
];

/** Mapeia a categoria do evento para o tipo de template de notificação correspondente. */
function categoriaParaTipoTemplate(categoria) {
  const mapa = {
    jogos: "jogos",
    filmes: "filmes",
    series: "series",
    cartoes: "cartao",
    viagens: "viagem",
    "datas-pessoais": "datas-pessoais",
  };
  return mapa[categoria] ?? "generico";
}

/** Hash simples e estável de string -> número (usado como seed para variar o template escolhido). */
function hashString(valor) {
  let hash = 0;
  for (let i = 0; i < valor.length; i++) {
    hash = (hash << 5) - hash + valor.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function gerarMensagemNotificacao(tipo, gatilho, titulo, seed = 0) {
  const templates = gatilho === "pre-venda-hoje" ? TEMPLATES_PRE_VENDA : TEMPLATES[tipo] ?? TEMPLATES.generico;
  const indice = seed % templates.length;
  const template = templates[indice];
  return template.replace("{titulo}", titulo).replace("{dias}", ROTULOS_GATILHO[gatilho]);
}

module.exports = { gerarMensagemNotificacao, categoriaParaTipoTemplate, hashString };
