importScripts('./js/sw-utils.js');
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';

const APP_SHELL = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './img/avatars/spiderman.jpg',
    './img/avatars/ironman.jpg',
    './img/avatars/wolverine.jpg',
    './img/avatars/thor.jpg',
    './img/avatars/hulk.jpg',
    './img/favicon.ico'
];
const APP_SHELL_INMUTABLE = [
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
    './css/animate.css',
    './js/libs/jquery.js'
];

self.addEventListener('install', e => {
    const cacheStatic = caches.open(STATIC_CACHE).then(cache =>
        cache.addAll(APP_SHELL));
    // Modificamos el manejo del cache inmutable
    const cacheInmutable = caches.open(INMUTABLE_CACHE).then(cache => {
        return Promise.all(
            APP_SHELL_INMUTABLE.map(url => {
                // Si la URL es externa, usamos un fetch manual con no-cors
                if (url.includes('http')) {
                    return fetch(url, { mode: 'no-cors' })
                        .then(resp => cache.put(url, resp));
                }
                // Si es local, normal
                return cache.add(url);
            })
        );
    });
    e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
});

self.addEventListener('activate', e => {
    const respuesta = caches.keys().then(keys => {
        return Promise.all(
            keys.map(key => {
                if (
                    key !== STATIC_CACHE &&
                    key !== DYNAMIC_CACHE &&
                    key !== INMUTABLE_CACHE
                ) {
                    return caches.delete(key);
                }
            })
        );
    });

    e.waitUntil(respuesta);
});

self.addEventListener('fetch', e => {
    const respuesta = caches.match(e.request).then(res => {
        if (res) {
            return res;
        } else {
            return fetch(e.request).then(newRes => {
                return actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes);
            });
        }
    });
    e.respondWith(respuesta);
});