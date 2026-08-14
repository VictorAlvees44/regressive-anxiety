import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Tema } from "../types";

const CHAVE_STORAGE = "regressive-anxiety:tema";

interface ThemeContextValor {
  tema: Tema;
  alternarTema: () => void;
  definirTema: (tema: Tema) => void;
}

const ThemeContext = createContext<ThemeContextValor | undefined>(undefined);

function obterTemaInicial(): Tema {
  const salvo = window.localStorage.getItem(CHAVE_STORAGE) as Tema | null;
  if (salvo === "claro" || salvo === "escuro") return salvo;

  const prefereEscuro = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefereEscuro ? "escuro" : "claro";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(obterTemaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
    document.documentElement.setAttribute("data-tema", tema);
    window.localStorage.setItem(CHAVE_STORAGE, tema);
  }, [tema]);

  const valor = useMemo<ThemeContextValor>(
    () => ({
      tema,
      alternarTema: () => setTema((atual) => (atual === "claro" ? "escuro" : "claro")),
      definirTema: setTema,
    }),
    [tema],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValor {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  return contexto;
}
