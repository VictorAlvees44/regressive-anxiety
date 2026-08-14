import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as eventosRepositorio from "../lib/eventosRepositorio";
import type { Evento } from "../types";

interface EventosContextValor {
  eventos: Evento[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  alternarFavorito: (id: string) => Promise<void>;
  criarEvento: (dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">) => Promise<void>;
  editarEvento: (id: string, alteracoes: Partial<Evento>) => Promise<void>;
  excluirEvento: (id: string) => Promise<void>;
}

const EventosContext = createContext<EventosContextValor | undefined>(undefined);

export function EventosProvider({ children }: { children: ReactNode }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await eventosRepositorio.listarEventos();
      setEventos(lista);
    } catch {
      setErro("Não foi possível carregar os eventos. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Todas as mutações abaixo são otimistas: atualizam o estado local
  // imediatamente (UI instantânea) e disparam a escrita no Firestore
  // (ou no fallback local) em paralelo. Se a escrita falhar de forma
  // inesperada, `recarregar()` restabelece o estado real na próxima
  // sincronização.
  const alternarFavorito = useCallback(
    async (id: string) => {
      const eventoAtual = eventos.find((e) => e.id === id);
      if (!eventoAtual) return;

      const novoValor = !eventoAtual.favorito;
      setEventos((atual) => atual.map((evento) => (evento.id === id ? { ...evento, favorito: novoValor } : evento)));
      await eventosRepositorio.atualizarEvento(id, { favorito: novoValor });
    },
    [eventos],
  );

  const criarEvento = useCallback(
    async (dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">) => {
      const novo = await eventosRepositorio.criarEvento(dados);
      setEventos((atual) => [...atual, novo]);
    },
    [],
  );

  const editarEvento = useCallback(async (id: string, alteracoes: Partial<Evento>) => {
    setEventos((atual) => atual.map((evento) => (evento.id === id ? { ...evento, ...alteracoes } : evento)));
    await eventosRepositorio.atualizarEvento(id, alteracoes);
  }, []);

  const excluirEvento = useCallback(async (id: string) => {
    setEventos((atual) => atual.filter((evento) => evento.id !== id));
    await eventosRepositorio.excluirEvento(id);
  }, []);

  const valor = useMemo<EventosContextValor>(
    () => ({ eventos, carregando, erro, recarregar, alternarFavorito, criarEvento, editarEvento, excluirEvento }),
    [eventos, carregando, erro, recarregar, alternarFavorito, criarEvento, editarEvento, excluirEvento],
  );

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>;
}

export function useEventos(): EventosContextValor {
  const contexto = useContext(EventosContext);
  if (!contexto) throw new Error("useEventos deve ser usado dentro de um EventosProvider");
  return contexto;
}
