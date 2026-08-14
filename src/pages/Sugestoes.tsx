import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { CategoriaBadge } from "../components/ui/CategoriaBadge";
import { Button } from "../components/ui/Button";
import { formatarData } from "../lib/utils";
import { useEventos } from "../contexts/EventosContext";
import { listarSugestoes } from "../lib/sugestoesRepositorio";
import type { SugestaoLancamento } from "../types";

export function Sugestoes() {
  const { criarEvento, eventos } = useEventos();
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  const [sugestoes, setSugestoes] = useState<SugestaoLancamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    listarSugestoes()
      .then(setSugestoes)
      .finally(() => setCarregando(false));
  }, []);

  const idsExternosJaAdicionados = useMemo(
    () => new Set(eventos.map((e) => e.idExterno).filter(Boolean)),
    [eventos],
  );

  function adicionarComoEvento(sugestao: SugestaoLancamento) {
    criarEvento({
      titulo: sugestao.titulo,
      descricao: sugestao.descricao,
      categoria: sugestao.categoria,
      dataHoraISO: sugestao.dataLancamentoISO,
      possuiHorario: false,
      imagemUrl: sugestao.imagemUrl,
      bannerUrl: sugestao.bannerUrl,
      trailerUrl: sugestao.trailerUrl,
      linksOficiais: sugestao.linksOficiais,
      favorito: false,
      origem: "sugestao-api",
      idExterno: sugestao.idExterno,
    });
    setAdicionados((atual) => new Set(atual).add(sugestao.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <Header titulo="Sugestões" subtitulo="Lançamentos futuros de jogos, filmes e séries" />

      {carregando && (
        <GlassCard className="text-center text-sm text-base-900/50 dark:text-base-50/50">
          Carregando sugestões...
        </GlassCard>
      )}

      {!carregando && sugestoes.length === 0 && (
        <GlassCard className="text-center text-sm text-base-900/55 dark:text-base-50/55">
          Nenhuma sugestão disponível no momento.
        </GlassCard>
      )}

      <div className="flex flex-col gap-3">
        {sugestoes.map((sugestao) => {
          const jaAdicionado = adicionados.has(sugestao.id) || idsExternosJaAdicionados.has(sugestao.idExterno);

          return (
            <motion.div key={sugestao.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CategoriaBadge categoriaId={sugestao.categoria} />
                  <h3 className="mt-2 truncate font-semibold">{sugestao.titulo}</h3>
                  {sugestao.descricao && (
                    <p className="mt-1 line-clamp-2 text-sm text-base-900/60 dark:text-base-50/60">
                      {sugestao.descricao}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-base-900/45 dark:text-base-50/45">
                    {formatarData(sugestao.dataLancamentoISO)}
                  </p>
                </div>

                <Button
                  variante={jaAdicionado ? "secundario" : "primario"}
                  tamanho="sm"
                  disabled={jaAdicionado}
                  icone={jaAdicionado ? <Check size={16} /> : <Plus size={16} />}
                  onClick={() => adicionarComoEvento(sugestao)}
                >
                  {jaAdicionado ? "Adicionado" : "Adicionar"}
                </Button>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <p className="px-1 text-center text-xs text-base-900/40 dark:text-base-50/40">
        Estas sugestões são atualizadas uma vez por dia via GitHub Actions, a partir das APIs do IGDB/RAWG e TMDB.
      </p>
    </div>
  );
}
