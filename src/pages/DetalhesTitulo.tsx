import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Check, ExternalLink, Film, Play } from "lucide-react";
import { listarSugestoes } from "../lib/sugestoesRepositorio";
import { useBiblioteca } from "../hooks/useBiblioteca";
import { useEventos } from "../hooks/useEventos";
import { useAuth } from "../hooks/useAuth";
import { useMetadadosPagina } from "../hooks/useMetadadosPagina";
import { ControlesBiblioteca } from "../components/catalogo/ControlesBiblioteca";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { firebaseConfigurado } from "../lib/firebase";
import { formatarDataLancamento, urlExternaSegura } from "../lib/filtrosCatalogo";
import type { SugestaoLancamento } from "../types";

export function DetalhesTitulo() {
  const { id } = useParams();
  const { itens, carregando: carregandoBiblioteca } = useBiblioteca();
  const [catalogo, setCatalogo] = useState<SugestaoLancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let ativo = true;
    void listarSugestoes().then((s) => { if (ativo) setCatalogo(s); }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);
  const sugestao = catalogo.find((s) => s.idExterno === id) ?? itens.find((i) => i.sugestao.idExterno === id)?.sugestao;
  if (!sugestao && (carregando || carregandoBiblioteca)) return <p role="status" className="p-8 text-center">Carregando os detalhes…</p>;
  if (!sugestao) return <GlassCard semAnimacao className="space-y-3"><h1 className="text-xl font-semibold">Título não encontrado</h1><p>Ele pode ter saído do catálogo. Os títulos salvos continuam disponíveis na sua biblioteca.</p><Link to="/biblioteca" className="inline-flex min-h-11 items-center text-accent-400">Abrir biblioteca</Link></GlassCard>;
  return <FichaTitulo key={sugestao.idExterno} sugestao={sugestao} />;
}

function FichaTitulo({ sugestao }: { sugestao: SugestaoLancamento }) {
  const location = useLocation();
  const { eventos, criarEvento } = useEventos();
  const { perfil } = useAuth();
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState("");
  const noticia = sugestao.tipoConteudo === "atualizacao-oficial";
  const capa = urlExternaSegura(sugestao.imagemUrl ?? sugestao.bannerUrl);
  const trailer = urlExternaSegura(sugestao.trailerUrl);
  const links = (sugestao.linksOficiais ?? []).filter((l) => urlExternaSegura(l.url));
  const noticias = (sugestao.noticias ?? []).filter((n) => urlExternaSegura(n.url));
  const categoriaRota = sugestao.categoria === "filmes" ? "/" : "/" + sugestao.categoria;
  const anterior: unknown = location.state?.voltar;
  const voltar = typeof anterior === "string" && /^\/(?:$|\?|jogos(?:\?|$)|series(?:\?|$)|biblioteca(?:\?|$)|sugestoes(?:\?|$))/.test(anterior) ? anterior : categoriaRota;
  const salvoNaAgenda = eventos.some((e) => e.idExterno === sugestao.idExterno);
  const hoje = new Date();
  const diasRestantes = Math.max(0, Math.round((Date.parse(sugestao.dataLancamentoISO.slice(0, 10) + "T00:00:00Z") - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86_400_000));
  useMetadadosPagina(sugestao.titulo, sugestao.descricao ?? "Conheça este título e organize sua biblioteca.", capa);

  async function acompanhar() {
    if (adicionando || salvoNaAgenda) return;
    setAdicionando(true);
    try {
      await criarEvento({ titulo: sugestao.titulo, descricao: sugestao.descricao, categoria: sugestao.categoria,
        dataHoraISO: new Date(sugestao.dataLancamentoISO.slice(0, 10) + "T12:00:00").toISOString(), possuiHorario: false,
        imagemUrl: sugestao.imagemUrl, bannerUrl: sugestao.bannerUrl, trailerUrl: sugestao.trailerUrl,
        linksOficiais: sugestao.linksOficiais, favorito: false, origem: "sugestao-api", idExterno: sugestao.idExterno });
    } catch { setErro("Não foi possível adicionar à agenda. Tente novamente."); }
    finally { setAdicionando(false); }
  }
  return <div className="space-y-5">
    <Link to={voltar} className="inline-flex min-h-11 items-center gap-2 text-sm text-accent-600 dark:text-accent-400"><ArrowLeft size={17} />Voltar à seleção</Link>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
      <div className="space-y-5">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-base-100 dark:bg-base-800"><Film size={48} className="absolute text-accent-400" />{urlExternaSegura(sugestao.bannerUrl) || capa ? <img src={urlExternaSegura(sugestao.bannerUrl) ?? capa} alt={sugestao.titulo} className="relative size-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : null}</div>
        <div><p className="mb-2 text-xs uppercase tracking-widest text-accent-500">{noticia ? "Novidade oficial" : sugestao.categoria === "filmes" ? "Filme" : sugestao.categoria === "series" ? "Série" : "Jogo"}</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{sugestao.titulo}</h1><p className="mt-2 text-sm text-base-900/60 dark:text-base-50/60">{noticia ? "Publicado em " : "Lançamento: "}{formatarDataLancamento(sugestao.dataLancamentoISO)}</p></div>
        <section className="space-y-2"><h2 className="font-semibold">{noticia ? "Sobre a novidade" : "Sobre o título"}</h2><p className="whitespace-pre-line text-sm leading-7 text-base-900/70 dark:text-base-50/70">{sugestao.descricao || "Sinopse ainda não informada pela fonte."}</p>{!!sugestao.generos?.length && <div className="flex flex-wrap gap-2 pt-2">{sugestao.generos.map((g) => <span key={g} className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-600 dark:text-accent-400">{g}</span>)}</div>}</section>
        {!!sugestao.elenco?.length && <section><h2 className="mb-2 font-semibold">Elenco</h2><p className="text-sm leading-7 text-base-900/65 dark:text-base-50/65">{sugestao.elenco.join(" · ")}</p></section>}
        <section className="space-y-2"><h2 className="font-semibold">Trailer</h2>{trailer ? <a href={trailer} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent-500/40 px-4 text-sm text-accent-600 dark:text-accent-400"><Play size={16} />Assistir ao trailer oficial<ExternalLink size={14} /></a> : <p className="text-sm text-base-900/55 dark:text-base-50/55">A fonte ainda não informou um trailer para este título.</p>}</section>
        <section className="space-y-3"><h2 className="font-semibold">Notícias relacionadas</h2>{noticias.length ? noticias.map((n) => <a key={n.url} href={n.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-xl border border-black/10 p-3 text-sm hover:border-accent-500/50 dark:border-white/10"><ExternalLink size={15} className="mt-1 shrink-0 text-accent-500" /><span>{n.titulo}<small className="mt-1 block text-base-900/50 dark:text-base-50/50">{n.fonte}</small></span></a>) : <p className="text-sm text-base-900/55 dark:text-base-50/55">Sem notícias recentes na última sincronização.</p>}</section>
      </div>
      <div className="space-y-4 lg:sticky lg:top-6">
        {!noticia && <GlassCard semAnimacao className="space-y-3"><h2 className="font-semibold">Minha biblioteca</h2><ControlesBiblioteca sugestao={sugestao} /></GlassCard>}
        <GlassCard semAnimacao className="space-y-3"><h2 className="font-semibold">{sugestao.categoria === "jogos" ? "Plataformas e links" : "Onde assistir"}</h2><p className="text-sm leading-relaxed text-base-900/65 dark:text-base-50/65">{sugestao.plataformas?.join(" · ") || "Ainda não informado."}</p>{sugestao.categoria !== "jogos" && <p className="text-xs leading-relaxed text-base-900/50 dark:text-base-50/50">Catálogo brasileiro informado pela fonte. Confirme a disponibilidade e o acesso no serviço; lançamentos futuros podem ainda não estar acessíveis.</p>}{links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 text-sm text-accent-600 dark:text-accent-400"><ExternalLink size={15} />{l.label}</a>)}</GlassCard>
        {!noticia && <GlassCard semAnimacao className="space-y-3"><h2 className="font-semibold">Contagem regressiva</h2>{sugestao.momento === "em-breve" && <p className="text-3xl font-semibold text-accent-500">{diasRestantes > 0 ? diasRestantes + (diasRestantes === 1 ? " dia" : " dias") : "Chegando agora"}</p>}<p className="text-sm text-base-900/60 dark:text-base-50/60">{sugestao.momento === "disponivel" ? "Este título já foi lançado. Seu progresso é controlado separadamente na biblioteca." : "Acompanhe a estreia na sua agenda, sem alterar o seu progresso na biblioteca."}</p>{perfil === "administrador" || !firebaseConfigurado ? <Button variante="secundario" disabled={adicionando || salvoNaAgenda} onClick={() => void acompanhar()} icone={salvoNaAgenda ? <Check size={16} /> : <CalendarPlus size={16} />}>{salvoNaAgenda ? "Na sua agenda" : adicionando ? "Adicionando…" : "Acompanhar na agenda"}</Button> : <Link to="/login" className="inline-flex min-h-11 items-center text-sm text-accent-400">Entrar como administrador para editar a agenda</Link>}{salvoNaAgenda && <Link to="/agenda" className="block text-sm text-accent-400">Ver contagens regressivas</Link>}{erro && <p role="alert" className="text-xs text-red-400">{erro}</p>}</GlassCard>}
      </div>
    </div>
  </div>;
}
