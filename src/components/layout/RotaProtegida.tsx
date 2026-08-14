import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { GlassCard } from "../ui/GlassCard";

/**
 * Protege rotas administrativas.
 * A proteção aqui é apenas de experiência de uso (UI) — a segurança
 * de fato é garantida pelas Firestore Security Rules, que bloqueiam
 * qualquer escrita de usuários fora da lista de administradores
 * mesmo que esta rota fosse contornada.
 */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando, perfil } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-base-900/50 dark:text-base-50/50">
        Verificando acesso...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (perfil !== "administrador") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <GlassCard className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">Acesso negado</h1>
          <p className="mt-2 text-sm text-base-900/60 dark:text-base-50/60">
            Sua conta não tem permissão para acessar o painel administrativo.
          </p>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
}
