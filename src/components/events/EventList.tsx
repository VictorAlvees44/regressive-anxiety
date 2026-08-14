import { motion } from "framer-motion";
import { EventCard } from "./EventCard";
import type { Evento } from "../../types";

interface EventListProps {
  eventos: Evento[];
  aoAlternarFavorito?: (id: string) => void;
  mensagemVazio?: string;
}

const containerVariants = {
  visivel: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  oculto: { opacity: 0, y: 12 },
  visivel: { opacity: 1, y: 0 },
};

export function EventList({ eventos, aoAlternarFavorito, mensagemVazio }: EventListProps) {
  if (eventos.length === 0) {
    return (
      <div className="vidro flex flex-col items-center gap-2 p-8 text-center text-base-900/60 dark:text-base-50/60">
        <p>{mensagemVazio ?? "Nenhum evento encontrado por aqui."}</p>
      </div>
    );
  }

  return (
    <motion.div initial="oculto" animate="visivel" variants={containerVariants} className="flex flex-col gap-3">
      {eventos.map((evento) => (
        <motion.div key={evento.id} variants={itemVariants}>
          <EventCard evento={evento} aoAlternarFavorito={aoAlternarFavorito} />
        </motion.div>
      ))}
    </motion.div>
  );
}
