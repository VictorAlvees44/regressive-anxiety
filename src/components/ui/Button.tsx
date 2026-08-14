import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variante?: "primario" | "secundario" | "fantasma" | "perigo";
  tamanho?: "sm" | "md" | "lg";
  icone?: ReactNode;
}

const CLASSES_VARIANTE: Record<NonNullable<ButtonProps["variante"]>, string> = {
  primario: "bg-accent-500 text-white hover:bg-accent-600 shadow-[var(--shadow-soft)]",
  secundario: "vidro text-base-900 dark:text-base-50",
  fantasma: "bg-transparent text-base-900 hover:bg-black/5 dark:text-base-50 dark:hover:bg-white/10",
  perigo: "bg-red-500/90 text-white hover:bg-red-600",
};

const CLASSES_TAMANHO: Record<NonNullable<ButtonProps["tamanho"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-xl",
  md: "px-4 py-2.5 text-sm rounded-2xl",
  lg: "px-6 py-3 text-base rounded-2xl",
};

export function Button({
  variante = "primario",
  tamanho = "md",
  icone,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        CLASSES_VARIANTE[variante],
        CLASSES_TAMANHO[tamanho],
        className,
      )}
      {...props}
    >
      {icone}
      {children as ReactNode}
    </motion.button>
  );
}
