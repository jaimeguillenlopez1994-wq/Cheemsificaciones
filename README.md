# Cheemsificaciones Pomkémon

Sitio de fanarts interactivo por **Yeims**. Sitio estático (HTML + CSS + JavaScript) cuyo contenido se lee de los archivos JSON en `data/`.

## Cómo verlo en local

El sitio carga los JSON con `fetch()` y usa módulos de JavaScript, así que **no funciona abriendo el HTML con doble clic** (`file://`). Hay que servirlo con un servidor local:

- **VS Code:** extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Python:** `python -m http.server 8000` en la carpeta del proyecto y abrir <http://localhost:8000>.

## Estructura

```
*.html              páginas del sitio
css/                base, layout, componentes y estilos por página
js/core/            configuración, carga de datos, audio, layout, utilidades
js/components/      piezas reutilizables (tarjeta, badges, paginador, carrusel, visor)
js/*.js             lógica de cada página
data/               contenido (pomkemons, habilidades, memes, novedades, recursos)
assets/img/         imágenes (las rutas de los JSON son relativas a esta carpeta)
assets/audio/       efectos de sonido
vendor/             librerías externas (html2canvas, canvas-confetti)
```

## Cómo añadir contenido

| Contenido | JSON | Imágenes |
|---|---|---|
| Pomkémon | `data/pomkemons.json` | `assets/img/pomkemons/<numero>.webp` (1080×1080, fondo transparente) |
| Habilidad | `data/habilidades.json` | — |
| Meme | `data/memes.json` | `assets/img/memes/` |
| Novedad | `data/novedades.json` | `assets/img/novedades/` |
| Recurso | `data/recursos.json` | `assets/img/recursos/` |

Los badges de tipo van en `assets/img/tipos/<id>.svg` (ej. `plamta.svg`). Los enlaces de redes y donaciones se editan en `js/core/config.js`.
