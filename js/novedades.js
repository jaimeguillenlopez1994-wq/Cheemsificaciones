/**
 * Lista de novedades: filas de 1 en 1, de la más reciente a la más antigua,
 * con paginación de 5 en 5.
 */
import { PAGINACION } from './core/config.js';
import { obtenerNovedades } from './core/data.js';
import { escaparHTML, formatearFecha, rutaImagen, rutaMiniatura, mostrarEstado, enlace } from './core/utils.js';
import { Paginador } from './components/paginator.js';

const lista = document.getElementById('lista-novedades');
const verMas = document.getElementById('ver-mas');

function plantillaFilaNovedad(novedad) {
  return `
    <li>
      <a class="fila-novedad" href="${enlace('novedad', novedad.id)}">
        <span class="fila-novedad__imagen">
          <img src="${escaparHTML(rutaMiniatura(rutaImagen(novedad.imagenPortada)))}" alt="" loading="lazy" decoding="async">
        </span>
        <span class="fila-novedad__contenido">
          <time class="fila-novedad__fecha" datetime="${escaparHTML(novedad.fecha)}">${formatearFecha(novedad.fecha)}</time>
          <span class="fila-novedad__titulo">${escaparHTML(novedad.titulo)}</span>
          <span class="fila-novedad__resumen">${escaparHTML(novedad.resumen)}</span>
          <span class="fila-novedad__leer">Leer publicación →</span>
        </span>
      </a>
    </li>`;
}

async function iniciar() {
  const paginador = new Paginador({
    contenedor: lista,
    boton: verMas,
    porPagina: PAGINACION.novedades,
    renderizar: plantillaFilaNovedad,
    vacio: 'Todavía no hay novedades publicadas.',
  });

  try {
    paginador.establecer(await obtenerNovedades());
  } catch (error) {
    console.error(error);
    mostrarEstado(lista, error.message, 'error');
  }
}

iniciar();
