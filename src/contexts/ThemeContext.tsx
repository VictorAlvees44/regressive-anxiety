import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Tema } from "../types";
import { ThemeContext, type ThemeContextValor } from "./themeContextValue";

const CHAVE_STORAGE = "regressive-anxiety:tema";

function obterTemaInicial(): Tema {
  try {
    const salvo = window.localStorage.getItem(CHAVE_STORAGE) as Tema | null;
    if (salvo === "escuro" || salvo === "claro") return salvo;
  } catch { /* Tema continua disponível quando o navegador bloqueia storage. */ }
  return "escuro";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(obterTemaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
    document.documentElement.setAttribute("data-tema", tema);
    try { window.localStorage.setItem(CHAVE_STORAGE, tema); } catch { /* Preferência permanece nesta sessão. */ }
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
