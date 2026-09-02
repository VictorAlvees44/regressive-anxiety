import { createContext } from "react";
import type { ItemBiblioteca, StatusBiblioteca, SugestaoLancamento } from "../types";

export interface BibliotecaContextValor {
  itens: ItemBiblioteca[];
  erro: string | null;
  carregando: boolean;
  ocupados: Set<string>;
  modo: "escolher" | "local" | "conta";
  offline: boolean;
  ativarLocal: () => void;
  usarConta: () => void;
  salvar: (item: SugestaoLancamento, status: StatusBiblioteca, nota?: number | null) => Promise<boolean>;
  remover: (id: string) => Promise<boolean>;
}
export const BibliotecaContext = createContext<BibliotecaContextValor | null>(null);
