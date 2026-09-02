import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, Tv, Gamepad2, BookOpen, Ellipsis } from "lucide-react";
import { cn } from "../../lib/utils";

const ITENS_NAV = [
  { rota: "/", rotulo: "Filmes", Icone: Film },
  { rota: "/series", rotulo: "Séries", Icone: Tv },
  { rota: "/jogos", rotulo: "Jogos", Icone: Gamepad2 },
  { rota: "/biblioteca", rotulo: "Biblioteca", Icone: BookOpen },
  { rota: "/mais", rotulo: "Mais", Icone: Ellipsis },
];

export function TabBar() {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/10 dark:bg-base-950/95 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {ITENS_NAV.map(({ rota, rotulo, Icone }) => (
          <NavLink key={rota} to={rota} end={rota === "/"} className="relative flex-1">
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
