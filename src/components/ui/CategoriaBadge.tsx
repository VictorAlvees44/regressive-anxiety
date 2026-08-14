import {
  Gamepad2,
  Clapperboard,
  Tv,
  Heart,
  Plane,
  Wallet,
  CreditCard,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { obterCategoria } from "../../data/categorias";
import type { CategoriaId } from "../../types";
import { cn } from "../../lib/utils";

const MAPA_ICONES: Record<string, LucideIcon> = {
  Gamepad2,
  Clapperboard,
  Tv,
  Heart,
  Plane,
  Wallet,
  CreditCard,
  Sparkles,
};

const MAPA_COR_TEXTO: Record<string, string> = {
  violeta: "text-cat-violeta bg-cat-violeta/10",
  azul: "text-cat-azul bg-cat-azul/10",
  ciano: "text-cat-ciano bg-cat-ciano/10",
  rosa: "text-cat-rosa bg-cat-rosa/10",
  âmbar: "text-cat-ambar bg-cat-ambar/10",
  verde: "text-cat-verde bg-cat-verde/10",
  indigo: "text-cat-indigo bg-cat-indigo/10",
  grafite: "text-cat-grafite bg-cat-grafite/10",
};

interface CategoriaBadgeProps {
  categoriaId: CategoriaId;
  tamanho?: "sm" | "md";
}

export function CategoriaBadge({ categoriaId, tamanho = "sm" }: CategoriaBadgeProps) {
  const categoria = obterCategoria(categoriaId);
  const Icone = MAPA_ICONES[categoria.icone] ?? Sparkles;
  const classeCor = MAPA_COR_TEXTO[categoria.cor] ?? MAPA_COR_TEXTO.grafite;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        classeCor,
        tamanho === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
      )}
    >
      <Icone size={tamanho === "sm" ? 12 : 14} />
      {categoria.nome}
    </span>
  );
}
