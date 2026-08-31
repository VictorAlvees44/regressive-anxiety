import { createContext } from "react";
import type { Perfil, UsuarioAutenticado } from "../types";

export interface AuthContextValor {
  usuario: UsuarioAutenticado | null;
  carregando: boolean;
  perfil: Perfil;
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValor | undefined>(undefined);
