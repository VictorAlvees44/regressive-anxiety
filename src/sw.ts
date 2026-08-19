/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker único do projeto: cuida tanto do cache offline (PWA)
 * quanto das notificações push recebidas em segundo plano (app
 * fechado ou em outra aba). Usar um único service worker evita o
 * conflito clássico entre o SW gerado pelo Workbox e o SW do Firebase
 * Messaging, que por padrão disputariam o mesmo escopo.
 */

// --- 1. Cache offline (gerado pelo vite-plugin-pwa via injectManifest) ---
precacheAndRoute(self.__WB_MANIFEST);

// JSONs públicos sincronizados diariamente: tenta rede primeiro,
// cai para o cache quando offline.
registerRoute(
  /\/data\/.*\.json$/,
  new NetworkFirst({
    cacheName: "dados-publicos",
    networkTimeoutSeconds: 4,
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 })],
  }),
);

// Imagens de capa/banner externas: cache-first (não mudam com frequência).
registerRoute(
  /^https:\/\/(images\.unsplash\.com|image\.tmdb\.org|images\.igdb\.com|cdn\.cloudflare\.steamstatic\.com|shared\.akamai\.steamstatic\.com|cdn\d1\.epicgames\.com|cdn1\.epicgames\.com|media\.rawg\.io)\/.*/,
  new CacheFirst({
    cacheName: "imagens-externas",
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// --- 2. Notificações push em segundo plano (Firebase Cloud Messaging) ---
// As mesmas chaves públicas do app (não secretas — expostas no bundle
// do cliente por natureza do Firebase Web SDK).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

try {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  // Disparado quando uma notificação chega com o app em background/fechado.
  onBackgroundMessage(messaging, (payload) => {
    const titulo = payload.notification?.title ?? "Regressive Anxiety";
    const corpo = payload.notification?.body ?? "";

    self.registration.showNotification(titulo, {
      body: corpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.fcmOptions?.link ?? payload.data?.url ?? "/" },
    });
  });
} catch (erro) {
  // Se as credenciais do Firebase não estiverem configuradas (ambiente
  // de demonstração), o cache offline acima continua funcionando
  // normalmente — só o recebimento de push fica inativo.
  console.warn("[sw] Firebase Messaging não inicializado:", erro);
}

// Clique na notificação: foca uma aba existente ou abre uma nova.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = (evento.notification.data?.url as string) ?? "/";

  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((listaClientes) => {
      const existente = listaClientes.find((cliente) => cliente.url.includes(self.registration.scope));
      if (existente) return existente.focus();
      return self.clients.openWindow(url);
    }),
  );
});

self.skipWaiting();
