/**
 * Todas las páginas: cargan sin errores, sin desbordamiento, con el menú
 * correcto y sin infracciones de accesibilidad (WCAG 2 AA, axe-core).
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { vigilarErrores, esperarCarga, sinDesbordamiento, url } from './ayudas.js';

const PAGINAS = [
  { ruta: 'index.html', menu: null },
  { ruta: 'pomkedex.html', menu: 'Pomkédex' },
  { ruta: url('pomkemon', '0092'), menu: 'Pomkédex' },
  { ruta: 'memes.html', menu: 'Memes' },
  { ruta: 'novedades.html', menu: 'Novedades' },
  { ruta: url('novedad', 'post-003'), menu: 'Novedades' },
  { ruta: 'recursos.html', menu: 'Recursos' },
  { ruta: url('recurso', 'rec-002'), menu: 'Recursos' },
  { ruta: 'cafe.html', menu: 'Tómate un café' },
  { ruta: '404.html', menu: null },
];

for (const { ruta, menu } of PAGINAS) {
  test(`${ruta}: carga, menú, diseño y accesibilidad`, async ({ page }) => {
    const errores = vigilarErrores(page);
    await page.goto(ruta);
    await esperarCarga(page);

    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('#pie')).toContainText('Búscanos en redes');
    const activo = page.locator('.nav__enlace[aria-current="page"]');
    if (menu) await expect(activo).toHaveText(menu);
    else await expect(activo).toHaveCount(0);

    await sinDesbordamiento(page);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    expect(errores).toEqual([]);
  });
}

test('botón de silencio: se guarda al recargar', async ({ page }) => {
  await page.goto('index.html');
  const boton = page.locator('#boton-audio');
  await expect(boton).toHaveAttribute('aria-pressed', 'false');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#boton-audio')).toHaveAttribute('aria-pressed', 'true');
});

test('ventana "Acerca de..." se abre y se cierra con Esc', async ({ page }) => {
  await page.goto('index.html');
  await page.locator('#abrir-acerca').click();
  await expect(page.locator('#modal-acerca')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-acerca')).toBeHidden();
});

test('si un JSON está roto, la página lo explica en lugar de quedarse en blanco', async ({ page }) => {
  await page.route('**/data/pomkemons.json', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: '[{ "numero": ' }));
  await page.goto('pomkedex.html');
  await expect(page.locator('.estado--error')).toContainText('pomkemons.json tiene un error de formato');
});

test('guiño Cheems: escribir "cheems" muestra el ¡BONK!', async ({ page }) => {
  await page.goto('index.html');
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.type('cheems');
  await expect(page.locator('.aviso-bonk')).toContainText('Bonk');
});
