#!/usr/bin/env node
/**
 * Servidor estático mínimo para ver el sitio en local y para las pruebas.
 *
 *   npm run servir           → sirve la carpeta del proyecto
 *   npm run servir:sitio     → sirve _sitio/ (la versión publicable)
 *
 * Puerto: variable PUERTO (por defecto 8000).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(process.argv[2] ?? '.');
const PUERTO = Number(process.env.PUERTO ?? 8000);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function responder(peticion, respuesta) {
  const ruta = decodeURIComponent(new URL(peticion.url, 'http://localhost').pathname);
  let archivo = path.join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ)) {
    respuesta.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(archivo)).isDirectory()) archivo = path.join(archivo, 'index.html');
    const contenido = await readFile(archivo);
    respuesta.writeHead(200, {
      'Content-Type': TIPOS[path.extname(archivo).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    respuesta.end(contenido);
  } catch {
    const pagina404 = await readFile(path.join(RAIZ, '404.html')).catch(() => 'No encontrado');
    respuesta.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(pagina404);
  }
}

createServer(responder).listen(PUERTO, () => {
  console.log(`Sirviendo ${RAIZ} en http://localhost:${PUERTO}  (Ctrl+C para salir)`);
});
