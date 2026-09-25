/**
 * Utilidades compartidas por las pruebas.
 */
import { expect } from '@playwright/test';

/** Recoge errores de JavaScript de la página (se comprueban al final de cada prueba). */
export function vigilarErrores(pagina) {
  const errores = [];
  pagina.on('pageerror', (error) => errores.push(error.message));
  pagina.on('console', (mensaje) => {
    if (mensaje.type() === 'error' && !/Failed to load resource/.test(mensaje.text())) errores.push(mensaje.text());
  });
  return errores;
}

/** Espera a que desaparezcan los esqueletos de carga. */
export async function esperarCarga(pagina) {
  await expect(pagina.locator('.tarjeta-esqueleto, .ficha--esqueleto')).toHaveCount(0);
}

/**
 * Enlace a un contenido, válido tanto en local (pomkemon.html?id=0001)
 * como en el sitio publicado (pomkemon-0001.html).
 */
export function patronEnlace(tipo, id) {
  const plantillas = { pomkemon: 'pomkemon', novedad: 'post', recurso: 'recurso', meme: 'memes' };
  const fija = tipo === 'pomkemon' ? `pomkemon-${id}` : id;
  return new RegExp(`(${plantillas[tipo]}\\.html\\?id=${id}|${fija}\\.html)$`);
}

/** Dirección de la ficha/post/recurso/meme en el modo que se esté probando. */
export function url(tipo, id) {
  const plantillas = { pomkemon: 'pomkemon.html', novedad: 'post.html', recurso: 'recurso.html', meme: 'memes.html' };
  return `${plantillas[tipo]}?id=${id}`;
}

/** Comprueba que la página no se desplaza hacia los lados. */
export async function sinDesbordamiento(pagina) {
  const sobrante = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobrante, 'la página no debe desplazarse horizontalmente').toBeLessThanOrEqual(0);
}
