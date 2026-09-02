import { useState } from "react";
import { Link } from "react-router-dom";
import { BookmarkPlus, Star, Trash2 } from "lucide-react";
import { useBiblioteca } from "../../hooks/useBiblioteca";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { bibliotecaNuvemConfigurada as firebaseConfigurado } from "../../lib/firebase";
import type { StatusBiblioteca, SugestaoLancamento } from "../../types";

export function ControlesBiblioteca({ sugestao }: { sugestao: SugestaoLancamento }) {
  const { itens, salvar, remover, ocupados, modo, ativarLocal, carregando, erro } = useBiblioteca();
  const item = itens.find((i) => i.sugestao.idExterno === sugestao.idExterno);
  const [confirmar, setConfirmar] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const ocupado = ocupados.has(sugestao.idExterno) || carregando;
  const salvarNota = async (status: StatusBiblioteca, nota = item?.nota ?? null) => {
    if (await salvar(sugestao, status, nota)) setMensagem("Salvo na biblioteca.");
    else setMensagem("Não foi possível salvar. Tente novamente.");
  };

  if (modo === "escolher") return <div className="space-y-2 text-sm"><p className="text-base-900/65 dark:text-base-50/65">{firebaseConfigurado ? "Salve o progresso na sua conta ou escolha uma biblioteca somente neste navegador." : "Neste ambiente, você pode escolher uma biblioteca somente neste navegador. Limpar os dados do site apaga o histórico local."}</p><div className="flex flex-wrap gap-2"><Button variante="secundario" onClick={ativarLocal}>Usar neste aparelho</Button>{firebaseConfigurado && <Link className="inline-flex min-h-11 items-center px-3 text-accent-400" to="/login">Entrar com Google</Link>}</div>{erro && <p role="alert" className="text-red-400">{erro}</p>}</div>;
  return <div className="space-y-3">
    {!item ? <Button disabled={ocupado} onClick={() => void salvarNota("quero")} icone={<BookmarkPlus size={16} />}>Quero {sugestao.categoria === "jogos" ? "jogar" : "ver"}</Button> : <>
      <label className="block text-sm font-medium">Meu progresso
        <select className="campo mt-1 w-full" aria-label={`Progresso de ${sugestao.titulo}`} disabled={ocupado} value={item.status} onChange={(e) => void salvarNota(e.target.value as StatusBiblioteca)}>
          <option value="quero">Quero {sugestao.categoria === "jogos" ? "jogar" : "ver"}</option>
          <option value="em-andamento">{sugestao.categoria === "jogos" ? "Jogando" : "Assistindo"}</option>
          <option value="finalizado">{sugestao.categoria === "jogos" ? "Joguei / finalizei" : "Já assisti"}</option>
        </select>
      </label>
      <fieldset><legend className="mb-1 text-xs text-base-900/65 dark:text-base-50/65">Sua nota {item.nota ? `· ${item.nota}/5` : "· opcional"}</legend><div className="flex flex-wrap items-center gap-1">{[1, 2, 3, 4, 5].map((nota) => <button type="button" key={nota} aria-label={`Dar ${nota} de 5 para ${sugestao.titulo}`} aria-pressed={item.nota === nota} disabled={ocupado} onClick={() => void salvarNota(item.status, nota)} className={cn("flex size-11 items-center justify-center rounded-xl hover:bg-accent-500/10 disabled:opacity-50", (item.nota ?? 0) >= nota ? "text-amber-500" : "text-base-900/35 dark:text-base-50/35")}><Star size={22} fill={(item.nota ?? 0) >= nota ? "currentColor" : "none"} /></button>)}{item.nota !== null && <button type="button" disabled={ocupado} onClick={() => void salvarNota(item.status, null)} className="min-h-11 px-2 text-xs underline">Limpar nota</button>}</div></fieldset>
      <div className="flex flex-wrap gap-2">{confirmar ? <><Button variante="perigo" tamanho="sm" disabled={ocupado} onClick={async () => { if (await remover(sugestao.idExterno)) { setConfirmar(false); setMensagem("Removido da biblioteca."); } }}>Confirmar remoção</Button><Button variante="fantasma" tamanho="sm" onClick={() => setConfirmar(false)}>Cancelar</Button></> : <button type="button" className="inline-flex min-h-11 items-center gap-2 text-xs text-base-900/55 dark:text-base-50/55" onClick={() => setConfirmar(true)}><Trash2 size={14} /> Remover da biblioteca</button>}</div>
    </>}
    <p className="text-xs text-base-900/55 dark:text-base-50/55" role="status">{ocupado ? "Salvando…" : mensagem}</p>
    {erro && <p role="alert" className="text-xs text-red-400">{erro}</p>}
  </div>;
}
