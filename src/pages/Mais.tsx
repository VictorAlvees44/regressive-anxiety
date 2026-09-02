import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Gift, LogIn, RefreshCw, ShieldCheck, Timer } from "lucide-react";
import { Header } from "../components/layout/Header";
import { GlassCard } from "../components/ui/GlassCard";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export function Mais() {
  const { perfil, usuario, sair } = useAuth();
  const [mensagem, setMensagem] = useState("");
  const links = [{ to: "/agenda", label: "Minhas contagens regressivas", Icone: Timer }, { to: "/calendario", label: "Calendário", Icone: Calendar }, { to: "/lista-de-desejos", label: "Lista de desejos", Icone: Gift }, { to: "/login", label: "Conta Google", Icone: LogIn }];
  if (perfil === "administrador") links.push({ to: "/admin", label: "Administração", Icone: ShieldCheck });
  return <div className="space-y-4"><Header titulo="Mais" subtitulo="Sua agenda, conta e informações do aplicativo." /><GlassCard semAnimacao className="divide-y divide-black/5 dark:divide-white/10">{links.map(({ to, label, Icone }) => <Link to={to} key={to} className="flex min-h-14 items-center gap-3 text-sm hover:text-accent-400"><Icone size={18} />{label}</Link>)}{usuario && <div className="pt-3"><p className="text-sm">Conectado como {usuario.nome}</p><Button variante="fantasma" onClick={() => void sair()}>Sair da conta</Button></div>}</GlassCard><GlassCard semAnimacao className="space-y-3"><h2 className="font-semibold">Novidades desta versão</h2><ul className="list-disc space-y-1 pl-5 text-sm text-base-900/65 dark:text-base-50/65"><li>Filmes na entrada; séries e jogos em espaços próprios.</li><li>Filtros Steam, PC, Xbox e PlayStation.</li><li>Biblioteca com progresso, avaliações e recomendações pessoais.</li><li>Detalhes completos e aviso de novas versões.</li></ul><p className="text-xs text-base-900/55 dark:text-base-50/55">Versão {__APP_VERSION__} · {new Date(__BUILD_TIME__).toLocaleString("pt-BR")}</p><Button variante="secundario" icone={<RefreshCw size={16} />} onClick={async () => { try { if (!("serviceWorker" in navigator)) { setMensagem("Este navegador não oferece modo offline."); return; } const registro = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL); if (!registro) { setMensagem("A verificação estará disponível no aplicativo publicado."); return; } await registro.update(); setMensagem(registro.waiting || registro.installing ? "Uma atualização está sendo preparada. Aguarde o aviso para atualizar." : "Verificação concluída. Você está na versão disponível para este navegador."); } catch { setMensagem("Não foi possível verificar agora. Confira sua conexão."); } }}>Verificar atualização</Button><p role="status" className="text-xs">{mensagem}</p></GlassCard></div>;
}
