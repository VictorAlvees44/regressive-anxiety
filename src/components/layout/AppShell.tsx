import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TabBar } from "./TabBar";

function FundoAmbiente() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-cat-azul/25 blur-3xl dark:bg-cat-azul/10" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-cat-violeta/20 blur-3xl dark:bg-cat-violeta/10" />
      <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cat-rosa/15 blur-3xl dark:bg-cat-rosa/10" />
    </div>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen w-full gap-4 p-3 sm:p-4">
      <FundoAmbiente />
      <Sidebar />
      <main className="mx-auto w-full max-w-2xl flex-1 pb-24 sm:pb-6">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
