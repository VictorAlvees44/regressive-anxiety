import { createContext } from "react";
import type { Tema } from "../types";

export interface ThemeContextValor {
  tema: Tema;
  alternarTema: () => void;
  definirTema: (tema: Tema) => void;
}

export const ThemeContext = createContext<ThemeContextValor | undefined>(undefined);
