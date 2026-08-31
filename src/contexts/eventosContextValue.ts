import { createContext } from "react";
import type { Evento } from "../types";

export interface EventosContextValor {
  eventos: Evento[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
  alternarFavorito: (id: string) => Promise<void>;
  criarEvento: (dados: Omit<Evento, "id" | "criadoEm" | "atualizadoEm" | "status">) => Promise<void>;
  editarEvento: (id: string, alteracoes: Partial<Evento>) => Promise<void>;
  excluirEvento: (id: string) => Promise<void>;
}

export const EventosContext = createContext<EventosContextValor | undefined>(undefined);
