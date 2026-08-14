import { motion } from "framer-motion";
import { Heart, Ticket } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { CategoriaBadge } from "../ui/CategoriaBadge";
import { CountdownTimer } from "./CountdownTimer";
import { formatarData, cn } from "../../lib/utils";
import { calcularTempoRestante } from "../../hooks/useCountdown";
import type { Evento } from "../../types";

interface EventCardProps {
  evento: Evento;
  aoAlternarFavorito?: (id: string) => void;
  destaque?: boolean;
}

/**
 * Selo de pré-venda de ingressos (só para filmes com `dataPreVendaISO`
 * preenchida manualmente pelo administrador). Não existe API pública
 * para essa informação — ver o comentário em `src/types/index.ts`.
 */
function SeloPreVenda({ dataPreVendaISO }: { dataPreVendaISO: string }) {
  const tempo = calcularTempoRestante(dataPreVendaISO);
  const jaAbriu = tempo.chegou;

  const texto = jaAbriu
    ? "Pré-venda já está aberta"
    : tempo.dias === 0
      ? "Pré-venda começa hoje"
      : `Pré-venda em ${tempo.dias} ${tempo.dias === 1 ? "dia" : "dias"}`;

  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cat-ambar/10 px-2.5 py-1 text-xs font-medium text-cat-ambar">
      <Ticket size={12} />
      {texto}
    </span>
  );
}

export function EventCard({ evento, aoAlternarFavorito, destaque = false }: EventCardProps) {
  const mostrarPreVenda = evento.categoria === "filmes" && Boolean(evento.dataPreVendaISO) && evento.status !== "concluido";

  return (
    <GlassCard
      variante={destaque ? "forte" : "padrao"}
      className={cn("relative overflow-hidden", destaque && "p-6")}
    >
      {evento.imagemUrl && (
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-15"
          style={{
            backgroundImage: `url(${evento.imagemUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CategoriaBadge categoriaId={evento.categoria} tamanho={destaque ? "md" : "sm"} />
            {mostrarPreVenda && <SeloPreVenda dataPreVendaISO={evento.dataPreVendaISO!} />}
          </div>
          <h3 className={cn("mt-2 truncate font-semibold", destaque ? "text-xl" : "text-base")}>{evento.titulo}</h3>
          {evento.descricao && (
            <p className="mt-1 line-clamp-2 text-sm text-base-900/60 dark:text-base-50/60">{evento.descricao}</p>
          )}
          <p className="mt-1 text-xs text-base-900/45 dark:text-base-50/45">
            {formatarData(evento.dataHoraISO, evento.possuiHorario)}
          </p>
        </div>

        {aoAlternarFavorito && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => aoAlternarFavorito(evento.id)}
            aria-label="Favoritar evento"
            className="shrink-0 rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Heart
              size={18}
              className={evento.favorito ? "fill-red-500 text-red-500" : "text-base-900/40 dark:text-base-50/40"}
            />
          </motion.button>
        )}
      </div>

      <div className="mt-4">
        <CountdownTimer dataHoraISO={evento.dataHoraISO} tamanho={destaque ? "lg" : "sm"} />
      </div>
    </GlassCard>
  );
}
