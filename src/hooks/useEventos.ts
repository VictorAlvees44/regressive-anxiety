import { useContext } from "react";
import { EventosContext, type EventosContextValor } from "../contexts/eventosContextValue";

export function useEventos(): EventosContextValor {
  const contexto = useContext(EventosContext);
  if (!contexto) throw new Error("useEventos deve ser usado dentro de um EventosProvider");
  return contexto;
}
