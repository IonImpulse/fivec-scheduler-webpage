const current_version = '1.5.21';
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
                'scripts/libs/focus-visible.js',
                'scripts/libs/fuzzysort.js',
                'scripts/libs/ics.deps.min.js',
                'scripts/libs/localforage.min.js',
                'scripts/libs/polyfill.js',
                'scripts/libs/qrcodegen-v1.7.0-es6.js',
                'scripts/libs/rasterizeHTML.allinone.js',
                'scripts/libs/sweetalert2.min.js',
                'scripts/workers/descriptions.js',
                'scripts/workers/searcher.js',
                'scripts/workers/courseSearch.js',
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
                'img/favicons/mstile-150x150.png',
                'img/favicons/safari-pinned-tab.svg',
                'site.webmanifest',
                'sw.js',
                'robots.txt',
            ]);
        }).catch((e) => {
            console.warn(e);
        }) 
    );
});

let init = { "status" : 408 , "statusText" : "offline" };
const offline_response = new Response(null, init)

// Catch and intercept all fetch requests
// and service them with the SW
self.addEventListener('fetch', (event) => {
    if (event.request.url.startsWith("https://api.5scheduler.io/")) {
        event.respondWith(
            fetch(event.request).then((response) => {
                return response;
            }).catch((error) => {
                return offline_response;
        }));
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
                    console.warn("Failed to fetch " + event.request.url);
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