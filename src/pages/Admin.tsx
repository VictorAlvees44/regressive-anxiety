import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, LogOut } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { CategoriaBadge } from "../components/ui/CategoriaBadge";
import { EventForm } from "../components/events/EventForm";
import { NotificacoesCard } from "../components/layout/NotificacoesCard";
import { useEventos } from "../contexts/EventosContext";
import { useAuth } from "../contexts/AuthContext";
import { formatarData } from "../lib/utils";
import type { Evento } from "../types";

export function Admin() {
  const { eventos, criarEvento, editarEvento, excluirEvento } = useEventos();
  const { usuario, sair } = useAuth();
  const [modoFormulario, setModoFormulario] = useState<"nenhum" | "criar" | string>("nenhum");

  const eventoEmEdicao = eventos.find((e) => e.id === modoFormulario);

  return (
    <div className="flex flex-col gap-4">
      <Header
        titulo="Administração"
        subtitulo={`Conectado como ${usuario?.nome ?? ""}`}
        acoesExtras={
          <Button variante="fantasma" tamanho="sm" icone={<LogOut size={16} />} onClick={() => sair()}>
            Sair
          </Button>
        }
      />

      {usuario && <NotificacoesCard uid={usuario.uid} />}

      <GlassCard>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Eventos cadastrados</h2>
          <Button tamanho="sm" icone={<Plus size={16} />} onClick={() => setModoFormulario("criar")}>
            Novo evento
          </Button>
        </div>
      </GlassCard>

      <AnimatePresence>
        {modoFormulario !== "nenhum" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard variante="forte">
              <h3 className="mb-3 font-semibold">{eventoEmEdicao ? "Editar evento" : "Novo evento"}</h3>
              <EventForm
                eventoInicial={eventoEmEdicao}
                aoCancelar={() => setModoFormulario("nenhum")}
                aoSalvar={(dados) => {
                  if (eventoEmEdicao) {
                    editarEvento(eventoEmEdicao.id, dados);
                  } else {
                    criarEvento({ ...dados, favorito: false, origem: "manual", criadoPor: usuario?.email });
                  }
                  setModoFormulario("nenhum");
                }}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {eventos.map((evento) => (
          <EventoAdminItem
            key={evento.id}
            evento={evento}
            aoEditar={() => setModoFormulario(evento.id)}
            aoExcluir={() => excluirEvento(evento.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EventoAdminItem({
  evento,
  aoEditar,
  aoExcluir,
}: {
  evento: Evento;
  aoEditar: () => void;
  aoExcluir: () => void;
}) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  return (
    <GlassCard className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <CategoriaBadge categoriaId={evento.categoria} />
        <h3 className="mt-2 truncate font-semibold">{evento.titulo}</h3>
        <p className="mt-1 text-xs text-base-900/45 dark:text-base-50/45">
          {formatarData(evento.dataHoraISO, evento.possuiHorario)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={aoEditar}
          className="rounded-full p-2 text-base-900/50 hover:bg-black/5 dark:text-base-50/50 dark:hover:bg-white/10"
          aria-label="Editar evento"
        >
          <Pencil size={16} />
        </button>

        {confirmandoExclusao ? (
          <Button variante="perigo" tamanho="sm" onClick={aoExcluir}>
            Confirmar
          </Button>
        ) : (
          <button
            onClick={() => setConfirmandoExclusao(true)}
            className="rounded-full p-2 text-base-900/50 hover:bg-red-500/10 hover:text-red-500 dark:text-base-50/50"
            aria-label="Excluir evento"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </GlassCard>
  );
}
