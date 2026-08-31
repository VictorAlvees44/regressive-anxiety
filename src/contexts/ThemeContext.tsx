import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Tema } from "../types";
import { ThemeContext, type ThemeContextValor } from "./themeContextValue";

const CHAVE_STORAGE = "regressive-anxiety:tema";

function obterTemaInicial(): Tema {
  const salvo = window.localStorage.getItem(CHAVE_STORAGE) as Tema | null;
  if (salvo === "escuro") return salvo;
  return "escuro";
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
