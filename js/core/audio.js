/**
 * Sistema de efectos de sonido (hover, click, favorite, donation).
 *
 * - Los audios se crean bajo demanda (el navegador no permite reproducir
 *   nada antes de la primera interacción del usuario).
 * - El estado de silencio se guarda en localStorage.
 * - Delegación global: cualquier <a href>, <button> o elemento con
 *   [data-sfx] suena al pasar el cursor y al hacer clic.
 *     data-sfx-hover="none"      → sin sonido de hover
 *     data-sfx-click="favorite"  → usa otro sonido al hacer clic
 *     data-sfx-click="none"      → sin sonido de clic (la página lo gestiona)
 */
import { RUTAS, SONIDOS, STORAGE } from './config.js';

const SELECTOR_INTERACTIVO = 'a[href], button, [data-sfx]';
const VOLUMEN = { hover: 0.25, click: 0.5, favorite: 0.6, donation: 0.7, bonk: 0.7 };
const PAUSA_HOVER_MS = 80;
const RETRASO_NAVEGACION_MS = 160;

const cache = new Map();
let silenciado = leerSilencio();
let ultimoHover = 0;

function leerSilencio() {
  try {
    return localStorage.getItem(STORAGE.silencio) === '1';
  } catch {
    return false;
  }
}

function obtenerAudio(nombre) {
  if (!cache.has(nombre)) {
    const audio = new Audio(RUTAS.audio + SONIDOS[nombre]);
    audio.preload = 'auto';
    audio.volume = VOLUMEN[nombre] ?? 0.5;
    cache.set(nombre, audio);
  }
  return cache.get(nombre);
}

/** Reproduce un efecto por nombre ('hover' | 'click' | 'favorite' | 'donation'). */
export function reproducir(nombre) {
  if (silenciado || !SONIDOS[nombre]) return;
  const audio = obtenerAudio(nombre);
  audio.currentTime = 0;
  audio.play().catch(() => {
    /* Archivo inexistente o reproducción bloqueada: se ignora en silencio. */
  });
}

export function estaSilenciado() {
  return silenciado;
}

export function alternarSilencio() {
  silenciado = !silenciado;
  try {
    localStorage.setItem(STORAGE.silencio, silenciado ? '1' : '0');
  } catch {
    /* Almacenamiento no disponible (modo privado): se mantiene en memoria. */
  }
  if (silenciado) {
    cache.forEach((audio) => audio.pause());
  }
  document.dispatchEvent(new CustomEvent('audio:cambio', { detail: { silenciado } }));
  return silenciado;
}

/* ---------- Delegación global de hover y click ---------- */

function alPasarCursor(evento) {
  if (evento.pointerType && evento.pointerType !== 'mouse') return;
  const objetivo = evento.target.closest(SELECTOR_INTERACTIVO);
  if (!objetivo || objetivo.dataset.sfxHover === 'none') return;
  // Solo al "entrar" al elemento, no al moverse entre sus hijos
  if (evento.relatedTarget && objetivo.contains(evento.relatedTarget)) return;

  const ahora = performance.now();
  if (ahora - ultimoHover < PAUSA_HOVER_MS) return;
  ultimoHover = ahora;
  reproducir('hover');
}

function esNavegacionInterna(enlace, evento) {
  return (
    enlace.tagName === 'A' &&
    !enlace.hasAttribute('download') &&
    (!enlace.target || enlace.target === '_self') &&
    enlace.origin === location.origin &&
    !enlace.hash &&
    !evento.defaultPrevented &&
    evento.button === 0 &&
    !(evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey)
  );
}

function alHacerClic(evento) {
  const objetivo = evento.target.closest(SELECTOR_INTERACTIVO);
  if (!objetivo) return;

  const sonido = objetivo.dataset.sfxClick || 'click';
  if (sonido === 'none') return;
  reproducir(sonido);

  // Pequeño retraso en enlaces internos para que el clic alcance a oírse
  if (!silenciado && esNavegacionInterna(objetivo, evento)) {
    evento.preventDefault();
    const destino = objetivo.href;
    setTimeout(() => {
      location.href = destino;
    }, RETRASO_NAVEGACION_MS);
  }
}

document.addEventListener('pointerover', alPasarCursor);
document.addEventListener('click', alHacerClic);
