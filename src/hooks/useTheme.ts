import { useContext } from "react";
import { ThemeContext, type ThemeContextValor } from "../contexts/themeContextValue";

export function useTheme(): ThemeContextValor {
  const contexto = useContext(ThemeContext);
  if (!contexto) throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  return contexto;
}
