import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";
import { AtualizacaoApp } from "./AtualizacaoApp";

function FundoAmbiente() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-cat-azul/8 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-cat-violeta/7 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cat-rosa/5 blur-3xl" />
    </div>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return (
    <div className="app-shell flex min-h-[100dvh] w-full gap-4 overflow-x-clip sm:p-4">
      <FundoAmbiente />
      <Sidebar />
      <main className="mx-auto min-w-0 w-full max-w-6xl flex-1 pb-6">
        <Outlet />
      </main>
      <TabBar />
      <AtualizacaoApp />
    </div>
  );
}
