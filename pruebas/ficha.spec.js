/** Ficha individual de un Pomkémon. */
import { test, expect } from '@playwright/test';
import { esperarCarga, patronEnlace, url } from './ayudas.js';

async function abrir(page, numero) {
  await page.goto(url('pomkemon', numero));
  await esperarCarga(page);
}

test('anterior y siguiente se saltan los números que faltan', async ({ page }) => {
  await abrir(page, '0005');
  await expect(page.locator('#ficha-titulo')).toContainText('#0005 Chamrmeleon');
  await expect(page.locator('.boton-secuencia--anterior')).toHaveAttribute('href', patronEnlace('pomkemon', '0004'));
  await expect(page.locator('.boton-secuencia--siguiente')).toHaveAttribute('href', patronEnlace('pomkemon', '0007'));
});

test('línea evolutiva omite los que aún no existen', async ({ page }) => {
  await abrir(page, '0004');
  await expect(page.locator('.evolucion__nombre')).toHaveText(['Chamrmander', 'Chamrmeleon']);
});

test('"Imágenes donde aparece" y su mensaje exacto cuando no aparece', async ({ page }) => {
  await abrir(page, '0092');
  await expect(page.locator('.aparicion')).toHaveCount(4);
  await abrir(page, '0002');
  await expect(page.locator('#apariciones')).toHaveText('Este Pomkémon no aparece en ningún catálogo');
});

test('borde con el color del tipo principal', async ({ page }) => {
  await abrir(page, '0092');
  await expect(page.locator('.ficha')).toHaveCSS('border-top-color', 'rgb(106, 79, 146)');
});

test('botón de café abre la página con el Pomkémon elegido', async ({ page }) => {
  await abrir(page, '0152');
  await page.locator('.ficha__cafe .boton-ovalado').click();
  await expect(page.locator('#pomkemon')).toHaveValue('0152');
});

test('número inexistente muestra "no encontrado"', async ({ page }) => {
  await page.goto(url('pomkemon', '0006'));
  await expect(page.locator('main h1')).toHaveText('Pomkémon no encontrado');
});
