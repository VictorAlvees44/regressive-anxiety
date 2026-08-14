import { motion } from "framer-motion";
import { useSaudacao } from "../hooks/useSaudacao";
import { useFraseDoDia } from "../hooks/useFraseDoDia";
import { useEventos } from "../contexts/EventosContext";
import { useProximosEventos } from "../hooks/useEventosFiltrados";
import { EventCard } from "../components/events/EventCard";
import { EventList } from "../components/events/EventList";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { GlassCard } from "../components/ui/GlassCard";
import { InstalarAppCard } from "../components/layout/InstalarAppCard";

export function Home() {
  const saudacao = useSaudacao();
  const frase = useFraseDoDia();
  const { eventos, carregando, erro, alternarFavorito } = useEventos();
  const proximos = useProximosEventos(eventos);
  const [maisProximo, ...restante] = proximos;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1 pb-1 pt-2 sm:hidden">
        <div>
          <p className="text-sm text-base-900/55 dark:text-base-50/55">{saudacao}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Regressive Anxiety</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="hidden sm:block px-1 pt-2">
        <p className="text-sm text-base-900/55 dark:text-base-50/55">{saudacao}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-1 text-sm italic text-base-900/60 dark:text-base-50/60"
      >
        “{frase.texto}”
      </motion.p>

      <InstalarAppCard />

      {carregando && (
        <GlassCard className="text-center text-sm text-base-900/50 dark:text-base-50/50">
          Carregando seus eventos...
        </GlassCard>
      )}

      {erro && <GlassCard className="text-center text-sm text-red-500">{erro}</GlassCard>}

      {!carregando && !erro && (
        <>
          {maisProximo ? (
            <EventCard evento={maisProximo} aoAlternarFavorito={alternarFavorito} destaque />
          ) : (
            <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">
              Nenhum evento cadastrado ainda. Que tal adicionar o primeiro?
            </GlassCard>
          )}

          {restante.length > 0 && (
            <div className="mt-2">
              <h2 className="mb-2 px-1 text-sm font-semibold text-base-900/70 dark:text-base-50/70">
                Próximos eventos
              </h2>
              <EventList eventos={restante} aoAlternarFavorito={alternarFavorito} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
