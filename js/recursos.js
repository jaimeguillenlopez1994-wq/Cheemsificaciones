/**
 * Recursos: grilla de 3 columnas con badge de categoría,
 * paginación de 12 en 12 y enlace a la vista dedicada.
 */
import { PAGINACION } from './core/config.js';
import { obtenerRecursos } from './core/data.js';
import { escaparHTML, rutaImagen, rutaMiniatura, mostrarEstado, enlace } from './core/utils.js';
import { Paginador } from './components/paginator.js';

const grilla = document.getElementById('grilla-recursos');
const verMas = document.getElementById('ver-mas');

/** "PNG", "PNG · PDF"... formatos distintos de los archivos del recurso. */
function resumenFormatos(archivos) {
  return [...new Set(archivos.map((a) => a.formato).filter(Boolean))].join(' · ');
}

function plantillaRecurso(recurso) {
  const cantidad = recurso.archivos.length;
  const formatos = resumenFormatos(recurso.archivos);

  return `
    <a class="tarjeta-recurso" href="${enlace('recurso', recurso.id)}">
      <span class="tarjeta-recurso__imagen">
        <img src="${escaparHTML(rutaMiniatura(rutaImagen(recurso.imagenPortada)))}" alt="" loading="lazy" decoding="async">
        ${recurso.categoria ? `<span class="badge-categoria">${escaparHTML(recurso.categoria)}</span>` : ''}
      </span>
      <span class="tarjeta-recurso__cuerpo">
        <span class="tarjeta-recurso__titulo">${escaparHTML(recurso.titulo)}</span>
        <span class="tarjeta-recurso__resumen">${escaparHTML(recurso.resumen ?? '')}</span>
        <span class="tarjeta-recurso__archivos">
          ${cantidad} ${cantidad === 1 ? 'archivo' : 'archivos'}${formatos ? ` · ${escaparHTML(formatos)}` : ''}
        </span>
      </span>
    </a>`;
}

async function iniciar() {
  const paginador = new Paginador({
    contenedor: grilla,
    boton: verMas,
    porPagina: PAGINACION.recursos,
    renderizar: plantillaRecurso,
    vacio: 'Todavía no hay recursos publicados.',
  });

  try {
    paginador.establecer(await obtenerRecursos());
  } catch (error) {
    console.error(error);
    mostrarEstado(grilla, error.message, 'error');
  }
}

iniciar();
