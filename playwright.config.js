/**
 * Pruebas automáticas del sitio (Playwright).
 *
 *   npm run pruebas                    → prueba la versión local (carpeta del proyecto)
 *   SITIO_PRUEBAS=_sitio npm run pruebas → prueba la versión publicable (tras npm run construir)
 *
 * La primera vez en tu equipo: npx playwright install chromium
 */
import { defineConfig, devices } from '@playwright/test';

const PUERTO = 4173;
const carpeta = process.env.SITIO_PRUEBAS ?? '.';
// Permite usar un Chromium ya instalado (p. ej. en entornos sin descarga)
const ejecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: 'pruebas',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}/`,
    serviceWorkers: 'block',
    launchOptions: ejecutable ? { executablePath: ejecutable } : {},
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `node herramientas/servidor.mjs ${carpeta}`,
    url: `http://localhost:${PUERTO}/index.html`,
    env: { PUERTO: String(PUERTO) },
    reuseExistingServer: !process.env.CI,
  },
});
