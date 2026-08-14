import { motion, AnimatePresence } from "framer-motion";
import { useCountdown } from "../../hooks/useCountdown";
import { cn } from "../../lib/utils";

interface CountdownTimerProps {
  dataHoraISO: string;
  tamanho?: "sm" | "lg";
}

function Digito({ valor, tamanho }: { valor: number; tamanho: "sm" | "lg" }) {
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={valor}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn("block tabular-nums font-semibold", tamanho === "lg" ? "text-3xl sm:text-4xl" : "text-lg")}
        >
          {String(valor).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Unidade({ valor, rotulo, tamanho }: { valor: number; rotulo: string; tamanho: "sm" | "lg" }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Digito valor={valor} tamanho={tamanho} />
      <span className={cn("text-base-900/50 dark:text-base-50/50", tamanho === "lg" ? "text-xs" : "text-[10px]")}>
        {rotulo}
      </span>
    </div>
  );
}

/** Contador regressivo em tempo real, com transições suaves entre dígitos. */
export function CountdownTimer({ dataHoraISO, tamanho = "lg" }: CountdownTimerProps) {
  const tempo = useCountdown(dataHoraISO);

  if (tempo.chegou) {
    return (
      <motion.p
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("font-semibold", tamanho === "lg" ? "text-2xl" : "text-base")}
      >
        🎉 Hoje é o dia!
      </motion.p>
    );
  }

  return (
    <div className={cn("flex items-center", tamanho === "lg" ? "gap-4 sm:gap-6" : "gap-3")}>
      <Unidade valor={tempo.dias} rotulo="dias" tamanho={tamanho} />
      <Unidade valor={tempo.horas} rotulo="horas" tamanho={tamanho} />
      <Unidade valor={tempo.minutos} rotulo="min" tamanho={tamanho} />
      <Unidade valor={tempo.segundos} rotulo="seg" tamanho={tamanho} />
    </div>
  );
}
