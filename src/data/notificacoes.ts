import type { GatilhoNotificacao, TemplateNotificacaoTipo } from "../types";

/**
 * Templates de notificações push.
 *
 * Cada template usa os placeholders `{titulo}` e `{dias}`, substituídos
 * em tempo de envio. As referências a franquias/plataformas (GTA, Xbox,
 * PlayStation, Steam etc.) são citações leves ao universo do evento —
 * nunca falas oficiais, letras ou textos protegidos por direitos de autor.
 *
 * Como adicionar um novo template:
 * 1. Escolha o `TemplateNotificacaoTipo` (ou crie um novo em src/types).
 * 2. Adicione novas frases no array correspondente abaixo.
 * O motor de combinação (`gerarMensagemNotificacao`) já cruza
 * automaticamente frase + gatilho, gerando centenas de variações.
 */
const TEMPLATES: Record<TemplateNotificacaoTipo, string[]> = {
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

/**
 * Templates específicos para o dia em que a pré-venda de ingressos de
 * um filme abre. Diferente dos demais (que falam da estreia em si),
 * estes tratam do evento "pré-venda liberada" — por isso não usam o
 * placeholder {dias} (a notificação só dispara no dia exato).
 */
const TEMPLATES_PRE_VENDA: string[] = [
  "A pré-venda de {titulo} começou! Corre antes que esgote.",
  "Ingressos de {titulo} liberados para pré-venda.",
  "Pré-venda no ar: já dá pra garantir o ingresso de {titulo}.",
  "Bilheteria virtual aberta: pré-venda de {titulo} começou hoje.",
];

const ROTULOS_GATILHO: Record<GatilhoNotificacao, string> = {
  "resumo-semanal": "esta semana",
  "7-dias-antes": "7 dias",
  "3-dias-antes": "3 dias",
  "1-dia-antes": "1 dia",
  "no-dia": "hoje",
  "pre-venda-hoje": "hoje",
};

/**
 * Gera uma mensagem de notificação combinando um template aleatório
 * (determinístico por evento+gatilho, para evitar repetição excessiva
 * entre execuções) com o rótulo do gatilho.
 */
export function gerarMensagemNotificacao(
  tipo: TemplateNotificacaoTipo,
  gatilho: GatilhoNotificacao,
  titulo: string,
  seed = 0,
): string {
  const templates = gatilho === "pre-venda-hoje" ? TEMPLATES_PRE_VENDA : (TEMPLATES[tipo] ?? TEMPLATES.generico);
  const indice = seed % templates.length;
  const template = templates[indice];
  return template
    .replace("{titulo}", titulo)
    .replace("{dias}", ROTULOS_GATILHO[gatilho]);
}
