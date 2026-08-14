import { useState } from "react";
import { Button } from "../ui/Button";
import { CATALOGO_CATEGORIAS } from "../../data/categorias";
import type { CategoriaId, Evento } from "../../types";

interface EventFormProps {
  eventoInicial?: Evento;
  aoSalvar: (dados: {
    titulo: string;
    descricao?: string;
    categoria: CategoriaId;
    dataHoraISO: string;
    possuiHorario: boolean;
    imagemUrl?: string;
    dataPreVendaISO?: string;
  }) => void;
  aoCancelar?: () => void;
}

export function EventForm({ eventoInicial, aoSalvar, aoCancelar }: EventFormProps) {
  const [titulo, setTitulo] = useState(eventoInicial?.titulo ?? "");
  const [descricao, setDescricao] = useState(eventoInicial?.descricao ?? "");
  const [categoria, setCategoria] = useState<CategoriaId>(eventoInicial?.categoria ?? "outros");
  const [data, setData] = useState(() =>
    eventoInicial ? eventoInicial.dataHoraISO.slice(0, 10) : "",
  );
  const [hora, setHora] = useState(() =>
    eventoInicial?.possuiHorario ? eventoInicial.dataHoraISO.slice(11, 16) : "",
  );
  const [imagemUrl, setImagemUrl] = useState(eventoInicial?.imagemUrl ?? "");
  const [dataPreVenda, setDataPreVenda] = useState(() =>
    eventoInicial?.dataPreVendaISO ? eventoInicial.dataPreVendaISO.slice(0, 10) : "",
  );

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!titulo.trim() || !data) return;

    const dataHoraISO = new Date(`${data}T${hora || "00:00"}:00`).toISOString();
    const dataPreVendaISO = dataPreVenda ? new Date(`${dataPreVenda}T00:00:00`).toISOString() : undefined;

    aoSalvar({
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      categoria,
      dataHoraISO,
      possuiHorario: Boolean(hora),
      imagemUrl: imagemUrl.trim() || undefined,
      dataPreVendaISO,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">Título *</label>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">Categoria</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as CategoriaId)}
          className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
        >
          {Object.values(CATALOGO_CATEGORIAS).map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">Data *</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">
            Hora (opcional)
          </label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      {categoria === "filmes" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">
            Data de pré-venda dos ingressos (opcional)
          </label>
          <input
            type="date"
            value={dataPreVenda}
            onChange={(e) => setDataPreVenda(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
          />
          <p className="mt-1 text-xs text-base-900/45 dark:text-base-50/45">
            Não existe API pública para isso — preencha manualmente quando a pré-venda for anunciada
            (Ingresso.com, Cinemark, redes sociais do filme). Você recebe uma notificação no dia.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-base-900/60 dark:text-base-50/60">
          URL da imagem
        </label>
        <input
          value={imagemUrl}
          onChange={(e) => setImagemUrl(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent-500 dark:border-white/10 dark:bg-white/5"
        />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        {aoCancelar && (
          <Button type="button" variante="fantasma" tamanho="sm" onClick={aoCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" tamanho="sm">
          {eventoInicial ? "Salvar alterações" : "Criar evento"}
        </Button>
      </div>
    </form>
  );
}
