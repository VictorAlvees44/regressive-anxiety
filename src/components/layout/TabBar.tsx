import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Sparkles, Calendar, Gift } from "lucide-react";
import { cn } from "../../lib/utils";

const ITENS_NAV = [
  { rota: "/", rotulo: "Início", Icone: Home },
  { rota: "/sugestoes", rotulo: "Sugestões", Icone: Sparkles },
  { rota: "/calendario", rotulo: "Calendário", Icone: Calendar },
  { rota: "/lista-de-desejos", rotulo: "Desejos", Icone: Gift },
];

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 sm:hidden">
      <div className="vidro-forte mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {ITENS_NAV.map(({ rota, rotulo, Icone }) => (
          <NavLink key={rota} to={rota} className="relative flex-1">
            {({ isActive }) => (
              <div className="relative flex flex-col items-center gap-0.5 px-2 py-1.5">
                {isActive && (
                  <motion.div
                    layoutId="tab-ativa"
                    className="absolute inset-0 rounded-xl bg-accent-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icone
                  size={20}
                  className={cn(
                    "relative z-10",
                    isActive ? "text-accent-500" : "text-base-900/40 dark:text-base-50/40",
                  )}
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-medium",
                    isActive ? "text-accent-500" : "text-base-900/40 dark:text-base-50/40",
                  )}
                >
                  {rotulo}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
