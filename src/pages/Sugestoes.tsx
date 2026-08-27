import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Check, ChevronDown, ExternalLink, Film, Gamepad2, Heart, Newspaper, Plus, RefreshCw, Search, Tv } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { CategoriaBadge } from "../components/ui/CategoriaBadge";
import { Button } from "../components/ui/Button";
import { formatarData, cn } from "../lib/utils";
import { useEventos } from "../contexts/EventosContext";
import { carregarSaudeSincronizacao, listarSugestoes, type SaudeSincronizacao } from "../lib/sugestoesRepositorio";
import { carregarPreferenciasSugestoes, pontuacaoDasPreferencias, salvarPreferenciasSugestoes, type PreferenciasSugestoes } from "../lib/preferenciasSugestoes";
import type { SugestaoLancamento } from "../types";

type FiltroCategoria = "todos" | SugestaoLancamento["categoria"];
type ChavePreferencia = keyof PreferenciasSugestoes;
type CampoBusca = "tudo" | "nome" | "ator" | "genero" | "plataforma";

const ITENS_POR_PAGINA = 30;
const FILTROS_CATEGORIA: { id: FiltroCategoria; rotulo: string }[] = [{ id: "todos", rotulo: "Tudo" }, { id: "filmes", rotulo: "Filmes" }, { id: "series", rotulo: "Séries" }, { id: "jogos", rotulo: "Jogos" }];
const CATEGORIAS_PREFERIDAS: { id: SugestaoLancamento["categoria"]; rotulo: string }[] = [{ id: "jogos", rotulo: "Jogos" }, { id: "filmes", rotulo: "Filmes" }, { id: "series", rotulo: "Séries" }];
const PLATAFORMAS_PREFERIDAS = ["Steam", "GOG", "PlayStation", "Xbox"];
const SERVICOS_PREFERIDOS = ["Em cartaz nos cinemas do Brasil", "Netflix", "Prime Video", "Disney+", "Max"];

function IconeCategoria({ categoria }: { categoria: SugestaoLancamento["categoria"] }) { const Icone = categoria === "filmes" ? Film : categoria === "series" ? Tv : Gamepad2; return <Icone size={26} />; }
function urlSegura(url: string): boolean { return /^https?:\/\//i.test(url); }
function textoNormalizado(valor: string) { return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR"); }
function jogoApropriadoERelevante(sugestao: SugestaoLancamento) {
  if (sugestao.categoria !== "jogos") return true;
  const texto = textoNormalizado(`${sugestao.titulo} ${sugestao.descricao ?? ""}`);
  if (/hentai|adult|erotic|sexual|nsfw|nudity|porn/.test(texto)) return false;
  // Steam e Epic entram no arquivo diário como fontes de apoio; a vitrine prioriza curadoria, não promoções aleatórias.
  return sugestao.fonte !== "steam" && sugestao.fonte !== "epic";
}
function correspondeBusca(sugestao: SugestaoLancamento, termo: string, campo: CampoBusca) {
  const consulta = textoNormalizado(termo.trim());
  if (!consulta) return true;
  const campos: Record<Exclude<CampoBusca, "tudo">, string[]> = {
    nome: [sugestao.titulo, sugestao.descricao ?? ""],
    ator: sugestao.elenco ?? [],
    genero: sugestao.generos ?? [],
    plataforma: sugestao.plataformas ?? [],
  };
  const valores = campo === "tudo" ? Object.values(campos).flat() : campos[campo];
  return valores.some((valor) => textoNormalizado(valor).includes(consulta));
}

function ordenarJogosPorDestaque(sugestoes: SugestaoLancamento[], preferencias: PreferenciasSugestoes): SugestaoLancamento[] {
  const pontuacao = (sugestao: SugestaoLancamento) => (sugestao.relevancia ?? 0) + pontuacaoDasPreferencias(sugestao, preferencias);
  const porRelevancia = [...sugestoes].sort((a, b) => pontuacao(b) - pontuacao(a));
  const destaques = porRelevancia.slice(0, 12);
  const idsDestaques = new Set(destaques.map((sugestao) => sugestao.id));
  const restantes = sugestoes.filter((sugestao) => !idsDestaques.has(sugestao.id)).sort((a, b) => {
    const dataA = new Date(a.dataLancamentoISO).getTime(); const dataB = new Date(b.dataLancamentoISO).getTime();
    const aFuturo = dataA >= Date.now(); const bFuturo = dataB >= Date.now();
    if (aFuturo !== bFuturo) return aFuturo ? -1 : 1;
    return aFuturo ? dataA - dataB : dataB - dataA;
  });
  return [...destaques, ...restantes];
}

function textoDaAtualizacao(saude: SaudeSincronizacao) {
  const horas = Math.floor(Math.max(0, Date.now() - new Date(saude.atualizadoEmISO).getTime()) / 3_600_000);
  if (horas < 1) return "atualizado há menos de uma hora";
  if (horas === 1) return "atualizado há 1 hora";
  if (horas < 48) return `atualizado há ${horas} horas`;
  return `atualizado em ${formatarData(saude.atualizadoEmISO)}`;
}

export function Sugestoes() {
  const { criarEvento, eventos } = useEventos();
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  const [sugestoes, setSugestoes] = useState<SugestaoLancamento[]>([]);
  const [saude, setSaude] = useState<SaudeSincronizacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("todos");
  const [busca, setBusca] = useState("");
  const [campoBusca, setCampoBusca] = useState<CampoBusca>("tudo");
  const [sinopsesExpandidas, setSinopsesExpandidas] = useState<Set<string>>(new Set());
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(false);
  const [preferencias, setPreferencias] = useState<PreferenciasSugestoes>(() => carregarPreferenciasSugestoes());
  const [limite, setLimite] = useState(ITENS_POR_PAGINA);

  async function atualizarCatalogo() {
    setAtualizando(true);
    const [catalogo, proximaSaude] = await Promise.all([listarSugestoes(), carregarSaudeSincronizacao()]);
    setSugestoes(catalogo); setSaude(proximaSaude); setLimite(ITENS_POR_PAGINA); setAtualizando(false);
  }

  useEffect(() => { void atualizarCatalogo().finally(() => setCarregando(false)); }, []);
  useEffect(() => { salvarPreferenciasSugestoes(preferencias); }, [preferencias]);
  useEffect(() => { setLimite(ITENS_POR_PAGINA); }, [busca, campoBusca, filtroCategoria, preferencias]);

  const idsExternosJaAdicionados = useMemo(() => new Set(eventos.map((evento) => evento.idExterno).filter(Boolean)), [eventos]);
  const sugestoesVisiveis = useMemo(() => {
    const filtradas = sugestoes.filter((sugestao) => jogoApropriadoERelevante(sugestao) && (filtroCategoria === "todos" || sugestao.categoria === filtroCategoria) && correspondeBusca(sugestao, busca, campoBusca));
    if (filtroCategoria === "jogos") return ordenarJogosPorDestaque(filtradas, preferencias);
    if (filtroCategoria === "todos" && (preferencias.categorias.length || preferencias.plataformas.length || preferencias.servicos.length)) return [...filtradas].sort((a, b) => pontuacaoDasPreferencias(b, preferencias) - pontuacaoDasPreferencias(a, preferencias));
    return filtradas;
  }, [busca, campoBusca, filtroCategoria, preferencias, sugestoes]);
  const sugestoesExibidas = sugestoesVisiveis.slice(0, limite);
  const restantes = Math.max(0, sugestoesVisiveis.length - sugestoesExibidas.length);

  function alternarSinopse(id: string) { setSinopsesExpandidas((atual) => { const proximo = new Set(atual); if (proximo.has(id)) proximo.delete(id); else proximo.add(id); return proximo; }); }
  function alternarPreferencia(chave: ChavePreferencia, valor: string) {
    setPreferencias((atual) => {
      const itens = atual[chave] as string[];
      const proximo = itens.includes(valor) ? itens.filter((item) => item !== valor) : [...itens, valor];
      return { ...atual, [chave]: proximo } as PreferenciasSugestoes;
    });
  }
  function adicionarComoEvento(sugestao: SugestaoLancamento) { criarEvento({ titulo: sugestao.titulo, descricao: sugestao.descricao, categoria: sugestao.categoria, dataHoraISO: sugestao.dataLancamentoISO, possuiHorario: false, imagemUrl: sugestao.imagemUrl, bannerUrl: sugestao.bannerUrl, trailerUrl: sugestao.trailerUrl, linksOficiais: sugestao.linksOficiais, favorito: false, origem: "sugestao-api", idExterno: sugestao.idExterno }); setAdicionados((atual) => new Set(atual).add(sugestao.id)); }

  return <div className="flex flex-col gap-4">
    <Header titulo="Descobrir" subtitulo="Cinema, séries e jogos bons demais para passar batido" acoesExtras={<Button variante="secundario" tamanho="sm" className="min-h-10 shrink-0" disabled={atualizando} onClick={() => void atualizarCatalogo()} icone={<RefreshCw size={16} className={atualizando ? "animate-spin" : ""} />}>{atualizando ? "Atualizando" : "Atualizar"}</Button>} />
    {!carregando && saude && <GlassCard semAnimacao className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-base-900/65 dark:text-base-50/65"><Activity size={16} className="shrink-0 text-cat-verde" /><span>Catálogo saudável: {textoDaAtualizacao(saude)}.</span></div><span className="text-xs text-base-900/45 dark:text-base-50/45">{saude.porCategoria.jogos} jogos · {saude.porCategoria.filmes} filmes · {saude.porCategoria.series} séries</span></GlassCard>}
    {!carregando && sugestoes.length > 0 && <section aria-label="Categorias de sugestões" className="flex flex-col gap-3"><div className="flex gap-2 overflow-x-auto pb-1 scrollbar-discreta">{FILTROS_CATEGORIA.map((filtro) => <button key={filtro.id} type="button" onClick={() => setFiltroCategoria(filtro.id)} className={cn("min-h-10 shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors", filtroCategoria === filtro.id ? "bg-accent-500 text-white" : "bg-black/5 text-base-900/70 hover:bg-black/10 dark:bg-white/10 dark:text-base-50/75 dark:hover:bg-white/15")}>{filtro.rotulo}</button>)}</div>
      <div className="flex min-w-0 gap-2"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 text-base-900/70 shadow-sm dark:border-white/10 dark:bg-base-900 dark:text-base-50/75"><Search size={17} className="shrink-0 text-accent-500" /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-base-900/40 dark:placeholder:text-base-50/40" placeholder="Buscar título, ator, gênero..." aria-label="Pesquisar sugestões" /></label><select value={campoBusca} onChange={(evento) => setCampoBusca(evento.target.value as CampoBusca)} aria-label="Filtrar tipo de busca" className="min-h-11 max-w-28 rounded-2xl border border-black/10 bg-white px-2 text-sm text-base-900 outline-none dark:border-white/10 dark:bg-base-900 dark:text-base-50"><option value="tudo">Tudo</option><option value="nome">Nome</option><option value="ator">Ator</option><option value="genero">Gênero</option><option value="plataforma">Plataforma</option></select></div>
      <button type="button" aria-expanded={preferenciasAbertas} onClick={() => setPreferenciasAbertas((aberta) => !aberta)} className="flex min-h-11 items-center justify-between rounded-2xl border border-black/5 bg-black/[0.03] px-3 text-left text-sm font-medium text-base-900/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-base-50/75"><span className="flex items-center gap-2"><Heart size={16} className="text-accent-500" /> Seu radar de preferências</span><ChevronDown size={16} className={preferenciasAbertas ? "rotate-180 transition-transform" : "transition-transform"} /></button>
      {preferenciasAbertas && <GlassCard semAnimacao className="space-y-4 p-3"><p className="text-sm text-base-900/60 dark:text-base-50/60">Marque o que você curte. A lista dá prioridade a essas escolhas neste aparelho.</p><GrupoPreferencias titulo="Quero ver mais" opcoes={CATEGORIAS_PREFERIDAS} selecionadas={preferencias.categorias} aoAlternar={(valor) => alternarPreferencia("categorias", valor)} /><GrupoPreferencias titulo="Onde eu jogo" opcoes={PLATAFORMAS_PREFERIDAS.map((rotulo) => ({ id: rotulo, rotulo }))} selecionadas={preferencias.plataformas} aoAlternar={(valor) => alternarPreferencia("plataformas", valor)} /><GrupoPreferencias titulo="Onde eu assisto" opcoes={SERVICOS_PREFERIDOS.map((rotulo) => ({ id: rotulo, rotulo: rotulo.replace("Em cartaz nos cinemas do Brasil", "Cinema") }))} selecionadas={preferencias.servicos} aoAlternar={(valor) => alternarPreferencia("servicos", valor)} /></GlassCard>}
    </section>}
    {carregando && <GlassCard className="text-center text-sm text-base-900/50 dark:text-base-50/50">Preparando a pipoca e separando os controles...</GlassCard>}
    {!carregando && sugestoes.length === 0 && <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">A estante está vazia por enquanto. Na próxima atualização ela ganha vida.</GlassCard>}
    {!carregando && sugestoes.length > 0 && sugestoesVisiveis.length === 0 && <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">Nada encontrado nesta categoria. Tente outra prateleira.</GlassCard>}
    {!carregando && sugestoesVisiveis.length > 0 && <p className="px-1 text-sm text-base-900/55 dark:text-base-50/55">Mostrando {sugestoesExibidas.length} de {sugestoesVisiveis.length} opções. Sem maratona de rolagem obrigatória.</p>}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{sugestoesExibidas.map((sugestao) => <CartaoSugestao key={sugestao.id} sugestao={sugestao} jaAdicionado={adicionados.has(sugestao.id) || idsExternosJaAdicionados.has(sugestao.idExterno)} sinopseExpandida={sinopsesExpandidas.has(sugestao.id)} aoAlternarSinopse={() => alternarSinopse(sugestao.id)} aoAcompanhar={() => adicionarComoEvento(sugestao)} />)}</div>
    {!carregando && restantes > 0 && <div className="flex justify-center pt-1"><Button tamanho="md" className="min-h-12 w-full sm:w-auto" onClick={() => setLimite((atual) => atual + ITENS_POR_PAGINA)} icone={<Plus size={18} />}>Mostrar mais {Math.min(ITENS_POR_PAGINA, restantes)}</Button></div>}
    {!carregando && sugestoesVisiveis.length > 0 && <p className="px-1 text-center text-xs text-base-900/40 dark:text-base-50/40">Atualizado diariamente com fontes de games, cinema e notícias. A fila de coisas boas nunca termina.</p>}
  </div>;
}

function CartaoSugestao({ sugestao, jaAdicionado, sinopseExpandida, aoAlternarSinopse, aoAcompanhar }: { sugestao: SugestaoLancamento; jaAdicionado: boolean; sinopseExpandida: boolean; aoAlternarSinopse: () => void; aoAcompanhar: () => void }) {
  const noticias = (sugestao.noticias ?? []).filter((noticia) => urlSegura(noticia.url)); const links = (sugestao.linksOficiais ?? []).filter((link) => urlSegura(link.url)); const disponivel = sugestao.momento === "disponivel"; const atualizacaoOficial = sugestao.tipoConteudo === "atualizacao-oficial"; const imagemPrincipal = sugestao.bannerUrl ?? sugestao.imagemUrl;
  return <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0"><GlassCard className="h-full overflow-hidden p-0"><div className="relative aspect-video overflow-hidden bg-base-900/10"><img src={`${import.meta.env.BASE_URL}icons/icon-512.png`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" /><div className="absolute inset-0 flex items-center justify-center bg-base-950/20 text-base-50/80"><IconeCategoria categoria={sugestao.categoria} /></div>{imagemPrincipal ? <img src={imagemPrincipal} alt={`Imagem de ${sugestao.titulo}`} className="relative h-full w-full object-cover" loading="lazy" onError={(evento) => { evento.currentTarget.remove(); }} /> : null}</div><div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4"><div className="flex flex-wrap items-center gap-2"><CategoriaBadge categoriaId={sugestao.categoria} /><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", atualizacaoOficial ? "bg-cat-violeta/15 text-cat-violeta" : disponivel ? "bg-cat-verde/15 text-cat-verde" : "bg-accent-500/10 text-accent-600 dark:text-accent-400")}>{atualizacaoOficial ? "Atualização oficial" : disponivel ? "Disponível agora" : "Em breve"}</span></div>{sugestao.plataformas?.length ? <p className="mt-2 line-clamp-1 text-xs text-base-900/45 dark:text-base-50/45">{sugestao.categoria === "jogos" ? sugestao.plataformas.join(" · ") : `Disponível no Brasil: ${sugestao.plataformas.join(" · ")}`}</p> : null}<h2 className="mt-2 line-clamp-2 font-semibold leading-snug">{sugestao.titulo}</h2>{sugestao.descricao && <div className="mt-1"><p className={cn("text-sm text-base-900/60 dark:text-base-50/60", !sinopseExpandida && "line-clamp-2")}>{sugestao.descricao}</p>{sugestao.descricao.length > 90 && <button type="button" onClick={aoAlternarSinopse} className="mt-1 min-h-8 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">{sinopseExpandida ? "Ver menos" : "Ver mais"}</button>}</div>}<p className="mt-2 text-xs text-base-900/45 dark:text-base-50/45">{atualizacaoOficial ? `Publicado em ${formatarData(sugestao.dataLancamentoISO)}` : disponivel ? `Lançado em ${formatarData(sugestao.dataLancamentoISO)}` : `Estreia em ${formatarData(sugestao.dataLancamentoISO)}`}</p><section className="mt-3 border-t border-black/5 pt-3 dark:border-white/10" aria-label={`Novidades sobre ${sugestao.titulo}`}><p className="flex items-center gap-1.5 text-xs font-semibold text-base-900/70 dark:text-base-50/75"><Newspaper size={14} /> Novidades</p>{noticias.length > 0 ? <ul className="mt-2 flex flex-col gap-1.5">{noticias.slice(0, 2).map((noticia) => <li key={noticia.url}><a className="flex items-start gap-1.5 text-xs leading-snug text-accent-600 hover:underline dark:text-accent-400" href={noticia.url} target="_blank" rel="noreferrer"><ExternalLink className="mt-0.5 shrink-0" size={12} /><span className="line-clamp-2">{noticia.titulo}{noticia.fonte ? ` · ${noticia.fonte}` : ""}</span></a></li>)}</ul> : links.length > 0 ? <a className="mt-2 inline-flex min-h-8 items-center gap-1.5 text-xs text-accent-600 hover:underline dark:text-accent-400" href={links[0].url} target="_blank" rel="noreferrer"><ExternalLink size={12} /> {links[0].label}</a> : <p className="mt-2 text-xs text-base-900/45 dark:text-base-50/45">Ainda sem manchetes. O estagiário da pipoca já está procurando.</p>}</section><div className="mt-auto pt-3"><Button variante={jaAdicionado ? "secundario" : "primario"} tamanho="sm" className="min-h-10" disabled={jaAdicionado} icone={jaAdicionado ? <Check size={16} /> : <Plus size={16} />} onClick={aoAcompanhar}>{jaAdicionado ? "Na sua lista" : "Acompanhar"}</Button></div></div></GlassCard></motion.article>;
}

function GrupoPreferencias({ titulo, opcoes, selecionadas, aoAlternar }: { titulo: string; opcoes: { id: string; rotulo: string }[]; selecionadas: string[]; aoAlternar: (valor: string) => void }) {
  return <div><p className="mb-2 text-xs font-semibold text-base-900/55 dark:text-base-50/55">{titulo}</p><div className="flex flex-wrap gap-2">{opcoes.map((opcao) => <button key={opcao.id} type="button" onClick={() => aoAlternar(opcao.id)} className={cn("min-h-10 rounded-xl border px-3 text-sm transition-colors", selecionadas.includes(opcao.id) ? "border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400" : "border-black/10 text-base-900/65 dark:border-white/10 dark:text-base-50/65")}>{opcao.rotulo}</button>)}</div></div>;
}
