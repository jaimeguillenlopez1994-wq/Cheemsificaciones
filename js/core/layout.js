/**
 * Layout global: inserta el header (logo, navegación, botón de audio),
 * el footer (redes, "Acerca de...", disclaimer) y la ventana emergente
 * "Acerca de..." en cualquier página que contenga:
 *
 *   <body data-pagina="pomkedex">
 *     <header id="encabezado"></header> ... <footer id="pie"></footer>
 *
 * Se ejecuta solo al importarse; cada HTML solo necesita cargar este módulo.
 */
import { SITIO, NAV, REDES, TEXTOS } from './config.js';
import { estaSilenciado, alternarSilencio } from './audio.js';
import { activarImagenesRespaldo } from './utils.js';

const ICONOS = {
  sonido: `
    <svg class="icono-sonido" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/>
      <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
      <path d="M18.5 5.5a9 9 0 0 1 0 13"/>
    </svg>`,
  silencio: `
    <svg class="icono-silencio" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor"/>
      <path d="m16 9 6 6"/>
      <path d="m22 9-6 6"/>
    </svg>`,
  facebook: `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v8h4v-8H17l.5-4h-4V8.8c0-.5.3-.8.5-.8z"/>
    </svg>`,
  instagram: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5"/>
      <circle cx="12" cy="12" r="4.2"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/>
    </svg>`,
  tiktok: `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 2h-3.4v13.3a2.9 2.9 0 1 1-2.1-2.8V9a6.4 6.4 0 1 0 5.5 6.3V8.6a8 8 0 0 0 4.4 1.4V6.6a4.5 4.5 0 0 1-4.4-4.6z"/>
    </svg>`,
};

/* ---------- Header ---------- */

function plantillaLogo() {
  if (SITIO.logo) {
    return `
      <a class="logo logo--imagen" href="index.html" aria-label="${SITIO.nombre}, ir al inicio">
        <img src="${SITIO.logo}" alt="${SITIO.nombre} por ${SITIO.autor}">
      </a>`;
  }
  return `
    <a class="logo" href="index.html" aria-label="${SITIO.nombre}, ir al inicio">
      <span class="logo__titulo">${SITIO.nombre}</span>
      <span class="logo__autor">Por ${SITIO.autor}</span>
    </a>`;
}

function plantillaNav(paginaActual) {
  const items = NAV.map((item) => {
    const activo = item.paginas.includes(paginaActual) ? ' aria-current="page"' : '';
    return `
      <li class="nav__item">
        <a class="nav__enlace" href="${item.href}"${activo}>${item.texto}</a>
      </li>`;
  }).join('');

  return `
    <nav class="nav" aria-label="Navegación principal">
      <ul class="nav__lista">${items}</ul>
    </nav>`;
}

function plantillaEncabezado(paginaActual) {
  return `
    <div class="encabezado__barra">
      ${plantillaLogo()}
      <button class="boton-audio" type="button" id="boton-audio" data-sfx-click="none"
              aria-pressed="false" aria-label="Silenciar efectos de sonido">
        ${ICONOS.sonido}
        ${ICONOS.silencio}
      </button>
    </div>
    ${plantillaNav(paginaActual)}`;
}

/* ---------- Footer ---------- */

function plantillaPie() {
  const redes = REDES.map((red) => `
    <li>
      <a class="redes__enlace" href="${red.url}" target="_blank" rel="noopener noreferrer"
         aria-label="${red.nombre} (se abre en una pestaña nueva)">
        ${ICONOS[red.id] ?? ''}
      </a>
    </li>`).join('');

  return `
    <h2 class="pie__titulo">Búscanos en redes</h2>
    <ul class="redes">${redes}</ul>
    <button class="pie__acerca" type="button" id="abrir-acerca" aria-haspopup="dialog">Acerca de...</button>
    <p class="pie__disclaimer">${TEXTOS.disclaimer}</p>
    <p class="pie__copy">© ${SITIO.anio} ${SITIO.nombre} · Fanarts por ${SITIO.autor}</p>`;
}

function plantillaModalAcerca() {
  return `
    <dialog class="modal" id="modal-acerca" aria-labelledby="modal-acerca-titulo">
      <div class="modal__contenido">
        <h2 class="modal__titulo" id="modal-acerca-titulo">Acerca de...</h2>
        <p class="modal__texto">${TEXTOS.acercaDe}</p>
        <p class="modal__texto">${TEXTOS.disclaimer}</p>
        <button class="modal__cerrar" type="button" data-cerrar-modal aria-label="Cerrar">×</button>
      </div>
    </dialog>`;
}

/* ---------- Comportamiento ---------- */

function sincronizarBotonAudio(boton, silenciado) {
  boton.setAttribute('aria-pressed', String(silenciado));
  boton.setAttribute(
    'aria-label',
    silenciado ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido',
  );
  boton.title = silenciado ? 'Sonido desactivado' : 'Sonido activado';
}

function activarBotonAudio() {
  const boton = document.getElementById('boton-audio');
  if (!boton) return;
  sincronizarBotonAudio(boton, estaSilenciado());
  boton.addEventListener('click', () => {
    sincronizarBotonAudio(boton, alternarSilencio());
  });
}

function activarModalAcerca() {
  const modal = document.getElementById('modal-acerca');
  const abrir = document.getElementById('abrir-acerca');
  if (!modal || !abrir) return;

  abrir.addEventListener('click', () => modal.showModal());

  modal.addEventListener('click', (evento) => {
    // Cierra con el botón × o al hacer clic en el fondo oscuro (fuera del contenido)
    if (evento.target.closest('[data-cerrar-modal]') || evento.target === modal) {
      modal.close();
    }
  });
}

function iniciarLayout() {
  const pagina = document.body.dataset.pagina ?? '';
  const encabezado = document.getElementById('encabezado');
  const pie = document.getElementById('pie');

  activarImagenesRespaldo();

  if (encabezado) {
    encabezado.classList.add('encabezado');
    encabezado.innerHTML = plantillaEncabezado(pagina);
    activarBotonAudio();
  }

  if (pie) {
    pie.classList.add('pie');
    pie.innerHTML = plantillaPie();
    pie.insertAdjacentHTML('afterend', plantillaModalAcerca());
    activarModalAcerca();
  }
}

iniciarLayout();
