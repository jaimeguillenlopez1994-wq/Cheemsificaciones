/**
 * Vista de lectura de una novedad: post.html?id=post-XXX
 * Renderiza en vertical los bloques de "contenido" (párrafos e imágenes)
 * y al final los Pomkémon que aparecen en la publicación.
 */
import { SITIO } from './core/config.js';
import { obtenerNovedad, obtenerPomkemon } from './core/data.js';
import { obtenerParametro, escaparHTML, formatearFecha, rutaImagen, mostrarEstado } from './core/utils.js';
import { crearMiniPomkemon } from './components/pomkemon-card.js';

const contenedor = document.getElementById('post');

/* Cada tipo de bloque del JSON sabe cómo dibujarse */
const BLOQUES = {
  parrafo: (b) => `<p>${escaparHTML(b.texto)}</p>`,
  subtitulo: (b) => `<h2>${escaparHTML(b.texto)}</h2>`,
  imagen: (b) => `
    <figure class="post__figura">
      <img src="${escaparHTML(rutaImagen(b.url))}" alt="${escaparHTML(b.pie ?? '')}" loading="lazy" decoding="async">
      ${b.pie ? `<figcaption>${escaparHTML(b.pie)}</figcaption>` : ''}
    </figure>`,
};

function renderizarBloque(bloque) {
  const renderizar = BLOQUES[bloque?.tipo];
  if (!renderizar) {
    console.warn('[post] Bloque de contenido desconocido:', bloque);
    return '';
  }
  return renderizar(bloque);
}

async function plantillaPomkemons(numeros) {
  const pomkemons = (await Promise.all(numeros.map(obtenerPomkemon))).filter(Boolean);
  if (pomkemons.length === 0) return '';
  return `
    <section class="post__pomkemons" aria-labelledby="titulo-post-pomkemons">
      <h2 class="post__subtitulo" id="titulo-post-pomkemons">Pomkémon en esta publicación</h2>
      <ul class="lista-mini-pomkemon" role="list">
        ${pomkemons.map((p) => `<li>${crearMiniPomkemon(p)}</li>`).join('')}
      </ul>
    </section>`;
}

async function plantillaPost(novedad) {
  return `
    <article class="post">
      <header class="post__encabezado">
        <time class="post__fecha" datetime="${escaparHTML(novedad.fecha)}">${formatearFecha(novedad.fecha)}</time>
        <h1 class="post__titulo">${escaparHTML(novedad.titulo)}</h1>
        ${novedad.resumen ? `<p class="post__resumen">${escaparHTML(novedad.resumen)}</p>` : ''}
      </header>

      ${novedad.imagenPortada ? `
        <div class="post__portada">
          <img src="${escaparHTML(rutaImagen(novedad.imagenPortada))}" alt="" decoding="async">
        </div>` : ''}

      <div class="post__cuerpo">
        ${novedad.contenido.map(renderizarBloque).join('')}
      </div>

      ${await plantillaPomkemons(novedad.pomkemons)}

      <footer class="post__pie">
        <a class="boton-ovalado boton-ovalado--secundario" href="novedades.html">← Volver a Novedades</a>
      </footer>
    </article>`;
}

function mostrarNoEncontrada() {
  document.title = `Publicación no encontrada | ${SITIO.nombre}`;
  contenedor.innerHTML = `
    <div class="post post--vacio">
      <h1 class="post__titulo">Publicación no encontrada</h1>
      <p class="estado">Esta publicación no existe o fue retirada.</p>
      <p><a class="boton-ovalado" href="novedades.html">Ver todas las novedades</a></p>
    </div>`;
}

async function iniciar() {
  const id = obtenerParametro('id');
  try {
    const novedad = id ? await obtenerNovedad(id) : null;
    if (!novedad) {
      mostrarNoEncontrada();
      return;
    }
    document.title = `${novedad.titulo} | ${SITIO.nombre}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', novedad.resumen ?? '');
    contenedor.innerHTML = await plantillaPost(novedad);
  } catch (error) {
    console.error(error);
    mostrarEstado(contenedor, error.message, 'error');
  }
}

iniciar();
