import type { Evento, SugestaoLancamento } from "../types";
import { pontuacaoDasPreferencias, type PreferenciasSugestoes } from "./preferenciasSugestoes";
import type { FeedbackRecomendacoes } from "./feedbackRecomendacoes";

type Pesos = Map<string, number>;

export interface PerfilRecomendacoes {
  categorias: Pesos;
  generos: Pesos;
  elenco: Pesos;
  plataformas: Pesos;
  termos: Pesos;
  generosRejeitados: Pesos;
  termosRejeitados: Pesos;
  quantidadeSinais: number;
}

export interface AnaliseRecomendacao {
  pontuacao: number;
  motivos: string[];
}

const PALAVRAS_COMUNS = new Set([
  "para", "com", "uma", "das", "dos", "the", "and", "from", "filme", "serie", "jogo",
  "temporada", "edition", "oficial", "novo", "nova", "mais", "sobre", "seus", "suas",
]);

function normalizar(valor: string): string {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function termosDoTitulo(titulo: string): string[] {
  return [...new Set(normalizar(titulo).split(/[^a-z0-9]+/).filter((termo) => termo.length >= 4 && !PALAVRAS_COMUNS.has(termo)))];
}

function somar(pesos: Pesos, valor: string, peso: number): void {
  const chave = normalizar(valor);
  if (!chave) return;
  pesos.set(chave, (pesos.get(chave) ?? 0) + peso);
}

function pesoCorrespondente(pesos: Pesos, valores: string[] | undefined): { peso: number; melhor?: string } {
  let peso = 0;
  let melhor: string | undefined;
  let maiorPeso = 0;
  for (const valor of valores ?? []) {
    const atual = pesos.get(normalizar(valor)) ?? 0;
    peso += atual;
    if (atual > maiorPeso) {
      maiorPeso = atual;
      melhor = valor;
    }
  }
  return { peso, melhor };
}

function sugestaoPorId(sugestoes: SugestaoLancamento[]): Map<string, SugestaoLancamento> {
  return new Map(sugestoes.map((sugestao) => [sugestao.idExterno, sugestao]));
}

function aplicarSinal(perfil: PerfilRecomendacoes, sugestao: SugestaoLancamento, peso: number, rejeitado = false): void {
  if (rejeitado) {
    sugestao.generos?.forEach((genero) => somar(perfil.generosRejeitados, genero, peso));
    termosDoTitulo(sugestao.titulo).forEach((termo) => somar(perfil.termosRejeitados, termo, peso));
  } else {
    somar(perfil.categorias, sugestao.categoria, peso);
    sugestao.plataformas?.forEach((plataforma) => somar(perfil.plataformas, plataforma, peso));
    sugestao.elenco?.forEach((pessoa) => somar(perfil.elenco, pessoa, peso));
    sugestao.generos?.forEach((genero) => somar(perfil.generos, genero, peso));
    termosDoTitulo(sugestao.titulo).forEach((termo) => somar(perfil.termos, termo, peso));
  }
  perfil.quantidadeSinais += 1;
}

/**
 * Monta um perfil vetorial simples a partir de ações reais. É um recomendador
 * baseado em conteúdo: explicável, determinístico e sem enviar dados pessoais.
 */
export function construirPerfilRecomendacoes(
  sugestoes: SugestaoLancamento[],
  eventos: Evento[],
  feedback: FeedbackRecomendacoes,
): PerfilRecomendacoes {
  const perfil: PerfilRecomendacoes = {
    categorias: new Map(),
    generos: new Map(),
    elenco: new Map(),
    plataformas: new Map(),
    termos: new Map(),
    generosRejeitados: new Map(),
    termosRejeitados: new Map(),
    quantidadeSinais: 0,
  };
  const porId = sugestaoPorId(sugestoes);
  const idsDeEventos = new Set<string>();

  eventos.forEach((evento) => {
    if (!evento.idExterno) return;
    idsDeEventos.add(evento.idExterno);
    const sugestao = porId.get(evento.idExterno);
    if (sugestao) aplicarSinal(perfil, sugestao, evento.favorito ? 3 : 2);
  });

  feedback.positivas.forEach((id) => {
    if (idsDeEventos.has(id)) return;
    const sugestao = porId.get(id);
    if (sugestao) aplicarSinal(perfil, sugestao, 1.5);
  });

  feedback.ocultadas.forEach((id) => {
    const sugestao = porId.get(id);
    if (sugestao) aplicarSinal(perfil, sugestao, 1, true);
  });

  return perfil;
}

function rotuloCategoria(categoria: SugestaoLancamento["categoria"]): string {
  return categoria === "jogos" ? "jogos" : categoria === "filmes" ? "filmes" : "séries";
}

export function analisarRecomendacao(
  sugestao: SugestaoLancamento,
  perfil: PerfilRecomendacoes,
  preferencias: PreferenciasSugestoes,
): AnaliseRecomendacao {
  const motivos: string[] = [];
  let pontuacao = Math.min(4_500, Math.max(0, sugestao.relevancia ?? 0) * 0.03);
  pontuacao += pontuacaoDasPreferencias(sugestao, preferencias);

  const pesoCategoria = perfil.categorias.get(normalizar(sugestao.categoria)) ?? 0;
  pontuacao += Math.min(3_500, pesoCategoria * 700);
  if (preferencias.categorias.includes(sugestao.categoria)) {
    motivos.push(`você pediu mais ${rotuloCategoria(sugestao.categoria)}`);
  } else if (pesoCategoria >= 2) {
    motivos.push(`combina com o que você acompanha`);
  }

  const genero = pesoCorrespondente(perfil.generos, sugestao.generos);
  const generoRejeitado = pesoCorrespondente(perfil.generosRejeitados, sugestao.generos);
  pontuacao += Math.min(4_200, genero.peso * 850) - Math.min(3_500, generoRejeitado.peso * 900);
  const generoPreferido = sugestao.generos?.find((item) => preferencias.generos.some((genero) => normalizar(genero) === normalizar(item)));
  if (generoPreferido) motivos.push(`seu radar inclui ${generoPreferido}`);
  else if (genero.melhor && genero.peso >= 1.5) motivos.push(`você costuma escolher ${genero.melhor}`);

  const plataforma = pesoCorrespondente(perfil.plataformas, sugestao.plataformas);
  pontuacao += Math.min(2_400, plataforma.peso * 500);
  const plataformaPreferida = sugestao.plataformas?.find((item) =>
    [...preferencias.plataformas, ...preferencias.servicos].some((preferida) => normalizar(item).includes(normalizar(preferida))),
  );
  if (plataformaPreferida) motivos.push(`disponível em ${plataformaPreferida}`);
  else if (plataforma.melhor && plataforma.peso >= 2) motivos.push(`está onde você costuma assistir ou jogar`);

  const elenco = pesoCorrespondente(perfil.elenco, sugestao.elenco);
  pontuacao += Math.min(1_600, elenco.peso * 350);
  if (elenco.melhor && elenco.peso >= 2) motivos.push(`com ${elenco.melhor}`);

  const termos = pesoCorrespondente(perfil.termos, termosDoTitulo(sugestao.titulo));
  const termosRejeitados = pesoCorrespondente(perfil.termosRejeitados, termosDoTitulo(sugestao.titulo));
  pontuacao += Math.min(1_500, termos.peso * 300) - Math.min(2_000, termosRejeitados.peso * 500);

  const diasAteLancamento = Math.round((new Date(sugestao.dataLancamentoISO).getTime() - Date.now()) / 86_400_000);
  if (diasAteLancamento >= 0 && diasAteLancamento <= 120) {
    pontuacao += 1_200 * (1 - diasAteLancamento / 121);
    if (motivos.length === 0) motivos.push("lançamento próximo");
  } else if (sugestao.momento === "disponivel") {
    pontuacao += 250;
  }
  if ((sugestao.noticias?.length ?? 0) > 0) pontuacao += 150;
  if (motivos.length === 0 && (sugestao.relevancia ?? 0) >= 20_000) motivos.push("destaque do catálogo");

  return { pontuacao, motivos: [...new Set(motivos)].slice(0, 2) };
}
