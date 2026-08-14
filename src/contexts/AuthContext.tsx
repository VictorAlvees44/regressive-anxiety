import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { emailEhAdministrador, entrarComGoogle, firebaseConfigurado, observarUsuario, sair } from "../lib/firebase";
import type { Perfil, UsuarioAutenticado } from "../types";

interface AuthContextValor {
  usuario: UsuarioAutenticado | null;
  carregando: boolean;
  perfil: Perfil;
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValor | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Observa o estado de autenticação do Firebase. A verificação de
    // permissão (admin x visitante) acontece aqui no cliente apenas
    // para fins de UI — a autorização real é sempre garantida pelas
    // Firestore Security Rules no backend.
    //
    // Em ambientes sem credenciais do Firebase configuradas (ex.: uma
    // demonstração local sem `.env.local`), a inicialização do SDK
    // pode falhar. Nesse caso, tratamos o usuário como "visitante" em
    // vez de deixar a aplicação inteira quebrar.
    if (!firebaseConfigurado) {
      setCarregando(false);
      return undefined;
    }

    try {
      const cancelarInscricao = observarUsuario((firebaseUser) => {
        if (!firebaseUser) {
          setUsuario(null);
          setCarregando(false);
          return;
        }

        setUsuario({
          uid: firebaseUser.uid,
          nome: firebaseUser.displayName ?? "Usuário",
          email: firebaseUser.email ?? "",
          fotoUrl: firebaseUser.photoURL ?? undefined,
          perfil: emailEhAdministrador(firebaseUser.email) ? "administrador" : "visitante",
        });
        setCarregando(false);
      });

      return cancelarInscricao;
    } catch {
      setUsuario(null);
      setCarregando(false);
      return undefined;
    }
  }, []);

  const valor = useMemo<AuthContextValor>(
    () => ({
      usuario,
      carregando,
      perfil: usuario?.perfil ?? "visitante",
      entrar: async () => {
        await entrarComGoogle();
      },
      sair,
    }),
    [usuario, carregando],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValor {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return contexto;
}
