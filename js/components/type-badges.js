/**
 * Badges de tipo.
 *
 * Por defecto se dibuja una "píldora" de color con el nombre del tipo.
 * Si USAR_SVG_TIPOS está activo en config.js, se intenta cargar
 * assets/img/tipos/<id>.svg y, al cargar, reemplaza visualmente a la píldora.
 * Si el SVG no existe, se queda la píldora (nunca un hueco vacío).
 */
import { TIPOS, RUTAS, USAR_SVG_TIPOS } from '../core/config.js';
import { escaparHTML } from '../core/utils.js';

const TIPO_DESCONOCIDO = { nombre: '???', color: '#888888' };

export function datosTipo(id) {
  return TIPOS[id] ?? { ...TIPO_DESCONOCIDO, nombre: id };
}

/** HTML de un badge. tamano: 'normal' | 'grande'. */
export function crearBadgeTipo(id, tamano = 'normal') {
  const tipo = datosTipo(id);
  const nombre = escaparHTML(tipo.nombre);
  const imagen = USAR_SVG_TIPOS
    ? `<img class="badge-tipo__img" src="${RUTAS.tipos}${escaparHTML(id)}.svg" alt="" data-sin-respaldo>`
    : '';

  return `
    <span class="badge-tipo badge-tipo--${tamano}" style="--color-tipo: ${tipo.color}">
      ${imagen}<span class="badge-tipo__texto">${nombre}</span>
    </span>`;
}

/** HTML de la lista de badges de un Pomkémon. */
export function crearListaBadges(tipos = [], tamano = 'normal') {
  const items = tipos.map((id) => `<li>${crearBadgeTipo(id, tamano)}</li>`).join('');
  return `<ul class="lista-badges" role="list" aria-label="Tipos">${items}</ul>`;
}

/* El SVG sustituye a la píldora solo cuando realmente carga */
if (USAR_SVG_TIPOS) {
  document.addEventListener(
    'load',
    (evento) => {
      if (evento.target.classList?.contains('badge-tipo__img')) {
        evento.target.parentElement.classList.add('badge-tipo--svg');
      }
    },
    true,
  );
  document.addEventListener(
    'error',
    (evento) => {
      if (evento.target.classList?.contains('badge-tipo__img')) evento.target.remove();
    },
    true,
  );
}
