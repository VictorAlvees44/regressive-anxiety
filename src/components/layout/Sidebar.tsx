import { NavLink } from "react-router-dom";
import { Home, Sparkles, Calendar, Gift, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const ITENS_NAV = [
  { rota: "/", rotulo: "Início", Icone: Home },
  { rota: "/sugestoes", rotulo: "Sugestões", Icone: Sparkles },
  { rota: "/calendario", rotulo: "Calendário", Icone: Calendar },
  { rota: "/lista-de-desejos", rotulo: "Lista de desejos", Icone: Gift },
];

export function Sidebar() {
  const { perfil } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-1 p-4 sm:flex">
      <div className="vidro-forte flex h-full flex-col gap-1 p-3">
        <div className="mb-4 px-2 pt-2">
          <p className="text-lg font-semibold">Regressive Anxiety</p>
          <p className="text-xs text-base-900/50 dark:text-base-50/50">Seus lançamentos, sem pressa.</p>
        </div>

        {ITENS_NAV.map(({ rota, rotulo, Icone }) => (
          <NavLink key={rota} to={rota} end={rota === "/"}>
            {({ isActive }) => (
              <div className="relative flex items-center gap-3 rounded-xl px-3 py-2.5">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-ativa"
                    className="absolute inset-0 rounded-xl bg-accent-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icone
                  size={18}
                  className={cn(
                    "relative z-10",
                    isActive ? "text-accent-500" : "text-base-900/60 dark:text-base-50/60",
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-sm font-medium",
                    isActive ? "text-accent-500" : "text-base-900/70 dark:text-base-50/70",
                  )}
                >
                  {rotulo}
                </span>
              </div>
            )}
          </NavLink>
        ))}

        {perfil === "administrador" && (
          <NavLink to="/admin" className="mt-auto">
            {({ isActive }) => (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5",
                  isActive && "bg-accent-500/10",
                )}
              >
                <ShieldCheck size={18} className="text-accent-500" />
                <span className="text-sm font-medium text-accent-500">Administração</span>
              </div>
            )}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
