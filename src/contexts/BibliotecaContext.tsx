import { useEffect, useRef, useState, type ReactNode } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import { db, bibliotecaNuvemConfigurada } from "../lib/firebase";
import { CHAVE_BIBLIOTECA, atualizarBiblioteca, lerBiblioteca, prepararItemBiblioteca, validarItemBiblioteca } from "../lib/biblioteca";
import { BibliotecaContext, type BibliotecaContextValor } from "./bibliotecaContextValue";
import type { ItemBiblioteca } from "../types";

const CHAVE_MODO = "regressive-anxiety:biblioteca-local-autorizada";
function modoLocalAutorizado() {
  try { return localStorage.getItem(CHAVE_MODO) === "sim"; } catch { return false; }
}

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const [local, setLocal] = useState(modoLocalAutorizado);
  const [erroModo, setErroModo] = useState<string | null>(null);
  const uid = !local && bibliotecaNuvemConfigurada ? usuario?.uid : undefined;
  function escolherLocal(valor: boolean) {
    try {
      localStorage.setItem(CHAVE_MODO, valor ? "sim" : "nao");
      setLocal(valor);
      setErroModo(null);
    } catch { setErroModo("O navegador bloqueou o armazenamento. Libere-o para usar a biblioteca local."); }
  }
  return <BibliotecaSessao key={uid ?? (local ? "local" : "escolher")} uid={uid} modo={uid ? "conta" : local ? "local" : "escolher"} aguardandoLogin={carregando} ativarLocal={() => escolherLocal(true)} usarConta={() => escolherLocal(false)} erroModo={erroModo}>{children}</BibliotecaSessao>;
}

function BibliotecaSessao({ children, uid, modo, aguardandoLogin, ativarLocal, usarConta, erroModo }: {
  children: ReactNode; uid?: string; modo: BibliotecaContextValor["modo"]; aguardandoLogin: boolean;
  ativarLocal: () => void; usarConta: () => void; erroModo: string | null;
}) {
  const [itens, setItens] = useState<ItemBiblioteca[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const itensRef = useRef(itens);
  const operacoes = useRef(new Set<string>());
  const pronto = useRef(false);

  useEffect(() => {
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", online); };
  }, []);

  useEffect(() => {
    function receber(novos: ItemBiblioteca[]) {
      itensRef.current = novos; setItens(novos); pronto.current = true; setErro(null); setCarregando(false);
    }
    if (uid) {
      return onSnapshot(collection(db, "bibliotecas", uid, "itens"), (snapshot) => {
        receber(snapshot.docs.map((d) => d.data()).filter(validarItemBiblioteca));
      }, () => {
        pronto.current = false;
        setErro("Não foi possível acessar a biblioteca da conta. Confira a conexão e as regras do Firebase. Seus dados locais não foram enviados nem apagados.");
        setCarregando(false);
      });
    }
    function carregar() {
      try { receber(modo === "local" ? lerBiblioteca(localStorage.getItem(CHAVE_BIBLIOTECA)) : []); }
      catch { pronto.current = false; setErro("Não foi possível ler a biblioteca local. O conteúdo existente foi preservado; não serão feitas gravações sobre ele."); setCarregando(false); }
    }
    carregar();
    const aoStorage = (event: StorageEvent) => { if (event.key === CHAVE_BIBLIOTECA || event.key === null) carregar(); };
    window.addEventListener("storage", aoStorage);
    return () => window.removeEventListener("storage", aoStorage);
  }, [uid, modo]);

  async function gravar(id: string, item?: ItemBiblioteca): Promise<boolean> {
    if (modo === "escolher" || !pronto.current || operacoes.current.has(id)) return false;
    operacoes.current.add(id); setOcupados(new Set(operacoes.current));
    try {
      if (uid) {
        const ref = doc(db, "bibliotecas", uid, "itens", encodeURIComponent(id));
        if (item) await setDoc(ref, JSON.parse(JSON.stringify(item)));
        else await deleteDoc(ref);
      } else {
        // Releia antes de gravar para preservar alterações de outras abas.
        const atuais = lerBiblioteca(localStorage.getItem(CHAVE_BIBLIOTECA));
        const novos = item ? atualizarBiblioteca(atuais, item) : atuais.filter((i) => i.sugestao.idExterno !== id);
        localStorage.setItem(CHAVE_BIBLIOTECA, JSON.stringify(novos));
        itensRef.current = novos; setItens(novos);
      }
      setErro(null); return true;
    } catch {
      setErro("Não foi possível salvar. Verifique a conexão, o espaço disponível e as permissões. A alteração não foi confirmada.");
      return false;
    } finally { operacoes.current.delete(id); setOcupados(new Set(operacoes.current)); }
  }

  const valor: BibliotecaContextValor = {
    itens, erro: erroModo ?? erro, carregando: carregando || aguardandoLogin, ocupados, modo, offline, ativarLocal, usarConta,
    salvar: async (sugestao, status, nota) => {
      try {
        const anterior = itensRef.current.find((i) => i.sugestao.idExterno === sugestao.idExterno);
        return await gravar(sugestao.idExterno, prepararItemBiblioteca(sugestao, status, nota === undefined ? anterior?.nota ?? null : nota, anterior));
      } catch { setErro("Os dados deste título são inválidos. Nenhuma alteração foi salva."); return false; }
    },
    remover: (id) => gravar(id),
  };
  return <BibliotecaContext.Provider value={valor}>{children}</BibliotecaContext.Provider>;
}
