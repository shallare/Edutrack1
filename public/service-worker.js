/* eslint-disable no-restricted-globals */
/**
 * Service worker Wii-Co — mode hors-ligne basique.
 * - Les fichiers statiques (JS, CSS, polices, images, modèle 3D) sont mis en
 *   cache "stale-while-revalidate" : l'app s'ouvre même sans connexion.
 * - Les appels API ne sont JAMAIS mis en cache (données toujours fraîches).
 */

const CACHE_NAME = 'wiico-static-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/models/mascot.glb'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .catch(() => { /* précache best-effort */ })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Jamais de cache pour l'API ni pour les requêtes non-GET
    if (request.method !== 'GET' || url.pathname.startsWith('/api')) return;
    // Uniquement notre propre origine (les CDN gèrent leur propre cache)
    if (url.origin !== self.location.origin) return;

    // Navigation (routes SPA) : réseau d'abord, index.html en secours hors-ligne
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match('/index.html').then((r) => r || Response.error())
            )
        );
        return;
    }

    // Statiques : cache d'abord, mise à jour en arrière-plan
    event.respondWith(
        caches.match(request).then((cached) => {
            const network = fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
