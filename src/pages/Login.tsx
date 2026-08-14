import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, ShieldAlert } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { entrar } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleEntrar() {
    setErro(null);
    setCarregando(true);
    try {
      await entrar();
    } catch {
      setErro("Não foi possível entrar com o Google. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <GlassCard variante="forte" className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-accent-500/10 p-3">
            <ShieldAlert className="text-accent-500" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Acesso administrativo</h1>
            <p className="mt-1 text-sm text-base-900/55 dark:text-base-50/55">
              Entre com a conta Google autorizada para gerenciar os eventos.
            </p>
          </div>

          <Button onClick={handleEntrar} disabled={carregando} icone={<LogIn size={16} />} className="w-full">
            {carregando ? "Entrando..." : "Entrar com Google"}
          </Button>

          {erro && <p className="text-sm text-red-500">{erro}</p>}
        </GlassCard>
      </motion.div>
    </div>
  );
}
