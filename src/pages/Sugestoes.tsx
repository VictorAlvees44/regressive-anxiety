import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, ExternalLink, Film, Gamepad2, Newspaper, Plus, Tv } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { CategoriaBadge } from "../components/ui/CategoriaBadge";
import { Button } from "../components/ui/Button";
import { formatarData, cn } from "../lib/utils";
import { useEventos } from "../contexts/EventosContext";
import { listarSugestoes } from "../lib/sugestoesRepositorio";
import type { SugestaoLancamento } from "../types";

type FiltroCategoria = "todos" | SugestaoLancamento["categoria"];

const FILTROS_CATEGORIA: { id: FiltroCategoria; rotulo: string }[] = [
  { id: "todos", rotulo: "Tudo" },
  { id: "filmes", rotulo: "Filmes" },
  { id: "series", rotulo: "Séries" },
  { id: "jogos", rotulo: "Jogos" },
];

function IconeCategoria({ categoria }: { categoria: SugestaoLancamento["categoria"] }) {
  const Icone = categoria === "filmes" ? Film : categoria === "series" ? Tv : Gamepad2;
  return <Icone size={26} />;
}

function urlSegura(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function Sugestoes() {
  const { criarEvento, eventos } = useEventos();
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  const [sugestoes, setSugestoes] = useState<SugestaoLancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
   const [aberto, setAberto] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("todos");
  const [sinopsesExpandidas, setSinopsesExpandidas] = useState<Set<string>>(new Set());

  function alternarSinopse(id: string) {
    setSinopsesExpandidas((atual) => {
      const proximo = new Set(atual);
      proximo.has(id) ? proximo.delete(id) : proximo.add(id);
      return proximo;
    });
  }

  useEffect(() => {
    listarSugestoes().then(setSugestoes).finally(() => setCarregando(false));
  }, []);

  const idsExternosJaAdicionados = useMemo(
    () => new Set(eventos.map((e) => e.idExterno).filter(Boolean)),
    [eventos],
  );

  const sugestoesVisiveis = useMemo(
    () => sugestoes.filter((sugestao) =>
      filtroCategoria === "todos" || sugestao.categoria === filtroCategoria,
    ),
    [filtroCategoria, sugestoes],
  );

  function adicionarComoEvento(sugestao: SugestaoLancamento) {
    criarEvento({
      titulo: sugestao.titulo,
      descricao: sugestao.descricao,
      categoria: sugestao.categoria,
      dataHoraISO: sugestao.dataLancamentoISO,
      possuiHorario: false,
      imagemUrl: sugestao.imagemUrl,
      bannerUrl: sugestao.bannerUrl,
      trailerUrl: sugestao.trailerUrl,
      linksOficiais: sugestao.linksOficiais,
      favorito: false,
      origem: "sugestao-api",
      idExterno: sugestao.idExterno,
    });
    setAdicionados((atual) => new Set(atual).add(sugestao.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <Header titulo="Descobrir" subtitulo="Cinema, séries e jogos bons demais para passar batido" />

      {!carregando && sugestoes.length > 0 && (
        <section aria-label="Categorias de sugestões">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-discreta">
            {FILTROS_CATEGORIA.map((filtro) => (
              <button key={filtro.id} type="button" onClick={() => setFiltroCategoria(filtro.id)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors", filtroCategoria === filtro.id ? "bg-accent-500 text-white" : "bg-black/5 text-base-900/70 hover:bg-black/10 dark:bg-white/10 dark:text-base-50/75 dark:hover:bg-white/15")}>
                {filtro.rotulo}
              </button>
            ))}
          </div>
        </section>
      )}

      {carregando && <GlassCard className="text-center text-sm text-base-900/50 dark:text-base-50/50">Preparando a pipoca e separando os controles...</GlassCard>}

      {!carregando && sugestoes.length === 0 && <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">A estante está vazia por enquanto. Na próxima atualização ela ganha vida.</GlassCard>}

      {!carregando && sugestoes.length > 0 && sugestoesVisiveis.length === 0 && (
        <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">
          {filtroCategoria === "filmes" || filtroCategoria === "series"
            ? "O catálogo brasileiro está sendo atualizado. Rode a sincronização diária após conferir a chave TMDB."
            : "Nada encontrado neste filtro. Experimente outra categoria."}
        </GlassCard>
      )}

      {!carregando && sugestoesVisiveis.length > 0 && <p className="px-1 text-sm text-base-900/55 dark:text-base-50/55">{sugestoesVisiveis.length} opções para explorar sem ficar caçando o controle remoto.</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sugestoesVisiveis.map((sugestao) => {
          const jaAdicionado = adicionados.has(sugestao.id) || idsExternosJaAdicionados.has(sugestao.idExterno);
          const noticias = (sugestao.noticias ?? []).filter((noticia) => urlSegura(noticia.url));
          const links = (sugestao.linksOficiais ?? []).filter((link) => urlSegura(link.url));
          const disponivel = sugestao.momento === "disponivel";
          const atualizacaoOficial = sugestao.tipoConteudo === "atualizacao-oficial";
          const imagemPrincipal = sugestao.bannerUrl ?? sugestao.imagemUrl;

          return (
            <motion.article key={sugestao.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-w-0">
              <GlassCard className="h-full overflow-hidden p-0">
                <div className="relative aspect-video overflow-hidden bg-base-900/10">
                  <img src={`${import.meta.env.BASE_URL}icons/icon-512.png`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center bg-base-950/20 text-base-50/80"><IconeCategoria categoria={sugestao.categoria} /></div>
                  {imagemPrincipal ? <img src={imagemPrincipal} alt={`Imagem de ${sugestao.titulo}`} className="relative h-full w-full object-cover" loading="lazy" onError={(evento) => { evento.currentTarget.remove(); }} /> : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoriaBadge categoriaId={sugestao.categoria} />
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", atualizacaoOficial ? "bg-cat-violeta/15 text-cat-violeta" : disponivel ? "bg-cat-verde/15 text-cat-verde" : "bg-accent-500/10 text-accent-600 dark:text-accent-400")}>
                        {atualizacaoOficial ? "Atualização oficial" : disponivel ? "Disponível agora" : "Em breve"}
                      </span>
                    </div>
                    {sugestao.plataformas?.length ? <p className="mt-2 line-clamp-1 text-xs text-base-900/45 dark:text-base-50/45">{sugestao.categoria === "jogos" ? sugestao.plataformas.join(" · ") : `Disponível no Brasil: ${sugestao.plataformas.join(" · ")}`}</p> : null}
                    <h2 className="mt-2 line-clamp-2 font-semibold leading-snug">{sugestao.titulo}</h2>
                                        {sugestao.descricao && (
                      <div className="mt-1">
                        <p className={cn("text-sm text-base-900/60 dark:text-base-50/60", !sinopsesExpandidas.has(sugestao.id) && "line-clamp-2")}>{sugestao.descricao}</p>
                        {sugestao.descricao.length > 90 && (
                          <button type="button" onClick={() => alternarSinopse(sugestao.id)} className="mt-0.5 text-xs font-medium text-accent-600 hover:underline dark:text-accent-400">
                            {sinopsesExpandidas.has(sugestao.id) ? "Ver menos" : "Ver mais"}
                          </button>
                        )}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-base-900/45 dark:text-base-50/45">{atualizacaoOficial ? `Publicado em ${formatarData(sugestao.dataLancamentoISO)}` : disponivel ? `Lançado em ${formatarData(sugestao.dataLancamentoISO)}` : `Estreia em ${formatarData(sugestao.dataLancamentoISO)}`}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-3">
                      <Button variante="secundario" tamanho="sm" aria-expanded={aberto === sugestao.id} aria-controls={`detalhes-${sugestao.id}`} icone={<ChevronDown className={aberto === sugestao.id ? "rotate-180 transition-transform" : "transition-transform"} size={16} />} onClick={() => setAberto((atual) => atual === sugestao.id ? null : sugestao.id)}>Novidades</Button>
                      <Button variante={jaAdicionado ? "secundario" : "primario"} tamanho="sm" disabled={jaAdicionado} icone={jaAdicionado ? <Check size={16} /> : <Plus size={16} />} onClick={() => adicionarComoEvento(sugestao)}>{jaAdicionado ? "Na sua lista" : "Acompanhar"}</Button>
                    </div>
                </div>
              </GlassCard>

              {aberto === sugestao.id && (
                <GlassCard id={`detalhes-${sugestao.id}`} className="mt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold"><Newspaper size={16} /> O que está rolando</div>
                  {noticias.length ? <ul className="mt-3 flex flex-col gap-2">{noticias.map((noticia) => <li key={noticia.url}><a className="flex items-start gap-2 text-sm text-accent-600 hover:underline dark:text-accent-400" href={noticia.url} target="_blank" rel="noreferrer"><ExternalLink className="mt-0.5 shrink-0" size={14} /><span>{noticia.titulo}{noticia.fonte ? <span className="text-base-900/45 dark:text-base-50/45"> · {noticia.fonte}</span> : null}</span></a></li>)}</ul> : <p className="mt-2 text-sm text-base-900/55 dark:text-base-50/55">As notícias entram na próxima atualização diária.</p>}
                  {links.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{links.map((link) => <a key={link.url} className="inline-flex items-center gap-1.5 rounded-xl bg-black/5 px-3 py-1.5 text-xs font-medium text-base-900/70 hover:bg-black/10 dark:bg-white/10 dark:text-base-50/70 dark:hover:bg-white/15" href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> {link.label}</a>)}</div>}
                </GlassCard>
              )}
            </motion.article>
          );
        })}
      </div>

      {!carregando && sugestoesVisiveis.length > 0 && <p className="px-1 text-center text-xs text-base-900/40 dark:text-base-50/40">Atualizado diariamente com fontes de games, cinema e notícias. A fila de coisas boas nunca termina.</p>}
    </div>
  );
}
