/**
 * Tarjeta de Pomkémon compartida por la Pomkédex y "Conoce a...".
 *
 *   contenedor.innerHTML = lista.map((p) => crearTarjetaPomkemon(p)).join('');
 *   activarFavoritos(contenedor);
 *
 * Toda la tarjeta enlaza a pomkemon.html?id=XXXX; el botón de favorito
 * queda por encima del enlace y no navega.
 */
import { ESCALAS } from '../core/config.js';
import { escaparHTML, rutaPomkemon } from '../core/utils.js';
import { esFavorito, alternarFavorito } from '../core/favoritos.js';
import { reproducir } from '../core/audio.js';
import { crearListaBadges } from './type-badges.js';
import './efecto-holo.js';

const ICONO_CORAZON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.6-9.4C1 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.2.4.8.4 1 0 .7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.7 3.8 4.3 7.1C19.5 16.4 12 21 12 21z"/>
  </svg>`;

export function enlacePomkemon(numero) {
  return `pomkemon.html?id=${encodeURIComponent(numero)}`;
}

/** Nombre de la transición animada entre páginas (único por Pomkémon). */
export function nombreTransicion(numero) {
  return `pomkemon-${String(numero).replace(/[^\w-]/g, '')}`;
}

/**
 * Figura con el fanart escalado según "tamano" (reutilizada en la ficha).
 * opciones.transicion: la imagen "vuela" hasta la ficha al navegar. Solo debe
 * activarse una vez por Pomkémon en cada página (el nombre ha de ser único).
 */
export function crearMarcoImagen(pomkemon, { perezosa = true, clase = '', transicion = false } = {}) {
  const escala = ESCALAS[pomkemon.tamano] ?? 1;
  const nombre = transicion ? `; view-transition-name: ${nombreTransicion(pomkemon.numero)}` : '';
  return `
    <div class="marco-imagen ${clase}" style="--escala: ${escala}${nombre}">
      <img src="${rutaPomkemon(pomkemon)}" alt="Fanart de ${escaparHTML(pomkemon.nombre)}"
           width="1080" height="1080" ${perezosa ? 'loading="lazy"' : ''} decoding="async">
    </div>`;
}

export function crearBotonFavorito(numero, nombre) {
  const marcado = esFavorito(numero);
  return `
    <button class="boton-favorito" type="button" data-favorito="${escaparHTML(numero)}"
            data-sfx-click="none" aria-pressed="${marcado}"
            aria-label="${marcado ? 'Quitar' : 'Marcar'} a ${escaparHTML(nombre)} como favorito">
      ${ICONO_CORAZON}
    </button>`;
}

/**
 * HTML de una tarjeta.
 * opciones.favorito: muestra el botón de favorito (true por defecto).
 */
export function crearTarjetaPomkemon(pomkemon, { favorito = true } = {}) {
  const numero = escaparHTML(pomkemon.numero);
  const nombre = escaparHTML(pomkemon.nombre);

  return `
    <article class="tarjeta-pomkemon" data-numero="${numero}">
      <h3 class="tarjeta-pomkemon__titulo">
        <a class="tarjeta-pomkemon__enlace" href="${enlacePomkemon(pomkemon.numero)}" title="#${numero} – ${nombre}">
          #${numero} – ${nombre}
        </a>
      </h3>
      <div class="tarjeta-pomkemon__imagen">
        ${crearMarcoImagen(pomkemon, { transicion: true })}
        ${favorito ? crearBotonFavorito(pomkemon.numero, pomkemon.nombre) : ''}
      </div>
      ${crearListaBadges(pomkemon.tipos)}
    </article>`;
}

/** Tarjeta compacta (miniatura + número + nombre) para posts y recursos. */
export function crearMiniPomkemon(pomkemon) {
  return `
    <a class="mini-pomkemon" href="${enlacePomkemon(pomkemon.numero)}">
      ${crearMarcoImagen(pomkemon, { clase: 'mini-pomkemon__imagen' })}
      <span class="mini-pomkemon__numero">#${escaparHTML(pomkemon.numero)}</span>
      <span class="mini-pomkemon__nombre">${escaparHTML(pomkemon.nombre)}</span>
    </a>`;
}

/** Sincroniza el estado visual de todos los botones de favorito de un número. */
function sincronizarBotones(numero, marcado) {
  document.querySelectorAll(`[data-favorito="${CSS.escape(numero)}"]`).forEach((boton) => {
    boton.setAttribute('aria-pressed', String(marcado));
    boton.setAttribute('aria-label', boton.getAttribute('aria-label').replace(/^(Quitar|Marcar)/, marcado ? 'Quitar' : 'Marcar'));
  });
}

/**
 * Activa los botones de favorito dentro de un contenedor (delegación:
 * funciona también con tarjetas añadidas después por "Ver más").
 */
export function activarFavoritos(contenedor) {
  if (!contenedor || contenedor.dataset.favoritosActivos) return;
  contenedor.dataset.favoritosActivos = 'true';

  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-favorito]');
    if (!boton) return;
    evento.preventDefault();

    const marcado = alternarFavorito(boton.dataset.favorito);
    reproducir('favorite');
    sincronizarBotones(boton.dataset.favorito, marcado);

    boton.classList.remove('animar');
    void boton.offsetWidth; // reinicia la animación
    boton.classList.add('animar');
  });
}
