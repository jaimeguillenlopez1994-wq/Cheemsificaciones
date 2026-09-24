/**
 * Favoritos guardados en localStorage como arreglo de números ["0001", "0025"].
 * Emite el evento 'favoritos:cambio' en document cada vez que cambian.
 */
import { STORAGE } from './config.js';
import { normalizarNumero } from './utils.js';

let favoritos = leer();

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE.favoritos) ?? '[]');
    return new Set(Array.isArray(guardado) ? guardado.map(normalizarNumero) : []);
  } catch {
    return new Set();
  }
}

function guardar() {
  try {
    localStorage.setItem(STORAGE.favoritos, JSON.stringify([...favoritos]));
  } catch {
    /* Almacenamiento no disponible: los favoritos duran lo que dure la visita. */
  }
}

export function esFavorito(numero) {
  return favoritos.has(normalizarNumero(numero));
}

export function obtenerFavoritos() {
  return new Set(favoritos);
}

/** Marca o desmarca un favorito. Devuelve true si quedó marcado. */
export function alternarFavorito(numero) {
  const n = normalizarNumero(numero);
  const marcado = !favoritos.has(n);
  if (marcado) favoritos.add(n);
  else favoritos.delete(n);
  guardar();
  document.dispatchEvent(new CustomEvent('favoritos:cambio', { detail: { numero: n, marcado } }));
  return marcado;
}

// Sincroniza si los favoritos cambian en otra pestaña
window.addEventListener('storage', (evento) => {
  if (evento.key !== STORAGE.favoritos) return;
  favoritos = leer();
  document.dispatchEvent(new CustomEvent('favoritos:cambio', { detail: { externo: true } }));
});
