import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // Em produção (GitHub Pages), defina VITE_BASE_PATH="/nome-do-repositorio/"
  // como variável de ambiente no workflow de build. Localmente, "/" funciona.
  base: process.env.VITE_BASE_PATH ?? "/",
  define: {
    __APP_VERSION__: JSON.stringify("0.2.0" + (process.env.GITHUB_SHA ? " · " + process.env.GITHUB_SHA.slice(0, 7) : "")),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // injectManifest: usamos um service worker próprio (src/sw.ts)
      // em vez do gerado automaticamente, para controlar o cache offline.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        // Evita que os JSONs de dados (atualizados diariamente) e os
        // ícones fiquem presos num precache desatualizado; eles são
        // tratados por rotas de runtime caching dentro de sw.ts.
        globPatterns: ["**/*.{js,css,html}"],
      },
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["favicon.png", "icons/*.png"],
      manifest: {
        name: "Regressive Anxiety",
        short_name: "Reg. Anxiety",
        description: "Painel pessoal de contagens regressivas para jogos, filmes, séries e muito mais.",
        theme_color: "#4f6bf0",
        background_color: "#0b0b0d",
        display: "standalone",
        orientation: "portrait",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "firebase-firestore", test: /node_modules[\\/]@firebase[\\/](?:firestore|webchannel-wrapper)[\\/]/, priority: 50 },
            { name: "firebase-auth", test: /node_modules[\\/]@firebase[\\/]auth[\\/]/, priority: 40 },
            { name: "firebase-core", test: /node_modules[\\/](?:firebase|@firebase)[\\/]/, priority: 30 },
            { name: "motion", test: /node_modules[\\/]framer-motion[\\/]/, priority: 20 },
            { name: "react", test: /node_modules[\\/](?:react|react-dom|react-router|react-router-dom)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
