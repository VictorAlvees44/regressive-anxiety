import { Link } from "react-router-dom";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";

export function NaoEncontrada() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <GlassCard variante="forte" className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-base-900/60 dark:text-base-50/60">
          O caminho que você tentou acessar não existe.
        </p>
        <Link to="/" className="mt-4 inline-block">
          <Button tamanho="sm">Voltar para o início</Button>
        </Link>
      </GlassCard>
    </div>
  );
}
