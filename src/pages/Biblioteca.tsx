import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Download, Search } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { ControlesBiblioteca } from "../components/catalogo/ControlesBiblioteca";
import { useBiblioteca } from "../hooks/useBiblioteca";
import { STATUS_BIBLIOTECA } from "../lib/biblioteca";
import { normalizarTexto, urlExternaSegura } from "../lib/filtrosCatalogo";
import { bibliotecaNuvemConfigurada as firebaseConfigurado } from "../lib/firebase";
import { cn } from "../lib/utils";

export function Biblioteca() {
  const { itens, modo, ativarLocal, usarConta, carregando, offline, erro } = useBiblioteca();
  const [status, setStatus] = useState("todos");
  const [categoria, setCategoria] = useState("todos");
  const [busca, setBusca] = useState("");
  const visiveis = itens.filter((i) => (status === "todos" || i.status === status) && (categoria === "todos" || i.sugestao.categoria === categoria) && normalizarTexto(i.sugestao.titulo).includes(normalizarTexto(busca))).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  function exportar() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(itens, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "minha-biblioteca-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-4">
    <Header titulo="Minha biblioteca" subtitulo="Sua fila, suas maratonas e suas descobertas." />
    <GlassCard semAnimacao className="space-y-3 p-4">
      <p className="text-sm text-base-900/65 dark:text-base-50/65">{modo === "local" ? "Biblioteca somente neste navegador. Limpar os dados do site apaga esse histórico: mantenha um backup." : modo === "conta" ? "Biblioteca privada da sua conta Google. Não é compartilhada com outros usuários da agenda." : "Escolha onde guardar seu progresso. A biblioteca local e a da conta são separadas; nenhuma migração é feita automaticamente."}</p>
      <div className="flex flex-wrap items-center gap-2">{modo !== "local" && <Button variante="secundario" tamanho="sm" onClick={ativarLocal}>Usar neste aparelho</Button>}{firebaseConfigurado && modo !== "conta" && <Link onClick={usarConta} to="/login" className="inline-flex min-h-11 items-center px-3 text-sm text-accent-400">Usar minha conta Google</Link>}{itens.length > 0 && <Button variante="fantasma" tamanho="sm" onClick={exportar} icone={<Download size={15} />}>Exportar backup</Button>}</div>
      {offline && <p role="status" className="text-xs text-amber-500">{modo === "conta" ? "Sem conexão: alterações podem aguardar sincronização. Não feche o app antes de confirmar o envio." : "Sem conexão. A biblioteca local continua funcionando."}</p>}
      {erro && <p role="alert" className="text-sm text-red-400">{erro}</p>}
    </GlassCard>
    <div className="flex flex-wrap gap-2" aria-label="Status da biblioteca">{[{ id: "todos", rotulo: "Todos" }, ...STATUS_BIBLIOTECA].map((s) => <button type="button" key={s.id} aria-pressed={status === s.id} onClick={() => setStatus(s.id)} className={cn("min-h-11 rounded-xl border px-3 text-sm", status === s.id ? "border-accent-500/60 bg-accent-500/15 text-accent-600 dark:text-accent-400" : "border-black/10 dark:border-white/10")}>{s.rotulo} <span className="text-xs opacity-60">{itens.filter((i) => s.id === "todos" || i.status === s.id).length}</span></button>)}</div>
    <div className="flex flex-col gap-2 sm:flex-row"><label className="campo flex min-w-0 flex-1 items-center gap-2"><Search size={17} /><input aria-label="Pesquisar na biblioteca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar na minha biblioteca…" className="min-w-0 flex-1 bg-transparent outline-none" /></label><select aria-label="Categoria da biblioteca" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo"><option value="todos">Todas as categorias</option><option value="filmes">Filmes</option><option value="series">Séries</option><option value="jogos">Jogos</option></select></div>
    {carregando ? <p role="status">Carregando biblioteca…</p> : visiveis.length === 0 ? <GlassCard semAnimacao className="space-y-3 py-10 text-center"><BookOpen size={32} className="mx-auto text-accent-500" /><h2 className="font-semibold">{itens.length ? "Nenhum título neste filtro" : "Sua próxima descoberta começa a biblioteca"}</h2><p className="text-sm text-base-900/60 dark:text-base-50/60">Abra um título e marque “Quero ver” ou “Quero jogar”.</p><Link to="/" className="inline-flex min-h-11 items-center text-accent-400">Explorar filmes</Link></GlassCard> : <div className="grid gap-4 xl:grid-cols-2">{visiveis.map((i) => <GlassCard key={i.sugestao.idExterno} semAnimacao className="space-y-3"><div className="flex items-start gap-3">{urlExternaSegura(i.sugestao.imagemUrl) && <img src={i.sugestao.imagemUrl} alt="" loading="lazy" className="h-24 w-16 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />}<div><p className="text-xs capitalize text-base-900/55 dark:text-base-50/55">{i.sugestao.categoria}</p><h2 className="mt-1 font-semibold"><Link to={"/titulo/" + encodeURIComponent(i.sugestao.idExterno)} state={{ voltar: "/biblioteca" }} className="hover:text-accent-400">{i.sugestao.titulo}</Link></h2><p className="mt-1 text-xs text-base-900/55 dark:text-base-50/55">{i.sugestao.plataformas?.join(" · ")}</p></div></div><ControlesBiblioteca sugestao={i.sugestao} /></GlassCard>)}</div>}
  </div>;
}
