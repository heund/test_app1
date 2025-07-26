self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('artisan-logic-app').then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './manifest.json',
        './spec1.png',
        './audioa.wav',
        './audiob.wav'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
