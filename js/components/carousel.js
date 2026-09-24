/**
 * Carrusel reutilizable basado en scroll-snap.
 *
 *   contenedor.innerHTML = crearCarrusel(slidesHTML, { etiqueta: 'Novedades' });
 *   activarCarrusel(contenedor.querySelector('.carrusel'), { autoplay: 7000, bucle: true });
 *
 * Cuántas diapositivas se ven a la vez lo decide el CSS (ancho de .carrusel__slide),
 * así el mismo componente sirve para el banner de novedades (1 a la vez)
 * y para "Imágenes donde aparece" (varias a la vez).
 */
import { escaparHTML } from '../core/utils.js';

const FLECHA = (direccion) => `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="${direccion === 'prev' ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}"/>
  </svg>`;

/** HTML del carrusel. slides: arreglo de strings HTML. */
export function crearCarrusel(slides, { etiqueta = 'Carrusel', clase = '', puntos = true } = {}) {
  const total = slides.length;
  const items = slides
    .map(
      (html, i) => `
      <div class="carrusel__slide" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${total}">
        ${html}
      </div>`,
    )
    .join('');

  const listaPuntos = puntos && total > 1
    ? `<div class="carrusel__puntos">${slides
        .map((_, i) => `<button type="button" class="carrusel__punto" data-ir="${i}" aria-label="Ir a la diapositiva ${i + 1}"></button>`)
        .join('')}</div>`
    : '';

  return `
    <div class="carrusel ${clase}" role="region" aria-roledescription="carrusel" aria-label="${escaparHTML(etiqueta)}">
      <div class="carrusel__marco">
        <button type="button" class="carrusel__flecha carrusel__flecha--prev" aria-label="Anterior">${FLECHA('prev')}</button>
        <div class="carrusel__pista" tabindex="0">${items}</div>
        <button type="button" class="carrusel__flecha carrusel__flecha--next" aria-label="Siguiente">${FLECHA('next')}</button>
      </div>
      ${listaPuntos}
    </div>`;
}

/**
 * Activa un carrusel ya insertado en el DOM.
 * opciones.autoplay: milisegundos entre diapositivas (0 = sin autoplay).
 * opciones.bucle: al llegar al final vuelve al principio.
 * Devuelve { ir(indice), detener() }.
 */
export function activarCarrusel(raiz, { autoplay = 0, bucle = false } = {}) {
  const pista = raiz.querySelector('.carrusel__pista');
  const slides = [...raiz.querySelectorAll('.carrusel__slide')];
  const anterior = raiz.querySelector('.carrusel__flecha--prev');
  const siguiente = raiz.querySelector('.carrusel__flecha--next');
  const puntos = [...raiz.querySelectorAll('.carrusel__punto')];
  const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let temporizador = null;
  let pausado = false;

  const indiceActual = () => {
    const izquierda = pista.scrollLeft;
    let mejor = 0;
    slides.forEach((slide, i) => {
      if (Math.abs(slide.offsetLeft - izquierda) < Math.abs(slides[mejor].offsetLeft - izquierda)) mejor = i;
    });
    return mejor;
  };

  const alFinal = () => pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
  const alInicio = () => pista.scrollLeft <= 4;

  function ir(indice) {
    const total = slides.length;
    if (total === 0) return;
    const destino = bucle ? (indice + total) % total : Math.max(0, Math.min(indice, total - 1));
    pista.scrollTo({ left: slides[destino].offsetLeft, behavior: movimientoReducido ? 'auto' : 'smooth' });
  }

  function avanzar(paso) {
    if (paso > 0 && alFinal()) return ir(bucle ? 0 : slides.length - 1);
    if (paso < 0 && alInicio()) return ir(bucle ? slides.length - 1 : 0);
    ir(indiceActual() + paso);
  }

  function actualizarControles() {
    const cabeTodo = pista.scrollWidth <= pista.clientWidth + 4;
    raiz.classList.toggle('carrusel--estatico', cabeTodo);
    if (!bucle) {
      anterior.disabled = alInicio();
      siguiente.disabled = alFinal();
    }
    const actual = indiceActual();
    puntos.forEach((punto, i) => punto.setAttribute('aria-current', String(i === actual)));
  }

  /* Autoplay: se pausa con el cursor encima, con el foco dentro o con la pestaña oculta */
  function programar() {
    clearTimeout(temporizador);
    if (!autoplay || pausado || slides.length < 2 || document.hidden) return;
    temporizador = setTimeout(() => {
      avanzar(1);
      programar();
    }, autoplay);
  }

  function pausar() {
    pausado = true;
    clearTimeout(temporizador);
  }

  function reanudar() {
    pausado = false;
    programar();
  }

  anterior.addEventListener('click', () => { avanzar(-1); programar(); });
  siguiente.addEventListener('click', () => { avanzar(1); programar(); });
  puntos.forEach((punto) =>
    punto.addEventListener('click', () => { ir(Number(punto.dataset.ir)); programar(); }),
  );

  pista.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') { evento.preventDefault(); avanzar(1); }
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); avanzar(-1); }
  });

  let esperaScroll;
  pista.addEventListener('scroll', () => {
    clearTimeout(esperaScroll);
    esperaScroll = setTimeout(actualizarControles, 60);
  }, { passive: true });

  if (autoplay) {
    raiz.addEventListener('mouseenter', pausar);
    raiz.addEventListener('mouseleave', reanudar);
    raiz.addEventListener('focusin', pausar);
    raiz.addEventListener('focusout', (evento) => {
      if (!raiz.contains(evento.relatedTarget)) reanudar();
    });
    document.addEventListener('visibilitychange', programar);
  }

  new ResizeObserver(actualizarControles).observe(pista);
  actualizarControles();
  programar();

  return {
    ir,
    detener: () => { autoplay = 0; clearTimeout(temporizador); },
  };
}
