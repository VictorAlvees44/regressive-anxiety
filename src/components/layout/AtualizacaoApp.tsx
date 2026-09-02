import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "../ui/Button";
import { useBiblioteca } from "../../hooks/useBiblioteca";

export function AtualizacaoApp() {
  const { ocupados } = useBiblioteca();
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);
  const { needRefresh: [novaVersao, setNovaVersao], updateServiceWorker } = useRegisterSW({
    onRegisterError() { setErro("Não foi possível preparar o modo offline. Tente reabrir o app com conexão."); },
  });
  if (!novaVersao && !erro) return null;
  return <aside role="status" aria-label="Atualização do aplicativo" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-accent-500/40 bg-white p-4 shadow-2xl dark:bg-base-800 sm:bottom-5">
    <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{novaVersao ? "Nova versão disponível" : "Modo offline indisponível"}</p><p className="mt-1 text-sm text-base-900/65 dark:text-base-50/65">{erro || "Atualize quando terminar o que está fazendo. Sua biblioteca salva será mantida."}</p></div><button type="button" aria-label="Lembrar depois" className="flex size-11 shrink-0 items-center justify-center" onClick={() => { setNovaVersao(false); setErro(""); }}><X size={18} /></button></div>
    {novaVersao && <Button className="mt-3 w-full" disabled={atualizando || ocupados.size > 0} icone={<RefreshCw size={16} />} onClick={async () => { setAtualizando(true); try { await updateServiceWorker(true); } catch { setErro("Falha ao atualizar. Confira a conexão e tente novamente."); setAtualizando(false); } }}>{ocupados.size > 0 ? "Aguardando salvar biblioteca…" : atualizando ? "Atualizando…" : "Atualizar agora"}</Button>}
  </aside>;
}
