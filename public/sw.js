const CACHE_NAME = "loi-thuong-static-v1";
const STATIC_ASSETS = [
    "/offline.html", "/install.html", "/manifest.webmanifest", "/css/style.css",
    "/js/pwa.js", "/js/memories.js", "/js/register.js",
    "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png",
    "/icons/icon-maskable-512.png", "/img/pets.svg"
];

self.addEventListener("install", event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(Promise.all([
        caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
        self.clients.claim()
    ]));
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
        return;
    }

    if (!STATIC_ASSETS.includes(url.pathname)) return;
    event.respondWith(fetch(request).then(response => {
        if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request, copy)));
        }
        return response;
    }).catch(() => caches.match(request)));
});
