import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { EventList } from "../components/events/EventList";
import { useCalendarioMensal, NOMES_MES, NOMES_DIA_SEMANA } from "../hooks/useCalendarioMensal";
import { useEventos } from "../contexts/EventosContext";
import { obterCategoria } from "../data/categorias";
import { cn } from "../lib/utils";

export function Calendario() {
  const { eventos, alternarFavorito } = useEventos();
  const { mesReferencia, dias, irParaMesAnterior, irParaProximoMes, irParaHoje } = useCalendarioMensal();
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const eventosPorDia = useMemo(() => {
    const mapa = new Map<string, typeof eventos>();
    eventos.forEach((evento) => {
      const chave = new Date(evento.dataHoraISO).toDateString();
      mapa.set(chave, [...(mapa.get(chave) ?? []), evento]);
    });
    return mapa;
  }, [eventos]);

  const eventosDoDiaSelecionado = diaSelecionado
    ? eventosPorDia.get(diaSelecionado.toDateString()) ?? []
    : [];

  return (
    <div className="flex flex-col gap-4">
      <Header titulo="Calendário" subtitulo="Todos os seus eventos, mês a mês" />

      <GlassCard>
        <div className="mb-3 flex items-center justify-between">
          <Button variante="fantasma" tamanho="sm" onClick={irParaMesAnterior} aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </Button>
          <button onClick={irParaHoje} className="text-sm font-semibold">
            {NOMES_MES[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
          </button>
          <Button variante="fantasma" tamanho="sm" onClick={irParaProximoMes} aria-label="Próximo mês">
            <ChevronRight size={18} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-base-900/40 dark:text-base-50/40">
          {NOMES_DIA_SEMANA.map((nome, indice) => (
            <span key={`${nome}-${indice}`}>{nome}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {dias.map(({ data, noMesAtual, hoje }) => {
            const eventosNoDia = eventosPorDia.get(data.toDateString()) ?? [];
            const corPrincipal = eventosNoDia[0] ? obterCategoria(eventosNoDia[0].categoria).cor : null;
            const selecionado = diaSelecionado?.toDateString() === data.toDateString();

            return (
              <button
                key={data.toISOString()}
                onClick={() => setDiaSelecionado(data)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm",
                  !noMesAtual && "text-base-900/25 dark:text-base-50/25",
                  hoje && "font-semibold text-accent-500",
                  selecionado && "bg-accent-500/10",
                )}
              >
                {data.getDate()}
                {eventosNoDia.length > 0 && (
                  <span
                    className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: `var(--color-cat-${corPrincipal})` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">
        {diaSelecionado && (
          <motion.div
            key={diaSelecionado.toDateString()}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="mb-2 px-1 text-sm font-semibold text-base-900/70 dark:text-base-50/70">
              Eventos em {diaSelecionado.toLocaleDateString("pt-BR")}
            </h2>
            <EventList
              eventos={eventosDoDiaSelecionado}
              aoAlternarFavorito={alternarFavorito}
              mensagemVazio="Nenhum evento neste dia."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
