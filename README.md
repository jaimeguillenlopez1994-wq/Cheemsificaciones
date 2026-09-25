# Cheemsificaciones Pomkémon

Sitio de fanarts interactivo por **Yeims**. Es un sitio estático (HTML + CSS + JavaScript, sin frameworks ni compilación) cuyo contenido se lee de archivos JSON en `data/`: para publicar un Pomkémon, meme, novedad o recurso nuevo basta con editar un JSON y subir sus imágenes.

---

## 1. Verlo en local

El sitio carga los JSON con `fetch()` y usa módulos de JavaScript, así que **no funciona abriendo el HTML con doble clic** (`file://`). Hay que servirlo con un servidor local:

- **VS Code:** extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Python:** `python -m http.server 8000` en la carpeta del proyecto y abrir <http://localhost:8000>.
- **Node:** `npm run servir` y abrir <http://localhost:8000>.

## 2. Publicarlo gratis en GitHub Pages

La publicación es automática con GitHub Actions (`.github/workflows/publicar.yml`). **Configuración, una sola vez:**

1. En el repositorio: **Settings → Pages**.
2. En *Build and deployment* elige **Source: GitHub Actions**.
3. A partir de ahí, cada vez que subas cambios a la rama **`main`**, GitHub:
   1. **valida** los JSON (si hay un error, no publica y te dice qué línea revisar);
   2. **construye** la versión optimizada (miniaturas, vistas previas para redes, sitemap);
   3. **ejecuta las pruebas** automáticas en escritorio y móvil;
   4. **publica** en `https://<tu-usuario>.github.io/<nombre-del-repo>/` solo si todo pasó.

El progreso se ve en la pestaña **Actions** del repositorio. En cualquier otra rama (o en un pull request) se hacen los pasos 1 a 3 sin publicar, para revisar cambios con calma.

> Si usas un dominio propio, cambia `SITIO.url` en `js/core/config.js` para que las vistas previas en redes apunten a él.

---

## 3. Archivos que debes subir

Mientras falte cualquiera de estos archivos el sitio sigue funcionando: las imágenes que no existen se sustituyen por una silueta con "?", la taza por una provisional y los sonidos simplemente no suenan.

| Archivo | Dónde | Notas |
|---|---|---|
| Fanarts de Pomkémon | `assets/img/pomkemons/<numero>.webp` | 1080×1080 px, fondo transparente. Ej.: `0001.webp` |
| Badges de tipo (18) | `assets/img/tipos/<id>.svg` | Ej.: `plamta.svg`. Después pon `USAR_SVG_TIPOS = true` en `config.js` |
| Memes | `assets/img/memes/` | Nombres tal como aparecen en `memes.json` |
| Portadas e imágenes de novedades | `assets/img/novedades/` | Rutas de `novedades.json` |
| Portadas y archivos de recursos | `assets/img/recursos/` | Rutas de `recursos.json` (PNG, PDF…) |
| Taza de la tarjeta | `assets/img/cafe/cafe.png` | PNG con fondo transparente |
| Fondo de la tarjeta | `assets/img/cafe/tarjeta-fondo.png` | Cuadrado (ideal 1080×1080) |
| Textura del fondo del sitio | `assets/img/ui/fondo-patron.webp` | Opcional: se repite en mosaico |
| Marcos laterales | `assets/img/ui/marco-lateral.webp` | Opcional: franja vertical de 36 px de ancho |
| Logo definitivo | `assets/img/ui/logo.webp` | Después pon su ruta en `SITIO.logo` de `config.js` |
| Sonidos | `assets/audio/` | `hover.mp3`, `click.mp3`, `favorite.mp3`, `donation.mp3` y, opcional, `bonk.mp3` (guiño Cheems) |

**Importante:** en rutas y nombres de archivo usa minúsculas, sin espacios ni tildes (GitHub Pages distingue mayúsculas de minúsculas).

---

## 4. Añadir contenido

Todas las rutas de imágenes de los JSON son **relativas a `assets/img/`** (excepto `imagen` de los Pomkémon, que es relativa a `assets/img/pomkemons/`, y las imágenes de memes, relativas a `assets/img/memes/`).

### Pomkémon — `data/pomkemons.json`

```json
{
  "numero": "0001",
  "nombre": "Bulmbasaur",
  "descripcion": "A este Pomkémon le gustan las bayas y tomar el sol.",
  "imagen": "0001.webp",
  "tipos": ["plamta", "vemneno"],
  "habilidad": "espesura",
  "tamano": "L",
  "evoluciones": ["0001", "0002", "0003"]
}
```

- `tipos`: 1 o 2 de: amcero, amgua, bicho, dramgon, elemctrico, famtasma, fuemgo, hamda, hiemlo, lumcha, normalm, plamta, psimquico, romca, simniestro, tiemrra, vemneno, vomlador.
- `habilidad`: el `id` de una habilidad de `data/habilidades.json`.
- `tamano`: `S` (70 %), `L` (85 %) o `X` (100 %) — escala visual del fanart dentro de su recuadro.
- `evoluciones`: opcional. Los números que aún no existan se omiten solos.
- El orden del archivo no importa: el sitio los ordena por número. Si falta un número, no queda hueco.

### Habilidad — `data/habilidades.json`

```json
{ "id": "espesura", "nombre": "Espesura", "descripcion": "Aumenta el poder de..." }
```

### Meme — `data/memes.json`

```json
{ "id": "meme-004", "titulo": "Título", "imagenes": ["meme004_1.webp", "meme004_2.webp"], "pomkemons": ["0025"] }
```

### Novedad — `data/novedades.json`

```json
{
  "id": "post-007",
  "titulo": "Título",
  "fecha": "2026-10-01",
  "resumen": "Texto corto para la lista y el carrusel.",
  "imagenPortada": "novedades/portada.webp",
  "pomkemons": ["0001"],
  "contenido": [
    { "tipo": "parrafo", "texto": "Un párrafo." },
    { "tipo": "subtitulo", "texto": "Un subtítulo" },
    { "tipo": "imagen", "url": "novedades/imagen.webp", "pie": "Pie de foto (opcional)" }
  ]
}
```

La fecha va en formato `AAAA-MM-DD`; el sitio ordena de la más reciente a la más antigua y la página principal muestra las 3 últimas.

### Recurso — `data/recursos.json`

```json
{
  "id": "rec-004",
  "titulo": "Título",
  "categoria": "Plantillas",
  "resumen": "Descripción corta.",
  "imagenPortada": "recursos/portada.webp",
  "pomkemons": ["0092"],
  "archivos": [
    { "nombre": "Hoja A4", "url": "recursos/archivo.png", "formato": "PNG", "tamano": "2.4 MB" }
  ]
}
```

El campo `pomkemons` de memes, novedades y recursos alimenta la sección **"Imágenes donde aparece"** de cada ficha.

> **Consejo:** antes de subir, valida el JSON en <https://jsonlint.com>. Si un JSON tiene un error de formato, la página correspondiente lo indica con un mensaje en lugar de quedarse en blanco.

---

## 5. Configuración — `js/core/config.js`

| Qué | Dónde |
|---|---|
| Enlaces de Facebook, Instagram y TikTok | `REDES` (ahora tienen marcadores `TU_USUARIO`) |
| Enlaces de Ko-fi, Mercado Pago y PayPal.Me (donativo opcional) | `DONACION` (marcadores `TU_USUARIO`) |
| Logo de imagen en lugar del de texto | `SITIO.logo` |
| Usar los SVG de tipo en lugar de las píldoras de color | `USAR_SVG_TIPOS` |
| Nombre y color de cada tipo | `TIPOS` |
| Escala de los tamaños S / L / X | `ESCALAS` |
| Cantidad por página (12 / 5) y tiempo del carrusel (7 s) | `PAGINACION`, `INICIO` |
| Texto de "Acerca de...", disclaimer y mensajes fijos | `TEXTOS` |
| Fondos de la tarjeta del café (colores y/o imágenes) | `DONACION.fondos` |

### Direcciones útiles

- `pomkemon.html?id=0025` — ficha de un Pomkémon.
- `pomkedex.html?q=saur` / `pomkedex.html?favoritos=1` — Pomkédex con búsqueda o filtro.
- `memes.html?id=meme-003` — abre ese meme directamente en el visor.
- `post.html?id=post-001`, `recurso.html?id=rec-001` — publicación o recurso.
- `cafe.html?pomkemon=0152` — página del café con ese Pomkémon ya elegido.

---

## 6. Estructura

```
*.html              páginas del sitio (+ 404.html y sin-conexion.html)
manifest.webmanifest, sw.js   sitio instalable y sin conexión
css/base.css        variables de color, reset y tipografía
css/layout.css      fondo, marcos, header, menú, footer y ventana "Acerca de..."
css/components.css  piezas reutilizables (tarjetas, badges, botones, carrusel, visor)
css/pages/          estilos propios de cada página
js/core/            configuración, carga de datos, audio, favoritos, layout y utilidades
js/components/      tarjeta de Pomkémon, badges, paginador, carrusel y visor
js/*.js             lógica de cada página
data/               contenido en JSON
assets/img/         imágenes (ver tabla de la sección 3)
assets/audio/       efectos de sonido
vendor/             librerías externas incluidas en el proyecto
herramientas/       validador, construcción y servidor local (solo desarrollo)
pruebas/            pruebas automáticas (Playwright)
.github/workflows/  validación, pruebas y publicación automáticas
```

## 7. Herramientas de desarrollo (opcionales)

Todo lo siguiente lo hace GitHub automáticamente al publicar; solo necesitas instalarlo si quieres ejecutarlo en tu equipo. Requiere [Node.js](https://nodejs.org) 20 o superior; la primera vez ejecuta `npm install`.

| Comando | Qué hace |
|---|---|
| `npm run validar` | Revisa los JSON: formato, números e ids duplicados, tipos, habilidades, fechas, bloques, referencias entre catálogos y archivos que faltan. |
| `npm run construir` | Genera la versión publicable en `_sitio/` (ver abajo). |
| `npm run servir` / `npm run servir:sitio` | Sirve el proyecto o `_sitio/` en <http://localhost:8000>. |
| `npm run pruebas` | Pruebas automáticas (Playwright) en escritorio y móvil: navegación, Pomkédex, fichas, memes, novedades, recursos, café, diseño adaptable y accesibilidad. La primera vez: `npx playwright install chromium`. Para probar la versión publicable: `SITIO_PRUEBAS=_sitio npm run pruebas`. |
| `npm run verificar` | Las tres cosas seguidas: validar, construir y probar. |

**Qué añade la versión publicable** (`npm run construir`), sin cambiar nada en local:

- **Miniaturas** de ~600 px en subcarpetas `min/`: las tarjetas descargan la mitad o menos de peso.
- **Vista previa al compartir en redes:** una página fija por Pomkémon (`pomkemon-0001.html`), novedad (`post-001.html`), recurso (`rec-001.html`) y meme (`meme-001.html`) con su imagen de 1200×630, título y descripción. Los enlaces del sitio publicado apuntan a estas páginas.
- **`sitemap.xml` y `robots.txt`** para buscadores.
- **Instalable como app y disponible sin conexión** (`manifest.webmanifest` + `sw.js`): las páginas visitadas siguen funcionando sin internet.

Por eso los `id` de memes, novedades y recursos deben empezar por `meme-`, `post-` y `rec-` y usar solo minúsculas, números y guiones (el validador lo comprueba).

## 8. Notas

- **Tómate un café:** crear la tarjeta conmemorativa es gratis para todos; el donativo (Ko-fi, Mercado Pago o PayPal) es opcional y solo se invita. El pie fijo de la tarjeta se edita en `TEXTOS.pieTarjeta`.
- **Transiciones entre páginas:** al abrir una ficha, la imagen de la tarjeta "vuela" hasta su lugar (View Transitions; en navegadores sin soporte la navegación es normal).
- **Guiño Cheems:** escribe `cheems` en cualquier página, o haz 5 clics rápidos en el logo en la portada. 🔨
- **Favoritos y silencio** se guardan en el navegador de cada visitante (`localStorage`).
- **Accesibilidad:** navegable con teclado, textos alternativos, contraste AA en colores y badges, y respeta la preferencia de "reducir movimiento" del sistema.

## 9. Librerías y licencias

- Tipografía [Fredoka](https://github.com/hafontia/Fredoka-One) — SIL Open Font License (`assets/fonts/LICENSE-fredoka.txt`).
- [html2canvas](https://html2canvas.hertzen.com) 1.4.1 — MIT (`vendor/LICENSE-html2canvas.txt`).
- [canvas-confetti](https://github.com/catdad/canvas-confetti) 1.9.3 — ISC (`vendor/LICENSE-canvas-confetti.txt`).

---

*Cheemsificaciones Pomkémon es un proyecto de fanart no oficial. Pokémon y sus personajes, nombres y marcas pertenecen a sus respectivos propietarios. Este sitio no está afiliado ni respaldado por The Pokémon Company, Nintendo, Game Freak o Creatures Inc.*
