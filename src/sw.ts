/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

/** Cache offline do PWA, gerado pelo vite-plugin-pwa via injectManifest. */
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`)));
self.addEventListener("activate", (evento) => { evento.waitUntil(self.clients.claim()); });
self.addEventListener("message", (evento) => {
  if (evento.data?.type === "SKIP_WAITING") void self.skipWaiting();
});

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
  /^https:\/\/(images\.unsplash\.com|image\.tmdb\.org|images\.igdb\.com|images\.gog-statics\.com|cdn\.cloudflare\.steamstatic\.com|shared\.akamai\.steamstatic\.com|cdn\d1\.epicgames\.com|cdn1\.epicgames\.com|media\.rawg\.io|assets\.aboutamazon\.com|lumiere-a\.akamaihd\.net)\/.*/,
  new CacheFirst({
    cacheName: "imagens-externas",
    plugins: [new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);
