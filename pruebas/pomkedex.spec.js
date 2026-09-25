/** Pomkédex y página principal. */
import { test, expect } from '@playwright/test';
import { esperarCarga, patronEnlace } from './ayudas.js';

test.beforeEach(async ({ page }) => {
  await page.goto('pomkedex.html');
  await esperarCarga(page);
});

test('muestra 12 de 18 y "Ver más" carga el resto', async ({ page }) => {
  await expect(page.locator('#contador')).toHaveText('Mostrando 12 de 18 Pomkémon');
  await expect(page.locator('.tarjeta-pomkemon')).toHaveCount(12);
  await page.locator('#ver-mas').click();
  await expect(page.locator('.tarjeta-pomkemon')).toHaveCount(18);
  await expect(page.locator('#ver-mas')).toBeHidden();
});

test('no deja hueco para los números que faltan (0006)', async ({ page }) => {
  const numeros = await page.locator('.tarjeta-pomkemon').evaluateAll((t) => t.map((x) => x.dataset.numero));
  expect(numeros.slice(0, 6)).toEqual(['0001', '0002', '0003', '0004', '0005', '0007']);
});

test('búsqueda por nombre (sin tildes ni mayúsculas) y por número', async ({ page }) => {
  await page.locator('#busqueda').fill('CHÁM');
  await expect(page.locator('.tarjeta-pomkemon__enlace')).toHaveText([/Chamrmander/, /Chamrmeleon/]);
  await page.locator('#busqueda').fill('#25');
  await expect(page.locator('.tarjeta-pomkemon__enlace')).toHaveText([/Pimkachu/]);
  await page.locator('#busqueda').fill('zzz');
  await expect(page.locator('.grilla')).toContainText('Ningún Pomkémon coincide');
});

test('favoritos: se guardan, se filtran y sobreviven a la recarga', async ({ page }) => {
  await page.locator('[data-numero="0001"] .boton-favorito').click();
  await page.locator('[data-numero="0025"] .boton-favorito').click();
  await expect(page.locator('#cantidad-favoritos')).toHaveText('2');
  await page.locator('#filtro-favoritos').click();
  await expect(page.locator('.tarjeta-pomkemon')).toHaveCount(2);
  await page.reload();
  await esperarCarga(page);
  await expect(page.locator('#filtro-favoritos')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.tarjeta-pomkemon')).toHaveCount(2);
});

test('la tarjeta lleva a la ficha', async ({ page }) => {
  await page.locator('[data-numero="0003"] .tarjeta-pomkemon__enlace').click();
  await expect(page).toHaveURL(patronEnlace('pomkemon', '0003'));
});

test('portada: 3 novedades recientes y 3 Pomkémon distintos', async ({ page }) => {
  await page.goto('index.html');
  await esperarCarga(page);
  await expect(page.locator('.banner-novedad')).toHaveCount(3);
  await expect(page.locator('.banner-novedad').first()).toHaveAttribute('href', patronEnlace('novedad', 'post-006'));
  const numeros = await page.locator('#conoce-a .tarjeta-pomkemon').evaluateAll((t) => t.map((x) => x.dataset.numero));
  expect(new Set(numeros).size).toBe(3);
});
