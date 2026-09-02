import { Link, useLocation } from "react-router-dom";
import { BookmarkPlus, Check, EyeOff, Film, Sparkles, Star } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { useBiblioteca } from "../../hooks/useBiblioteca";
import { formatarDataLancamento, urlExternaSegura } from "../../lib/filtrosCatalogo";
import type { SugestaoLancamento } from "../../types";

export function CartaoTitulo({ sugestao, motivos, aoOcultar }: { sugestao: SugestaoLancamento; motivos?: string[]; aoOcultar?: () => void }) {
  const { itens, modo, salvar, ocupados, carregando } = useBiblioteca();
  const location = useLocation();
  const item = itens.find((i) => i.sugestao.idExterno === sugestao.idExterno);
  const noticia = sugestao.tipoConteudo === "atualizacao-oficial";
  const rota = `/titulo/${encodeURIComponent(sugestao.idExterno)}`;
  const imagem = urlExternaSegura(sugestao.bannerUrl ?? sugestao.imagemUrl);
  const linkState = { voltar: `${location.pathname}${location.search}` };
  const status = item?.status === "finalizado" ? "Finalizado" : item?.status === "em-andamento" ? "Em andamento" : "Quero ver / jogar";
  return <article className="min-w-0 h-full">
    <GlassCard semAnimacao className="flex h-full flex-col overflow-hidden p-0">
      <Link to={rota} state={linkState} aria-label={`Ver detalhes de ${sugestao.titulo}`} className="group relative block aspect-video overflow-hidden bg-base-100 dark:bg-base-800">
        <div className="absolute inset-0 flex items-center justify-center text-accent-400/50"><Film size={42} /></div>
        {imagem && <img src={imagem} alt="" loading="lazy" className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
        <span className="absolute bottom-2 left-2 rounded-lg bg-base-950/85 px-2.5 py-1 text-xs text-white">{noticia ? "Notícia oficial" : sugestao.momento === "em-breve" ? "Em breve" : "Já lançado"}</span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs text-base-900/55 dark:text-base-50/55 line-clamp-1">{sugestao.plataformas?.join(" · ") || "Plataformas a confirmar"}</p>
        <h2 className="font-semibold leading-snug"><Link to={rota} state={linkState} className="hover:text-accent-400">{sugestao.titulo}</Link></h2>
        <p className="line-clamp-2 text-sm text-base-900/60 dark:text-base-50/60">{sugestao.descricao || "Abra os detalhes para conhecer este título."}</p>
        <p className="text-xs text-base-900/50 dark:text-base-50/50">{noticia ? "Publicado" : "Lançamento"}: {formatarDataLancamento(sugestao.dataLancamentoISO)}</p>
        {motivos && motivos.length > 0 && <p className="flex gap-1.5 rounded-xl bg-accent-500/10 p-2 text-xs leading-relaxed text-accent-600 dark:text-accent-400"><Sparkles size={14} className="mt-0.5 shrink-0" />{motivos.join(" · ")}</p>}
        {item && <p className="flex items-center gap-1.5 text-xs text-accent-600 dark:text-accent-400"><Check size={14} />{status}{item.nota !== null && <><Star size={13} className="ml-2" />{item.nota}/5</>}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <Link to={rota} state={linkState} className="inline-flex min-h-11 items-center rounded-xl bg-accent-500 px-3 text-sm font-medium text-white hover:bg-accent-600">Ver detalhes</Link>
          {!noticia && !item && modo !== "escolher" && <button type="button" disabled={ocupados.has(sugestao.idExterno) || carregando} onClick={() => void salvar(sugestao, "quero")} aria-label={`Salvar ${sugestao.titulo} na biblioteca`} title="Quero ver / jogar" className="flex size-11 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 disabled:opacity-50"><BookmarkPlus size={18} /></button>}
          {aoOcultar && <button type="button" onClick={aoOcultar} aria-label={`Não recomendar ${sugestao.titulo}`} title="Não é para mim" className="ml-auto flex size-11 items-center justify-center rounded-xl text-base-900/45 hover:bg-black/5 dark:text-base-50/45 dark:hover:bg-white/10"><EyeOff size={18} /></button>}
        </div>
      </div>
    </GlassCard>
  </article>;
}
