/** Memes, novedades y recursos. */
import { test, expect } from '@playwright/test';
import { esperarCarga, url } from './ayudas.js';

test('visor de memes: flechas, contador, descarga y Esc', async ({ page }) => {
  await page.goto('memes.html');
  await esperarCarga(page);
  await page.locator('[data-meme="meme-003"]').click();
  const visor = page.locator('.visor');
  await expect(visor).toBeVisible();
  await expect(page.locator('.visor__contador')).toHaveText('1 / 3');
  await page.locator('.visor__flecha--next').click();
  await expect(page.locator('.visor__contador')).toHaveText('2 / 3');
  await expect(page.locator('.visor__boton--descargar')).toHaveAttribute('download', 'meme003_2.webp');
  await page.keyboard.press('Escape');
  await expect(visor).toBeHidden();
});

test('enlace directo a un meme abre el visor', async ({ page }) => {
  await page.goto(url('meme', 'meme-001'));
  await expect(page.locator('.visor')).toBeVisible();
  await expect(page.locator('.visor__contador')).toHaveText('1 / 2');
});

test('novedades: de la más reciente a la más antigua, de 5 en 5', async ({ page }) => {
  await page.goto('novedades.html');
  await esperarCarga(page);
  await expect(page.locator('.fila-novedad')).toHaveCount(5);
  const fechas = await page.locator('.fila-novedad time').evaluateAll((t) => t.map((x) => x.getAttribute('datetime')));
  expect(fechas).toEqual([...fechas].sort().reverse());
  await page.locator('#ver-mas').click();
  await expect(page.locator('.fila-novedad')).toHaveCount(6);
});

test('post: bloques en orden y Pomkémon relacionados', async ({ page }) => {
  await page.goto(url('novedad', 'post-003'));
  await expect(page.locator('.post__cuerpo > *')).toHaveCount(3);
  await expect(page.locator('.post__figura figcaption')).toHaveText('Bocetos de Chamrmander y Squimrtle');
  await expect(page.locator('.mini-pomkemon')).toHaveCount(5);
});

test('recurso: botón de descarga y lista de archivos', async ({ page }) => {
  await page.goto(url('recurso', 'rec-002'));
  await expect(page.locator('.boton-descarga')).toHaveAttribute('download', 'fondo-iniciales-movil.png');
  await expect(page.locator('.archivo')).toHaveCount(2);
});
