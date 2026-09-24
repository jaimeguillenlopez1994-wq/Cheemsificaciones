/**
 * Vista dedicada de un recurso: recurso.html?id=rec-XXX
 * Previsualización ampliada (se abre en el visor), botón prominente de descarga,
 * lista de archivos y Pomkémon relacionados.
 */
import { SITIO } from './core/config.js';
import { obtenerRecurso, obtenerPomkemon } from './core/data.js';
import { obtenerParametro, escaparHTML, rutaImagen, mostrarEstado } from './core/utils.js';
import { crearMiniPomkemon } from './components/pomkemon-card.js';
import { crearVisor } from './components/lightbox.js';

const contenedor = document.getElementById('recurso');
const FORMATOS_IMAGEN = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'];

const ICONO_DESCARGA = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>
  </svg>`;

const ICONO_LUPA = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6"/>
  </svg>`;

function nombreDescarga(archivo) {
  return String(archivo.url ?? '').split('/').pop() || 'recurso';
}

function detalleArchivo(archivo) {
  return [archivo.formato, archivo.tamano].filter(Boolean).map(escaparHTML).join(' · ');
}

function plantillaArchivo(archivo) {
  return `
    <li class="archivo">
      <span class="archivo__formato">${escaparHTML(archivo.formato ?? '—')}</span>
      <span class="archivo__info">
        <span class="archivo__nombre">${escaparHTML(archivo.nombre ?? nombreDescarga(archivo))}</span>
        <span class="archivo__detalle">${detalleArchivo(archivo)}</span>
      </span>
      <a class="archivo__descargar" href="${escaparHTML(rutaImagen(archivo.url))}" download="${escaparHTML(nombreDescarga(archivo))}"
         aria-label="Descargar ${escaparHTML(archivo.nombre ?? '')}">
        ${ICONO_DESCARGA}<span>Descargar</span>
      </a>
    </li>`;
}

function plantillaBotonPrincipal(archivos) {
  if (archivos.length === 0) {
    return '<p class="estado">Este recurso todavía no tiene archivos para descargar.</p>';
  }
  const principal = archivos[0];
  const detalle = detalleArchivo(principal);
  return `
    <a class="boton-descarga" href="${escaparHTML(rutaImagen(principal.url))}" download="${escaparHTML(nombreDescarga(principal))}">
      ${ICONO_DESCARGA}
      <span class="boton-descarga__texto">
        <strong>Descargar ${archivos.length > 1 ? escaparHTML(principal.nombre ?? '') : 'recurso'}</strong>
        ${detalle ? `<small>${detalle}</small>` : ''}
      </span>
    </a>`;
}

async function plantillaPomkemons(numeros) {
  const pomkemons = (await Promise.all(numeros.map(obtenerPomkemon))).filter(Boolean);
  if (pomkemons.length === 0) return '';
  return `
    <section class="recurso__pomkemons" aria-labelledby="titulo-recurso-pomkemons">
      <h2 class="recurso__subtitulo" id="titulo-recurso-pomkemons">Pomkémon en este recurso</h2>
      <ul class="lista-mini-pomkemon" role="list">
        ${pomkemons.map((p) => `<li>${crearMiniPomkemon(p)}</li>`).join('')}
      </ul>
    </section>`;
}

async function plantillaRecurso(recurso) {
  const archivos = recurso.archivos;
  return `
    <article class="recurso">
      <div class="recurso__vista">
        <button class="recurso__previa" type="button" id="ampliar" aria-label="Ver la previsualización ampliada">
          <img src="${escaparHTML(rutaImagen(recurso.imagenPortada))}" alt="Previsualización de ${escaparHTML(recurso.titulo)}" decoding="async">
          <span class="recurso__ampliar">${ICONO_LUPA} Ampliar</span>
        </button>
      </div>

      <div class="recurso__info">
        ${recurso.categoria ? `<span class="badge-categoria badge-categoria--estatico">${escaparHTML(recurso.categoria)}</span>` : ''}
        <h1 class="recurso__titulo">${escaparHTML(recurso.titulo)}</h1>
        ${recurso.resumen ? `<p class="recurso__resumen">${escaparHTML(recurso.resumen)}</p>` : ''}

        ${plantillaBotonPrincipal(archivos)}

        ${archivos.length > 1 ? `
          <section class="recurso__archivos" aria-labelledby="titulo-archivos">
            <h2 class="recurso__subtitulo" id="titulo-archivos">Archivos incluidos (${archivos.length})</h2>
            <ul class="lista-archivos" role="list">${archivos.map(plantillaArchivo).join('')}</ul>
          </section>` : ''}
      </div>
    </article>

    ${await plantillaPomkemons(recurso.pomkemons)}`;
}

/** El visor muestra la portada y, además, los archivos que sean imágenes. */
function imagenesParaVisor(recurso) {
  const imagenesArchivos = recurso.archivos
    .filter((a) => FORMATOS_IMAGEN.includes(String(a.formato).toUpperCase()))
    .map((a) => rutaImagen(a.url));
  return [...new Set([rutaImagen(recurso.imagenPortada), ...imagenesArchivos])];
}

function mostrarNoEncontrado() {
  document.title = `Recurso no encontrado | ${SITIO.nombre}`;
  contenedor.innerHTML = `
    <div class="recurso recurso--vacio">
      <h1 class="recurso__titulo">Recurso no encontrado</h1>
      <p class="estado">Este recurso no existe o fue retirado.</p>
      <p><a class="boton-ovalado" href="recursos.html">Ver todos los recursos</a></p>
    </div>`;
}

async function iniciar() {
  const id = obtenerParametro('id');
  try {
    const recurso = id ? await obtenerRecurso(id) : null;
    if (!recurso) {
      mostrarNoEncontrado();
      return;
    }
    document.title = `${recurso.titulo} | ${SITIO.nombre}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', recurso.resumen ?? '');
    contenedor.innerHTML = await plantillaRecurso(recurso);

    const visor = crearVisor();
    document.getElementById('ampliar').addEventListener('click', () => {
      visor.abrir({ titulo: recurso.titulo, imagenes: imagenesParaVisor(recurso) });
    });
  } catch (error) {
    console.error(error);
    mostrarEstado(contenedor, error.message, 'error');
  }
}

iniciar();
