import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as eventosRepositorio from "../lib/eventosRepositorio";
import { firebaseConfigurado } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import type { Evento } from "../types";
import { EventosContext, type EventosContextValor } from "./eventosContextValue";

export function EventosProvider({ children }: { children: ReactNode }) {
  const { usuario, perfil, carregando: carregandoAuth } = useAuth();
  const podeLer = !firebaseConfigurado || (!carregandoAuth && Boolean(usuario) && perfil === "administrador");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const versaoConsulta = useRef(0);

  const recarregar = useCallback(async () => {
    const versao = ++versaoConsulta.current;
    if (!podeLer) {
      setEventos([]);
      setErro(null);
      setCarregando(firebaseConfigurado && carregandoAuth);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const lista = await eventosRepositorio.listarEventos();
      if (versao === versaoConsulta.current) setEventos(lista);
    } catch {
      if (versao === versaoConsulta.current) {
        setEventos([]);
        setErro("Não foi possível carregar os eventos. Confira sua conexão e tente novamente.");
      }
    } finally {
      if (versao === versaoConsulta.current) setCarregando(false);
    }
  }, [podeLer, carregandoAuth]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  // Nunca mostre uma mutação como concluída antes da confirmação da gravação.
  const alternarFavorito = useCallback(
    async (id: string) => {
      const eventoAtual = eventos.find((e) => e.id === id);
      if (!eventoAtual) return;

      const novoValor = !eventoAtual.favorito;
      try {
        await eventosRepositorio.atualizarEvento(id, { favorito: novoValor });
        setEventos((atual) => atual.map((evento) => (evento.id === id ? { ...evento, favorito: novoValor } : evento)));
        setErro(null);
      } catch {
        setErro("Não foi possível atualizar o favorito. Tente novamente.");
      }
    },
    [eventos],
  );

  const criarEvento = useCallback(
    async (dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">) => {
      try {
        const novo = await eventosRepositorio.criarEvento(dados);
        setEventos((atual) => [...atual, novo]);
        setErro(null);
      } catch {
        setErro("Não foi possível salvar o evento. Confira sua conexão e tente novamente.");
        throw new Error("Não foi possível salvar o evento.");
      }
    },
    [],
  );

  const editarEvento = useCallback(async (id: string, alteracoes: Partial<Evento>) => {
    try {
      await eventosRepositorio.atualizarEvento(id, alteracoes);
      setEventos((atual) => atual.map((evento) => (evento.id === id ? { ...evento, ...alteracoes } : evento)));
      setErro(null);
    } catch {
      setErro("Não foi possível editar o evento. Confira sua conexão e tente novamente.");
      throw new Error("Não foi possível editar o evento.");
    }
  }, []);

  const excluirEvento = useCallback(async (id: string) => {
    try {
      await eventosRepositorio.excluirEvento(id);
      setEventos((atual) => atual.filter((evento) => evento.id !== id));
      setErro(null);
    } catch {
      setErro("Não foi possível excluir o evento. Confira sua conexão e tente novamente.");
      throw new Error("Não foi possível excluir o evento.");
    }
  }, []);

  const valor = useMemo<EventosContextValor>(
    () => ({ eventos: podeLer ? eventos : [], carregando, erro, recarregar, alternarFavorito, criarEvento, editarEvento, excluirEvento }),
    [eventos, podeLer, carregando, erro, recarregar, alternarFavorito, criarEvento, editarEvento, excluirEvento],
  );

  return <EventosContext.Provider value={valor}>{children}</EventosContext.Provider>;
}
