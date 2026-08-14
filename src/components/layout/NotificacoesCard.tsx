import { useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { ativarNotificacoesPush, desativarNotificacoesPush, permissaoConcedida } from "../../lib/notificacoesPush";

interface NotificacoesCardProps {
  uid: string;
}

export function NotificacoesCard({ uid }: NotificacoesCardProps) {
  const [ativo, setAtivo] = useState(permissaoConcedida());
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleAtivar() {
    setCarregando(true);
    setMensagem(null);
    const resultado = await ativarNotificacoesPush(uid);
    if (resultado.sucesso) {
      setAtivo(true);
    } else {
      setMensagem(resultado.motivo);
    }
    setCarregando(false);
  }

  async function handleDesativar() {
    setCarregando(true);
    await desativarNotificacoesPush(uid);
    setAtivo(false);
    setCarregando(false);
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-accent-500/10 p-2 text-accent-500">
            {ativo ? <BellRing size={18} /> : <Bell size={18} />}
          </div>
          <div>
            <h3 className="font-semibold">Notificações push</h3>
            <p className="text-xs text-base-900/55 dark:text-base-50/55">
              {ativo ? "Ativas neste dispositivo" : "Receba avisos antes dos lançamentos"}
            </p>
          </div>
        </div>

        {ativo ? (
          <Button
            variante="fantasma"
            tamanho="sm"
            icone={<BellOff size={16} />}
            disabled={carregando}
            onClick={handleDesativar}
          >
            Desativar
          </Button>
        ) : (
          <Button tamanho="sm" icone={<Bell size={16} />} disabled={carregando} onClick={handleAtivar}>
            {carregando ? "Ativando..." : "Ativar"}
          </Button>
        )}
      </div>

      {mensagem && <p className="mt-2 text-xs text-red-500">{mensagem}</p>}
    </GlassCard>
  );
}
