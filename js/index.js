/**
 * Página principal: carrusel con las novedades más recientes
 * y "Conoce a..." con Pomkémon elegidos al azar en cada carga.
 */
import { INICIO } from './core/config.js';
import { obtenerNovedades, obtenerPomkemons } from './core/data.js';
import { escaparHTML, formatearFecha, rutaImagen, elegirAlAzar, mostrarEstado } from './core/utils.js';
import { crearCarrusel, activarCarrusel } from './components/carousel.js';
import { crearTarjetaPomkemon, activarFavoritos } from './components/pomkemon-card.js';

const el = {
  novedades: document.getElementById('carrusel-novedades'),
  conoce: document.getElementById('conoce-a'),
  otros: document.getElementById('otros-pomkemon'),
};

/* ---------- Carrusel de novedades ---------- */

function plantillaBanner(novedad) {
  return `
    <a class="banner-novedad" href="post.html?id=${encodeURIComponent(novedad.id)}">
      <img class="banner-novedad__imagen" src="${escaparHTML(rutaImagen(novedad.imagenPortada))}" alt="" decoding="async">
      <span class="banner-novedad__contenido">
        <time class="banner-novedad__fecha" datetime="${escaparHTML(novedad.fecha)}">${formatearFecha(novedad.fecha)}</time>
        <span class="banner-novedad__titulo">${escaparHTML(novedad.titulo)}</span>
        <span class="banner-novedad__resumen">${escaparHTML(novedad.resumen)}</span>
        <span class="banner-novedad__leer">Leer publicación →</span>
      </span>
    </a>`;
}

async function renderizarNovedades() {
  try {
    const recientes = (await obtenerNovedades()).slice(0, INICIO.novedadesCarrusel);
    if (recientes.length === 0) {
      mostrarEstado(el.novedades, 'Todavía no hay novedades publicadas.');
      return;
    }
    el.novedades.innerHTML = crearCarrusel(recientes.map(plantillaBanner), {
      etiqueta: 'Novedades más recientes',
      clase: 'carrusel--novedades',
    });
    activarCarrusel(el.novedades.querySelector('.carrusel'), {
      autoplay: INICIO.intervaloCarruselMs,
      bucle: true,
    });
  } catch (error) {
    console.error(error);
    mostrarEstado(el.novedades, error.message, 'error');
  }
}

/* ---------- Conoce a... ---------- */

let pomkemons = [];

function mostrarAlAzar() {
  const elegidos = elegirAlAzar(pomkemons, INICIO.pomkemonsAlAzar);
  el.conoce.innerHTML = elegidos.map((p) => crearTarjetaPomkemon(p)).join('');
}

async function renderizarConoceA() {
  try {
    pomkemons = await obtenerPomkemons();
    if (pomkemons.length === 0) {
      mostrarEstado(el.conoce, 'Todavía no hay Pomkémon en la Pomkédex.');
      return;
    }
    activarFavoritos(el.conoce);
    mostrarAlAzar();
    // Solo tiene sentido barajar si hay más Pomkémon de los que se muestran
    el.otros.hidden = pomkemons.length <= INICIO.pomkemonsAlAzar;
    el.otros.addEventListener('click', mostrarAlAzar);
  } catch (error) {
    console.error(error);
    mostrarEstado(el.conoce, error.message, 'error');
  }
}

renderizarNovedades();
renderizarConoceA();
