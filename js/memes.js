/**
 * Memes: grilla de 3 columnas con paginación de 12 en 12 y visor a pantalla completa.
 * memes.html?id=meme-XXX abre directamente ese meme en el visor
 * (así funcionan los enlaces de "Imágenes donde aparece").
 */
import { PAGINACION } from './core/config.js';
import { obtenerMemes } from './core/data.js';
import { escaparHTML, rutaMeme, obtenerParametro, mostrarEstado } from './core/utils.js';
import { Paginador } from './components/paginator.js';
import { crearVisor } from './components/lightbox.js';

const grilla = document.getElementById('grilla-memes');
const verMas = document.getElementById('ver-mas');
const visor = crearVisor();
let memesPorId = new Map();

function plantillaMeme(meme) {
  const cantidad = meme.imagenes.length;
  const indicador = cantidad > 1
    ? `<span class="tarjeta-meme__cantidad" aria-label="${cantidad} imágenes">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="7" y="3" width="14" height="14" rx="2"/><path d="M17 21H5a2 2 0 0 1-2-2V7"/></svg>
         ${cantidad}
       </span>`
    : '';

  return `
    <a class="tarjeta-meme" href="memes.html?id=${encodeURIComponent(meme.id)}" data-meme="${escaparHTML(meme.id)}">
      <span class="tarjeta-meme__imagen">
        <img src="${escaparHTML(rutaMeme(meme.imagenes[0]))}" alt="" loading="lazy" decoding="async">
        ${indicador}
      </span>
      <span class="tarjeta-meme__titulo">${escaparHTML(meme.titulo)}</span>
    </a>`;
}

/* ---------- Visor + URL compartible ---------- */

function actualizarURL(id) {
  history.replaceState(null, '', id ? `?id=${encodeURIComponent(id)}` : location.pathname);
}

function abrirMeme(id) {
  const meme = memesPorId.get(id);
  if (!meme || meme.imagenes.length === 0) return false;
  actualizarURL(id);
  visor.abrir({
    titulo: meme.titulo,
    imagenes: meme.imagenes.map(rutaMeme),
    alCerrar: () => actualizarURL(null),
  });
  return true;
}

// Clic en una tarjeta: abre el visor en lugar de navegar
grilla.addEventListener('click', (evento) => {
  const tarjeta = evento.target.closest('[data-meme]');
  if (!tarjeta || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
  if (abrirMeme(tarjeta.dataset.meme)) evento.preventDefault();
});

/* ---------- Inicio ---------- */

async function iniciar() {
  const paginador = new Paginador({
    contenedor: grilla,
    boton: verMas,
    porPagina: PAGINACION.memes,
    renderizar: plantillaMeme,
    vacio: 'Todavía no hay memes publicados.',
  });

  try {
    const memes = await obtenerMemes();
    memesPorId = new Map(memes.map((m) => [m.id, m]));
    paginador.establecer(memes);

    const idInicial = obtenerParametro('id');
    if (idInicial && !abrirMeme(idInicial)) actualizarURL(null);
  } catch (error) {
    console.error(error);
    mostrarEstado(grilla, error.message, 'error');
  }
}

iniciar();
