# Cheemsificaciones Pomkémon

Sitio de fanarts interactivo por **Yeims**. Es un sitio estático (HTML + CSS + JavaScript, sin frameworks ni compilación) cuyo contenido se lee de archivos JSON en `data/`: para publicar un Pomkémon, meme, novedad o recurso nuevo basta con editar un JSON y subir sus imágenes.

---

## 1. Verlo en local

El sitio carga los JSON con `fetch()` y usa módulos de JavaScript, así que **no funciona abriendo el HTML con doble clic** (`file://`). Hay que servirlo con un servidor local:

- **VS Code:** extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Python:** `python -m http.server 8000` en la carpeta del proyecto y abrir <http://localhost:8000>.

## 2. Publicarlo gratis en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub (la raíz del repositorio debe contener `index.html`).
2. En el repositorio: **Settings → Pages**.
3. En *Build and deployment* elige **Source: Deploy from a branch**, la rama (por ejemplo `main`) y la carpeta **`/ (root)`**. Guarda.
4. En uno o dos minutos el sitio estará en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

El archivo `.nojekyll` (vacío) evita que GitHub procese los archivos, y `404.html` se muestra automáticamente cuando una dirección no existe.

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
| Enlaces de Ko-fi, Mercado Pago y PayPal.Me, monto mínimo | `DONACION` (marcadores `TU_USUARIO`) |
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
*.html              páginas del sitio (+ 404.html)
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
```

## 7. Notas

- **Donativos:** el sitio no puede verificar pagos hechos en plataformas externas; la tarjeta conmemorativa se genera cuando la persona pulsa "Ya doné, generar mi tarjeta" (sistema de confianza).
- **Transiciones entre páginas:** al abrir una ficha, la imagen de la tarjeta "vuela" hasta su lugar (View Transitions; en navegadores sin soporte la navegación es normal).
- **Guiño Cheems:** escribe `cheems` en cualquier página, o haz 5 clics rápidos en el logo en la portada. 🔨
- **Favoritos y silencio** se guardan en el navegador de cada visitante (`localStorage`).
- **Accesibilidad:** navegable con teclado, textos alternativos, contraste AA en colores y badges, y respeta la preferencia de "reducir movimiento" del sistema.

## 8. Librerías y licencias

- Tipografía [Fredoka](https://github.com/hafontia/Fredoka-One) — SIL Open Font License (`assets/fonts/LICENSE-fredoka.txt`).
- [html2canvas](https://html2canvas.hertzen.com) 1.4.1 — MIT (`vendor/LICENSE-html2canvas.txt`).
- [canvas-confetti](https://github.com/catdad/canvas-confetti) 1.9.3 — ISC (`vendor/LICENSE-canvas-confetti.txt`).

---

*Cheemsificaciones Pomkémon es un proyecto de fanart no oficial. Pokémon y sus personajes, nombres y marcas pertenecen a sus respectivos propietarios. Este sitio no está afiliado ni respaldado por The Pokémon Company, Nintendo, Game Freak o Creatures Inc.*
