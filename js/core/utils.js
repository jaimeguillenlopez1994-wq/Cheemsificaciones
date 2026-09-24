/**
 * Utilidades compartidas: parámetros de URL, seguridad de texto,
 * fechas, búsqueda, azar, rutas de imágenes y estados de la interfaz.
 */
import { RUTAS } from './config.js';

/* ---------- URL ---------- */

/** Devuelve el valor de ?nombre= en la URL actual, o null. */
export function obtenerParametro(nombre) {
  return new URLSearchParams(location.search).get(nombre);
}

/* ---------- Texto ---------- */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto antes de insertarlo en plantillas HTML. */
export function escaparHTML(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/** Minúsculas y sin tildes, para búsquedas tolerantes ("pomkédex" = "pomkedex"). */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Asegura el formato de 4 dígitos: 1 → "0001", "25" → "0025". */
export function normalizarNumero(numero) {
  return String(numero ?? '').trim().padStart(4, '0');
}

/* ---------- Fechas ---------- */

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "2026-09-10" → "10 de septiembre de 2026" (sin desfase por zona horaria). */
export function formatearFecha(iso) {
  const [anio, mes, dia] = String(iso).split('-').map(Number);
  if (!anio || !mes || !dia) return String(iso ?? '');
  return formatoFecha.format(new Date(anio, mes - 1, dia));
}

/* ---------- Azar ---------- */

/** Devuelve n elementos distintos al azar sin modificar el arreglo original. */
export function elegirAlAzar(lista, n) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, n);
}

/* ---------- Tiempo ---------- */

/** Retrasa la ejecución hasta que el usuario deja de escribir. */
export function debounce(fn, espera = 150) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), espera);
  };
}

/* ---------- Rutas de imágenes ---------- */

/** Ruta relativa de un JSON (ej. "novedades/portada.webp") → ruta real. */
export function rutaImagen(relativa) {
  return relativa ? RUTAS.img + relativa : RUTAS.placeholder;
}

export function rutaPomkemon(pomkemon) {
  return pomkemon?.imagen ? RUTAS.pomkemons + pomkemon.imagen : RUTAS.placeholder;
}

export function rutaMeme(archivo) {
  return archivo ? RUTAS.memes + archivo : RUTAS.placeholder;
}

/**
 * Sustituye por la silueta "?" cualquier imagen que no cargue
 * (salvo las marcadas con data-sin-respaldo). Se activa una sola vez.
 */
let respaldoActivo = false;
export function activarImagenesRespaldo() {
  if (respaldoActivo) return;
  respaldoActivo = true;
  document.addEventListener(
    'error',
    (evento) => {
      const img = evento.target;
      if (!(img instanceof HTMLImageElement) || 'sinRespaldo' in img.dataset) return;
      if (img.src.endsWith(RUTAS.placeholder)) return;
      img.src = RUTAS.placeholder;
      img.classList.add('es-respaldo');
    },
    true, // los errores de <img> no burbujean: hay que capturarlos
  );
}

/* ---------- Estados de la interfaz ---------- */

/** Muestra un mensaje de estado (cargando, vacío o error) dentro de un contenedor. */
export function mostrarEstado(contenedor, mensaje, tipo = 'vacio') {
  if (!contenedor) return;
  const rol = tipo === 'error' ? ' role="alert"' : '';
  contenedor.innerHTML = `<p class="estado estado--${tipo}"${rol}>${escaparHTML(mensaje)}</p>`;
}
