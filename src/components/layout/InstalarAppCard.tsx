import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";

interface EventoDeInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function jaEstaInstalado(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstalarAppCard() {
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null);
  const [instalado, setInstalado] = useState(() => jaEstaInstalado());
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    function guardarEvento(eventoRecebido: Event) {
      eventoRecebido.preventDefault();
      setEvento(eventoRecebido as EventoDeInstalacao);
    }
    function confirmarInstalacao() { setInstalado(true); }

    window.addEventListener("beforeinstallprompt", guardarEvento);
    window.addEventListener("appinstalled", confirmarInstalacao);
    return () => {
      window.removeEventListener("beforeinstallprompt", guardarEvento);
      window.removeEventListener("appinstalled", confirmarInstalacao);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const escolha = await evento.userChoice;
    if (escolha.outcome === "accepted") setInstalado(true);
    setEvento(null);
  }

  if (instalado || (!evento && !ios)) return null;

  return (
    <GlassCard className="flex items-center justify-between gap-3 border-accent-500/15 bg-accent-500/[0.04]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-full bg-accent-500/10 p-2 text-accent-500"><Smartphone size={19} /></div>
        <div>
          <h2 className="font-semibold">Leve a programação no bolso</h2>
          <p className="mt-0.5 text-xs text-base-900/60 dark:text-base-50/60">
            {ios ? "No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”." : "Instale como app para abrir rapidinho e não perder nenhuma estreia."}
          </p>
        </div>
      </div>
      {evento && <Button tamanho="sm" icone={<Download size={16} />} onClick={instalar}>Instalar</Button>}
    </GlassCard>
  );
}
