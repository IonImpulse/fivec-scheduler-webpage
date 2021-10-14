const current_version = '1.5.6';
// On install, cache everything
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(current_version).then((cache) => {
            return cache.addAll([
                'index.html',
                'css/main.css',
                'css/sweetalert2.min.css',
                'scripts/app.js',
                'scripts/constructors.js',
                'scripts/data.js',
                'scripts/prelude.js',
                'scripts/startup.js',
                'scripts/libs/fuzzysort.js',
                'scripts/libs/localforage.min.js',
                'scripts/libs/qrcodegen-v1.7.0-es6.js',
                'scripts/libs/rasterizeHTML.allinone.js',
                'scripts/libs/sweetalert2.min.js',
                'scripts/libs/ics.deps.min.js',
                'scripts/workers/descriptions.js',
                'scripts/workers/searcher.js',
                'img/delete.png',
                'img/merge.png',
                'img/about-dark.png',
                'img/about-light.png',
                'img/print-dark.png',
                'img/print-light.png',
                'img/export-dark.png',
                'img/export-light.png',
                'img/theme-dark.png',
                'img/theme-light.png',
                'img/star-empty-light.png',
                'img/star-filled-light.png',
                'img/share-dark.png',
                'img/share-light.png',
                'img/load-dark.png',
                'img/load-light.png',
                'img/cal-dark.png',
                'img/cal-light.png',
                'img/dl-dark.png',
                'img/dl-light.png',
                'img/custom-course-dark.png',
                'img/custom-course-light.png',
                'img/favicons/android-chrome-192x192.png',
                'img/favicons/android-chrome-512x512.png',
                'img/favicons/apple-touch-icon.png',
                'browserconfig.xml',
                'img/favicons/favicon-16x16.png',
                'img/favicons/favicon-32x32.png',
                'img/favicons/favicon.ico',
                'fonts/JetBrainsMono-Medium.woff2',
                'fonts/Roboto-Italic-400.woff2',
                'fonts/Roboto-Normal-400.woff2',
                'fonts/Roboto-Normal-500.woff2',
                'fonts/Roboto-Normal-700.woff2',
                'img/favicons/mstile-150x150.png',
                'img/favicons/safari-pinned-tab.svg',
                'site.webmanifest',
                'sw.js',
                'robots.txt',
            ]);
        })
    );
});

// Catch and intercept all fetch requests
// and service them with the SW
self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith("https://api.5scheduler.io/")) {
        if (event.request.method === 'POST') {
            event.respondWith(
                fetch(event.request).then((response) => {
                    return response;
                }).catch((error) => {
                    return "offline";
                }));
        } else {
            if (event.request.url.includes("updateIfStale")) {
                event.respondWith(
                    fetch(event.request).then((response) => {
                        return response;
                    }).catch((error) => {
                        return {json: "No update needed"};
                    }));
            } else if (event.request.url.includes("fullUpdate")) {
                event.respondWith(
                    fetch(event.request).then((response) => {
                        return response;
                    }).catch((error) => {
                        return {json: {timestamp: 0, courses: []}};
                    }));
            }
        }
    } else {
        event.respondWith(
            caches.match(event.request).then((resp) => {
                return resp || fetch(event.request).then((response) => {
                    let responseClone = response.clone();
                    caches.open(current_version).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
    
                    return response;
                }).catch(() => {
                    return caches.match('favicon-32x32.png');
                })
            })
        );
    }
});

self.addEventListener('activate', (event) => {
    var cacheKeeplist = [current_version];

    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (cacheKeeplist.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});