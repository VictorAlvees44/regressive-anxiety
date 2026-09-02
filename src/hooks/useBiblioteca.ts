import { useContext } from "react";
import { BibliotecaContext } from "../contexts/bibliotecaContextValue";

export function useBiblioteca() {
  const contexto = useContext(BibliotecaContext);
  if (!contexto) throw new Error("useBiblioteca deve ser usado dentro de BibliotecaProvider");
  return contexto;
}
