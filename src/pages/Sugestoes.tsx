import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, RefreshCw, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { CartaoTitulo } from "../components/catalogo/CartaoTitulo";
import { useEventos } from "../hooks/useEventos";
import { useBiblioteca } from "../hooks/useBiblioteca";
import { carregarSaudeSincronizacao, listarSugestoes, type SaudeSincronizacao } from "../lib/sugestoesRepositorio";
import { carregarPreferenciasSugestoes, salvarPreferenciasSugestoes, type PreferenciasSugestoes } from "../lib/preferenciasSugestoes";
import { carregarFeedbackRecomendacoes, registrarDesinteresse, salvarFeedbackRecomendacoes } from "../lib/feedbackRecomendacoes";
import { analisarRecomendacao, construirPerfilRecomendacoes } from "../lib/recomendacoesInteligentes";
import { correspondePlataforma, FILTROS_JOGOS } from "../lib/filtrosCatalogo";
import { baseCatalogo, selecionarCatalogo } from "../lib/selecionarCatalogo";
import { cn } from "../lib/utils";
import type { SugestaoLancamento } from "../types";

const SERVICOS = ["Netflix", "Prime Video", "Disney+", "Max", "Cinema"];
const ITENS_POR_PAGINA = 24;

export function Sugestoes({ categoria }: { categoria?: SugestaoLancamento["categoria"] }) {
  const { eventos } = useEventos();
  const biblioteca = useBiblioteca();
  const [params, setParams] = useSearchParams();
  const [sugestoes, setSugestoes] = useState<SugestaoLancamento[]>([]);
  const [saude, setSaude] = useState<SaudeSincronizacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [preferenciasAbertas, setPreferenciasAbertas] = useState(false);
  const [preferencias, setPreferencias] = useState(carregarPreferenciasSugestoes);
  const [feedback, setFeedback] = useState(carregarFeedbackRecomendacoes);
  const [limite, setLimite] = useState(ITENS_POR_PAGINA);
  const busca = params.get("q") ?? "";
  const ordenar = params.get("ordem") === "data" ? "data" : "para-voce";
  const filtroJogo = FILTROS_JOGOS.find((f) => f.id === params.get("plataforma"))?.id ?? "todos";
  const servico = categoria === "jogos" ? "todos" : SERVICOS.includes(params.get("servico") ?? "") ? params.get("servico")! : "todos";
  const momento = ["disponivel", "em-breve"].includes(params.get("momento") ?? "") ? params.get("momento")! : "todos";
  const noticias = categoria === "jogos" && params.get("conteudo") === "noticias";
  const incluirFinalizados = params.get("finalizados") === "sim";

  function filtrar(chave: string, valor: string) {
    setParams((atuais) => { const proximos = new URLSearchParams(atuais); if (!valor || valor === "todos") proximos.delete(chave); else proximos.set(chave, valor); return proximos; }, { replace: true });
  }
  async function atualizarCatalogo() {
    setAtualizando(true);
    try {
      const [catalogo, proximaSaude] = await Promise.all([listarSugestoes(), carregarSaudeSincronizacao()]);
      setSugestoes(catalogo); setSaude(proximaSaude); setErro("");
    } catch { setErro("Não foi possível atualizar. Tente novamente quando estiver conectado."); }
    finally { setAtualizando(false); setCarregando(false); }
  }
  useEffect(() => { void atualizarCatalogo(); }, []);
  useEffect(() => setLimite(ITENS_POR_PAGINA), [params, preferencias]);

  function alterarPreferencia(chave: keyof PreferenciasSugestoes, valor: string) {
    const valores = preferencias[chave] as string[];
    const proximas = { ...preferencias, [chave]: valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor] };
    try { salvarPreferenciasSugestoes(proximas); setPreferencias(proximas); } catch { setErro("Não foi possível guardar suas preferências neste navegador."); }
  }
  function ocultar(sugestao: SugestaoLancamento) {
    const proximo = registrarDesinteresse(feedback, sugestao.idExterno);
    try { salvarFeedbackRecomendacoes(proximo); setFeedback(proximo); } catch { setErro("Não foi possível guardar esse feedback."); }
  }

  const perfil = useMemo(() => construirPerfilRecomendacoes(sugestoes, eventos, feedback, biblioteca.itens), [sugestoes, eventos, feedback, biblioteca.itens]);
  const analises = useMemo(() => new Map(sugestoes.map((s) => [s.idExterno, analisarRecomendacao(s, perfil, preferencias)])), [sugestoes, perfil, preferencias]);
  const base = useMemo(() => baseCatalogo(sugestoes, categoria, noticias), [sugestoes, categoria, noticias]);
  const finalizados = useMemo(() => new Set(biblioteca.itens.filter((i) => i.status === "finalizado").map((i) => i.sugestao.idExterno)), [biblioteca.itens]);
  const visiveis = useMemo(() => selecionarCatalogo(sugestoes, { categoria, plataforma: filtroJogo, servico, momento, noticias, busca, incluirFinalizados, ordem: ordenar }, feedback.ocultadas, finalizados, analises), [sugestoes, busca, feedback, incluirFinalizados, finalizados, categoria, filtroJogo, servico, momento, noticias, ordenar, analises]);
  const generos = [...new Set([...base.flatMap((s) => s.generos ?? []), ...preferencias.generos])].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const horas = saude ? Math.max(0, (Date.now() - Date.parse(saude.atualizadoEmISO)) / 3_600_000) : null;
  const titulo = categoria === "filmes" ? "Filmes" : categoria === "series" ? "Séries" : categoria === "jogos" ? "Jogos" : "Descobrir";

  return <div className="flex flex-col gap-4">
    <Header titulo={titulo} subtitulo={categoria === "jogos" ? "Seu próximo jogo, na plataforma certa." : categoria === "series" ? "Encontre a sua próxima maratona." : "Sua próxima sessão começa aqui."} acoesExtras={<Button variante="secundario" tamanho="sm" aria-label="Atualizar catálogo" title="Atualizar catálogo" disabled={atualizando} onClick={() => void atualizarCatalogo()} className="size-11 p-0" icone={<RefreshCw size={18} className={atualizando ? "animate-spin" : ""} />} />} />
    {!categoria && <nav className="flex flex-wrap gap-3 text-sm text-accent-400" aria-label="Explorar categorias"><Link to="/">Filmes</Link><Link to="/series">Séries</Link><Link to="/jogos">Jogos</Link></nav>}
    <section className="space-y-3" aria-label="Filtros do catálogo">
      <div className="flex flex-wrap items-center gap-2">
        <Chip ativo={ordenar === "para-voce"} onClick={() => filtrar("ordem", "para-voce")}><Sparkles size={15} />Para você</Chip>
        <Chip ativo={ordenar === "data"} onClick={() => filtrar("ordem", "data")}>Por lançamento</Chip>
        {categoria === "jogos" && <label className="ml-auto text-sm"><span className="sr-only">Tipo de conteúdo</span><select value={noticias ? "noticias" : "jogos"} onChange={(e) => filtrar("conteudo", e.target.value)} className="campo"><option value="jogos">Jogos</option><option value="noticias">Novidades oficiais</option></select></label>}
      </div>
      {categoria === "jogos" ? <div className="flex flex-wrap gap-2" aria-label="Plataformas e lojas de jogos">{FILTROS_JOGOS.map((f) => <Chip key={f.id} ativo={filtroJogo === f.id} onClick={() => filtrar("plataforma", f.id)}>{f.rotulo}<span className="opacity-60 text-xs">{base.filter((s) => correspondePlataforma(s, f.id)).length}</span></Chip>)}</div> : <div className="flex flex-wrap gap-2" aria-label="Serviços no Brasil">{["todos", ...SERVICOS.filter((s) => categoria !== "series" || s !== "Cinema")].map((s) => <Chip key={s} ativo={servico === s} onClick={() => filtrar("servico", s)}>{s === "todos" ? "Todos os serviços" : s}</Chip>)}</div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="campo flex min-w-0 flex-1 items-center gap-2"><Search size={18} className="shrink-0 text-accent-500" /><input type="search" className="min-w-0 flex-1 bg-transparent outline-none" aria-label={"Pesquisar " + titulo.toLocaleLowerCase("pt-BR")} placeholder={categoria === "jogos" ? "Título, gênero ou plataforma…" : "Título, ator ou gênero…"} value={busca} onChange={(e) => filtrar("q", e.target.value)} /></label>
        <select aria-label="Disponibilidade" className="campo" value={momento} onChange={(e) => filtrar("momento", e.target.value)}><option value="todos">Todos os lançamentos</option><option value="disponivel">Já lançados</option><option value="em-breve">Em breve</option></select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" aria-expanded={preferenciasAbertas} onClick={() => setPreferenciasAbertas(!preferenciasAbertas)} className="inline-flex min-h-11 items-center gap-2 text-sm text-accent-600 dark:text-accent-400"><SlidersHorizontal size={16} />Meu radar<ChevronDown size={14} className={preferenciasAbertas ? "rotate-180" : ""} /></button>
        <label className="flex min-h-11 items-center gap-2 text-xs text-base-900/65 dark:text-base-50/65"><input type="checkbox" checked={incluirFinalizados} onChange={(e) => filtrar("finalizados", e.target.checked ? "sim" : "")} />Incluir finalizados</label>
      </div>
      {preferenciasAbertas && <GlassCard semAnimacao className="space-y-4 p-4">
        <p className="text-sm text-base-900/60 dark:text-base-50/60">Suas preferências e os títulos dispensados ficam neste aparelho. As avaliações da biblioteca também ajudam a ordenar a seleção.</p>
        <Grupo titulo="Gêneros favoritos" opcoes={generos} selecionados={preferencias.generos} alternar={(v) => alterarPreferencia("generos", v)} />
        <Grupo titulo={categoria === "jogos" ? "Onde eu jogo" : "Onde eu assisto"} opcoes={categoria === "jogos" ? ["Steam", "PC", "Xbox", "PlayStation", "GOG"] : SERVICOS} selecionados={categoria === "jogos" ? preferencias.plataformas : preferencias.servicos} alternar={(v) => alterarPreferencia(categoria === "jogos" ? "plataformas" : "servicos", v)} />
        {feedback.ocultadas.length > 0 && <Button variante="fantasma" tamanho="sm" onClick={() => { const novo = { ...feedback, ocultadas: [] }; try { salvarFeedbackRecomendacoes(novo); setFeedback(novo); } catch { setErro("Não foi possível reexibir os títulos."); } }}>Reexibir {feedback.ocultadas.length} títulos dispensados</Button>}
      </GlassCard>}
    </section>
    {ordenar === "para-voce" && <p className="flex gap-2 text-xs leading-relaxed text-base-900/60 dark:text-base-50/60"><Sparkles size={16} className="shrink-0 text-accent-500" />{perfil.quantidadeSinais ? "Selecionados com base no seu radar, biblioteca e avaliações. Os motivos aparecem em cada título." : "Monte seu radar ou avalie títulos na biblioteca para deixar a seleção com a sua cara."}</p>}
    {(erro || biblioteca.erro) && <p role="alert" className="text-sm text-red-400">{erro || biblioteca.erro}</p>}
    {carregando ? <GlassCard semAnimacao>Preparando sua seleção…</GlassCard> : <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-900/55 dark:text-base-50/55"><p role="status">{visiveis.length} {noticias ? "novidades" : "títulos"} · mostrando {Math.min(limite, visiveis.length)}</p><p>{horas === null ? "Sem confirmação da última sincronização" : horas > 48 ? "Catálogo pode estar desatualizado" : "Catálogo atualizado há " + Math.floor(horas) + "h"}</p></div>
      {visiveis.length === 0 && <GlassCard semAnimacao className="space-y-3 py-10 text-center"><h2 className="font-semibold">Nenhum título com essa combinação</h2><p className="text-sm text-base-900/60 dark:text-base-50/60">{categoria === "jogos" && filtroJogo === "steam" ? "A Steam só aparece quando a loja é confirmada pela fonte. Jogos de PC não são automaticamente jogos da Steam." : "Experimente limpar os filtros ou incluir os títulos finalizados."}</p><Button variante="secundario" onClick={() => setParams({ finalizados: "sim" })}>Limpar filtros</Button></GlassCard>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{visiveis.slice(0, limite).map((s) => <CartaoTitulo key={s.idExterno} sugestao={s} motivos={ordenar === "para-voce" ? analises.get(s.idExterno)?.motivos : undefined} aoOcultar={() => ocultar(s)} />)}</div>
      {visiveis.length > limite && <Button variante="secundario" onClick={() => setLimite(limite + ITENS_POR_PAGINA)}>Mostrar mais {Math.min(ITENS_POR_PAGINA, visiveis.length - limite)}</Button>}
    </>}
  </div>;
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={ativo} onClick={onClick} className={cn("inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm transition-colors", ativo ? "border-accent-500/60 bg-accent-500/15 text-accent-600 dark:text-accent-400" : "border-black/10 text-base-900/65 hover:bg-black/5 dark:border-white/10 dark:text-base-50/65 dark:hover:bg-white/5")}>{children}</button>;
}
function Grupo({ titulo, opcoes, selecionados, alternar }: { titulo: string; opcoes: string[]; selecionados: string[]; alternar: (v: string) => void }) {
  return <fieldset><legend className="mb-2 text-xs font-medium">{titulo}</legend><div className="flex flex-wrap gap-2">{opcoes.map((v) => <Chip key={v} ativo={selecionados.includes(v)} onClick={() => alternar(v)}>{v}</Chip>)}</div></fieldset>;
}
