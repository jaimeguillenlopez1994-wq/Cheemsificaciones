/**
 * Service worker: sitio instalable y disponible sin conexión.
 * Solo se registra en el sitio publicado (ver js/core/layout.js).
 *
 * - Páginas y datos JSON: primero la red (contenido siempre al día);
 *   sin conexión, la copia guardada o la página "sin conexión".
 * - Estilos, scripts, imágenes y fuentes: copia guardada al instante y
 *   actualización en segundo plano.
 * - Cada publicación trae una VERSION nueva y borra las copias antiguas.
 */
const VERSION = 'desarrollo'; // la reemplaza npm run construir
const CACHE = `cheems-${VERSION}`;
const PRECARGA = []; // la rellena npm run construir
const SIN_CONEXION = 'sin-conexion.html';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) =>
      // Una por una: si un archivo falla, el resto se guarda igual
      Promise.all([SIN_CONEXION, ...PRECARGA].map((url) => cache.add(url).catch(() => {}))),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c.startsWith('cheems-') && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

async function primeroRed(peticion) {
  const cache = await caches.open(CACHE);
  try {
    const respuesta = await fetch(peticion);
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  } catch {
    const guardada = await cache.match(peticion);
    if (guardada) return guardada;
    if (peticion.mode === 'navigate') return (await cache.match(SIN_CONEXION)) ?? Response.error();
    return Response.error();
  }
}

async function guardadaYActualizar(evento) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(evento.request);
  const deRed = fetch(evento.request)
    .then((respuesta) => {
      if (respuesta.ok) cache.put(evento.request, respuesta.clone());
      return respuesta;
    })
    .catch(() => null);
  if (guardada) {
    evento.waitUntil(deRed);
    return guardada;
  }
  return (await deRed) ?? Response.error();
}

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  const url = new URL(request.url);
  // Solo GET del propio sitio; los audios usan peticiones parciales (Range) que no se guardan
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('.json')) {
    evento.respondWith(primeroRed(request));
  } else {
    evento.respondWith(guardadaYActualizar(evento));
  }
});
