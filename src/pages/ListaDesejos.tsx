import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import * as listaDesejosRepositorio from "../lib/listaDesejosRepositorio";
import type { ItemListaDesejos } from "../types";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../lib/utils";

const CORES_PRIORIDADE: Record<ItemListaDesejos["prioridade"], string> = {
  baixa: "text-cat-verde bg-cat-verde/10",
  media: "text-cat-ambar bg-cat-ambar/10",
  alta: "text-cat-rosa bg-cat-rosa/10",
};

export function ListaDesejos() {
  const { perfil } = useAuth();
  const podeEditar = perfil === "administrador";
  const [itens, setItens] = useState<ItemListaDesejos[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nomeNovoItem, setNomeNovoItem] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  useEffect(() => {
    let consultaAtiva = true;
    listaDesejosRepositorio.listarItens()
      .then((lista) => {
        if (!consultaAtiva) return;
        setItens(lista);
        setErro(null);
      })
      .catch(() => {
        if (consultaAtiva) setErro("Não foi possível carregar a lista. Confira sua conexão e tente novamente.");
      })
      .finally(() => {
        if (consultaAtiva) setCarregando(false);
      });
    return () => { consultaAtiva = false; };
  }, []);

  async function adicionarItem() {
    if (!nomeNovoItem.trim() || salvando) return;
    setSalvando(true);
    try {
      const novo = await listaDesejosRepositorio.criarItem({
        nome: nomeNovoItem.trim(),
        prioridade: "media",
        status: "desejado",
      });
      setItens((atual) => [...atual, novo]);
      setNomeNovoItem("");
      setErro(null);
    } catch {
      setErro("Não foi possível adicionar o item. Nenhuma alteração foi salva.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerItem(id: string) {
    if (removendoId) return;
    setRemovendoId(id);
    try {
      await listaDesejosRepositorio.excluirItem(id);
      setItens((atual) => atual.filter((item) => item.id !== id));
      setErro(null);
    } catch {
      setErro("Não foi possível remover o item. Ele continua salvo na lista.");
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Header titulo="Lista de desejos" subtitulo="Coisas que vocês querem ter ou fazer" />

      {podeEditar && (
        <GlassCard className="flex items-center gap-2">
          <input
            value={nomeNovoItem}
            onChange={(evento) => setNomeNovoItem(evento.target.value)}
            onKeyDown={(evento) => evento.key === "Enter" && void adicionarItem()}
            disabled={salvando}
            placeholder="Adicionar item à lista..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-900/40 dark:placeholder:text-base-50/40"
          />
          <Button tamanho="sm" icone={<Plus size={16} />} onClick={() => void adicionarItem()} disabled={salvando}>
            {salvando ? "Salvando…" : "Adicionar"}
          </Button>
        </GlassCard>
      )}

      {erro && (
        <GlassCard className="border-red-500/25 bg-red-500/5 text-sm text-red-700 dark:text-red-300" role="alert">
          {erro}
        </GlassCard>
      )}

      {carregando ? (
        <GlassCard className="text-center text-sm text-base-900/50 dark:text-base-50/50">
          Carregando lista de desejos...
        </GlassCard>
      ) : itens.length === 0 ? (
        <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">
          A lista de desejos está vazia por enquanto.
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-3">
          {itens.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.nome}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        CORES_PRIORIDADE[item.prioridade],
                      )}
                    >
                      Prioridade {item.prioridade}
                    </span>
                    {item.valor && (
                      <span className="text-xs text-base-900/50 dark:text-base-50/50">
                        R$ {item.valor.toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {podeEditar && (
                  <button
                    onClick={() => void removerItem(item.id)}
                    disabled={removendoId !== null}
                    className="rounded-full p-2 text-base-900/40 hover:bg-black/5 dark:text-base-50/40 dark:hover:bg-white/10"
                    aria-label={removendoId === item.id ? `Removendo ${item.nome}` : `Remover ${item.nome}`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
