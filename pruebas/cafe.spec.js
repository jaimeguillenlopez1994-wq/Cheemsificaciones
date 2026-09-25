/** Tómate un café: formulario, tarjeta y PNG. */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('cafe.html');
  await expect(page.locator('#pomkemon option')).toHaveCount(19);
});

test('valida los campos obligatorios', async ({ page }) => {
  await page.locator('#generar').click();
  await expect(page.locator('#error-pomkemon')).toBeVisible();
  await expect(page.locator('#error-remitente')).toBeVisible();
  await page.locator('input[value="regalo"]').check({ force: true });
  await page.locator('#generar').click();
  await expect(page.locator('#error-destinatario')).toBeVisible();
});

test('respeta los límites de 25 y 140 caracteres', async ({ page }) => {
  await page.locator('#remitente').fill('x'.repeat(40));
  await expect(page.locator('#remitente')).toHaveValue('x'.repeat(25));
  await page.locator('#mensaje').fill('y'.repeat(200));
  await expect(page.locator('#contador-mensaje')).toHaveText('140/140');
});

test('genera la tarjeta en PNG de 1080×1080 con el texto y el fondo elegidos', async ({ page }) => {
  await page.locator('#pomkemon').selectOption('0152');
  await page.locator('#remitente').fill('Fernando');
  await page.locator('#mensaje').fill('¡Saludos!');
  await page.locator('.fondo').nth(2).click();
  await expect(page.locator('#tarjeta-texto')).toHaveText(
    'Fernando, te has tomado un café con Chimkorita, ahora se encuentra muy feliz y sus nivéles deamsiedad han bajado muchísimo!',
  );
  await page.locator('#generar').click();
  await expect(page.locator('#modal-resultado')).toBeVisible({ timeout: 15000 });

  const [ancho, alto, pixel] = await page.locator('#resultado-imagen').evaluate(async (img) => {
    await img.decode();
    const lienzo = Object.assign(document.createElement('canvas'), { width: img.naturalWidth, height: img.naturalHeight });
    const ctx = lienzo.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return [img.naturalWidth, img.naturalHeight, [...ctx.getImageData(40, 540, 1, 1).data].slice(0, 3)];
  });
  expect([ancho, alto]).toEqual([1080, 1080]);
  expect(pixel).toEqual([253, 230, 234]); // fondo "Rosa"
  await expect(page.locator('#resultado-descargar')).toHaveAttribute('download', 'cafe-con-chimkorita.png');
});
