/* Workout Tracker 2.0 service worker.
   - Caches the app's own files so it opens and works with no connection.
   - Touches ONLY the Cache Storage. It never reads or writes localStorage or IndexedDB, where workouts live.
   - Old caches are deleted only when a newer version activates. A new version waits until the app is fully closed. */
var VERSION = '25ec3b336a';
var CACHE = 'wt2-app-' + VERSION;
var FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "fonts/barlow-condensed-Bold.woff",
  "fonts/barlow-condensed-Medium.woff",
  "fonts/barlow-condensed-SemiBold.woff",
  "fonts/dm-mono-Medium.woff",
  "fonts/dm-mono-Regular.woff",
  "fonts/figtree-var.woff"
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(new Request(f, { cache: 'reload' })).then(function (r) {
        if (!r.ok) throw new Error('Could not cache ' + f);
        return c.put(f, r);
      });
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('wt2-app-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
});

self.addEventListener('message', function (e) { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;          // the app makes no outside requests
  e.respondWith(caches.open(CACHE).then(function (c) {
    var key = req.mode === 'navigate' ? './' : req;
    return c.match(key, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).catch(function () {
        return req.mode === 'navigate' ? c.match('index.html') : Response.error();
      });
    });
  }));
});
