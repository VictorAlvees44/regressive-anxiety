import type { ReactNode } from "react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface HeaderProps {
  titulo: string;
  subtitulo?: string;
  acoesExtras?: ReactNode;
}

export function Header({ titulo, subtitulo, acoesExtras }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-1 pb-4 pt-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-sm text-base-900/55 dark:text-base-50/55">{subtitulo}</p>}
      </div>
      <div className="flex items-center gap-2">
        {acoesExtras}
        <ThemeToggle />
      </div>
    </header>
  );
}
