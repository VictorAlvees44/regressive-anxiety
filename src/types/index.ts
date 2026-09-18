/**
 * Tipos centrais do domínio do Regressive Anxiety.
 *
 * Mantidos em um único módulo para facilitar a evolução do projeto:
 * novas categorias, módulos e integrações devem estender estes tipos
 * em vez de criar tipos paralelos espalhados pelo código.
 */

/** Categorias suportadas pela aplicação. */
export type CategoriaId =
  | "jogos"
  | "filmes"
  | "series"
  | "datas-pessoais"
  | "viagens"
  | "financeiro"
  | "cartoes"
  | "outros";

/** Categorias que fazem parte da experiência principal do app. */
export const CATEGORIAS_PRINCIPAIS: CategoriaId[] = ["jogos", "filmes", "series"];

/** Categorias opcionais (módulos extras). */
export const CATEGORIAS_OPCIONAIS: CategoriaId[] = [
  "datas-pessoais",
  "viagens",
  "financeiro",
  "cartoes",
  "outros",
];

export interface Categoria {
  id: CategoriaId;
  nome: string;
  icone: string; // nome do ícone (lucide-react) usado na UI
  cor: string; // token de cor usado nos gradientes/glass da categoria
}

/** Status de um evento em relação à contagem regressiva. */
export type StatusEvento = "futuro" | "hoje" | "concluido";

/** Origem do cadastro do evento. */
export type OrigemEvento = "manual" | "sugestao-api";

export interface LinkOficial {
  label: string;
  url: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  categoria: CategoriaId;

  /** Data/hora alvo da contagem regressiva, em ISO 8601 (UTC). */
  dataHoraISO: string;
  /** Indica se o usuário informou um horário específico (senão, considera-se o dia todo). */
  possuiHorario: boolean;

  imagemUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  linksOficiais?: LinkOficial[];

  /**
   * Data em que a pré-venda de ingressos abre (apenas para filmes).
   * Preenchida manualmente pelo administrador — não existe API pública
   * oficial para isso (Ingresso.com/Cinemark não expõem essa
   * informação para desenvolvedores), então essa informação é anunciada
   * nas redes sociais/imprensa antes de chegar a qualquer lugar
   * automatizável, e é registrada manualmente aqui.
   */
  dataPreVendaISO?: string;

  favorito: boolean;
  status: StatusEvento;
  origem: OrigemEvento;

  /** Referência externa (ex.: id do IGDB/TMDB) para deduplicação em sincronizações futuras. */
  idExterno?: string;

  criadoEm: string; // ISO 8601
  atualizadoEm: string; // ISO 8601
  criadoPor?: string; // uid/email do administrador responsável
}

/** Item exibido na tela de Sugestões, antes de se tornar um Evento. */
export interface SugestaoLancamento {
  id: string;
  titulo: string;
  /** Títulos alternativos para busca, inclusive o nome original. */
  aliases?: string[];
  descricao?: string;
  categoria: "jogos" | "filmes" | "series";
  dataLancamentoISO: string;
  imagemUrl?: string;
  bannerUrl?: string;
  trailerUrl?: string;
  linksOficiais?: LinkOficial[];
  /** Plataformas dos jogos ou locais brasileiros onde o filme pode ser visto. */
  plataformas?: string[];
  /** Metadados em português para a busca por gênero e elenco. */
  generos?: string[];
  elenco?: string[];
  /** Pontuação interna para manter jogos de maior relevância em evidência após o lançamento. */
  relevancia?: number;
  /** Notícias recentes, obtidas durante a sincronização diária. */
  noticias?: NoticiaSugestao[];
  /** Diferencia um lançamento rastreado de um comunicado da própria plataforma. */
  tipoConteudo?: "lancamento" | "atualizacao-oficial";
  /** Itens já lançados continuam visíveis enquanto ainda são relevantes. */
  momento: "em-breve" | "disponivel";
  idExterno: string;
  fonte: "igdb" | "steam" | "epic" | "gog" | "rawg" | "nintendo" | "playstation" | "xbox" | "rockstar" | "tmdb" | "tvmaze" | "wikidata" | "amazon-mgm" | "disney";
}

export interface NoticiaSugestao {
  titulo: string;
  url: string;
  fonte?: string;
  publicadaEmISO?: string;
}

/** Progresso de consumo, independente da data de lançamento/contagem. */
export type StatusBiblioteca = "quero" | "em-andamento" | "finalizado";
export interface ItemBiblioteca {
  sugestao: SugestaoLancamento;
  status: StatusBiblioteca;
  nota: number | null;
  criadoEm: string;
  atualizadoEm: string;
}

/** Item da Lista de Desejos (módulo opcional). */
export interface ItemListaDesejos {
  id: string;
  nome: string;
  imagemUrl?: string;
  valor?: number;
  prioridade: "baixa" | "media" | "alta";
  observacoes?: string;
  status: "desejado" | "comprado" | "descartado";
  criadoEm: string;
  atualizadoEm: string;
}

/** Categorias de frases do dia. */
export type CategoriaFrase =
  | "romantica"
  | "engracada"
  | "geek"
  | "jogos"
  | "filmes"
  | "series"
  | "motivacional";

export interface FraseDoDia {
  id: string;
  texto: string;
  categoria: CategoriaFrase;
}

/** Perfis de acesso da aplicação. */
export type Perfil = "administrador" | "visitante";

export interface UsuarioAutenticado {
  uid: string;
  nome: string;
  email: string;
  fotoUrl?: string;
  perfil: Perfil;
}

/** Filtros disponíveis na listagem de eventos. */
export type FiltroOrdenacao =
  | "mais-proximo"
  | "mais-distante"
  | "alfabetico"
  | "mais-recentes";

export interface FiltrosEventos {
  ordenacao: FiltroOrdenacao;
  categoria?: CategoriaId;
  apenasFavoritos?: boolean;
  apenasConcluidos?: boolean;
  apenasEsteMes?: boolean;
  apenasEsteAno?: boolean;
}

/** Tema visual (claro/escuro), persistido localmente e por usuário. */
export type Tema = "claro" | "escuro";
