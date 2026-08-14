import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variante?: "padrao" | "forte";
  semAnimacao?: boolean;
}

/**
 * Cartão de vidro reutilizável. É a base visual de praticamente todos
 * os blocos da interface (eventos, resumo do dia, listas, formulários).
 */
export function GlassCard({
  variante = "padrao",
  semAnimacao = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  const classeVidro = variante === "forte" ? "vidro-forte" : "vidro";

  if (semAnimacao) {
    return <div className={cn(classeVidro, "p-4", className)}>{children as ReactNode}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(classeVidro, "p-4", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
