import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Configuração separada do vite.config.ts principal para não misturar
// o plugin de PWA (service worker) com o ambiente de testes.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
});
