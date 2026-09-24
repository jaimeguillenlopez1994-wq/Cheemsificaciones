/**
 * Visor a pantalla completa (lightbox) basado en <dialog>.
 *
 *   const visor = crearVisor();
 *   visor.abrir({ titulo, imagenes: ['ruta1.webp', 'ruta2.webp'], indice: 0, alCerrar });
 *
 * - Flechas ← / → (botones, teclado y deslizamiento en móvil) si hay varias imágenes.
 * - Botón Descargar (descarga la imagen visible) y botón Cerrar (también Esc).
 */
const ICONOS = {
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  descargar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
};

const UMBRAL_DESLIZAR = 50;

function nombreArchivo(ruta) {
  return decodeURIComponent(String(ruta).split('/').pop().split('?')[0]) || 'imagen';
}

export function crearVisor() {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<dialog class="visor" aria-labelledby="visor-titulo">
       <div class="visor__barra">
         <div class="visor__info">
           <h2 class="visor__titulo" id="visor-titulo"></h2>
           <span class="visor__contador" aria-live="polite"></span>
         </div>
         <div class="visor__acciones">
           <a class="visor__boton visor__boton--descargar" href="#" download>
             ${ICONOS.descargar}<span>Descargar</span>
           </a>
           <button class="visor__boton visor__boton--cerrar" type="button" aria-label="Cerrar visor" autofocus>
             ${ICONOS.cerrar}<span>Cerrar</span>
           </button>
         </div>
       </div>
       <div class="visor__escenario">
         <button class="visor__flecha visor__flecha--prev" type="button" aria-label="Imagen anterior">${ICONOS.prev}</button>
         <img class="visor__imagen" alt="">
         <button class="visor__flecha visor__flecha--next" type="button" aria-label="Imagen siguiente">${ICONOS.next}</button>
       </div>
       <div class="visor__puntos" aria-hidden="true"></div>
     </dialog>`,
  );

  const dialogo = document.body.lastElementChild;
  const el = {
    titulo: dialogo.querySelector('.visor__titulo'),
    contador: dialogo.querySelector('.visor__contador'),
    descargar: dialogo.querySelector('.visor__boton--descargar'),
    cerrar: dialogo.querySelector('.visor__boton--cerrar'),
    escenario: dialogo.querySelector('.visor__escenario'),
    imagen: dialogo.querySelector('.visor__imagen'),
    prev: dialogo.querySelector('.visor__flecha--prev'),
    next: dialogo.querySelector('.visor__flecha--next'),
    puntos: dialogo.querySelector('.visor__puntos'),
  };

  const estado = { titulo: '', imagenes: [], indice: 0, alCerrar: null };

  function mostrar(indice) {
    const total = estado.imagenes.length;
    estado.indice = (indice + total) % total;
    const ruta = estado.imagenes[estado.indice];

    el.imagen.classList.remove('es-respaldo');
    el.imagen.src = ruta;
    el.imagen.alt = total > 1
      ? `${estado.titulo} (imagen ${estado.indice + 1} de ${total})`
      : estado.titulo;

    el.descargar.href = ruta;
    el.descargar.download = nombreArchivo(ruta);
    el.contador.textContent = total > 1 ? `${estado.indice + 1} / ${total}` : '';

    el.puntos.querySelectorAll('span').forEach((punto, i) => {
      punto.classList.toggle('activo', i === estado.indice);
    });

    // Precarga la siguiente para que el cambio sea inmediato
    if (total > 1) new Image().src = estado.imagenes[(estado.indice + 1) % total];
  }

  function abrir({ titulo = '', imagenes = [], indice = 0, alCerrar = null }) {
    if (imagenes.length === 0) return;
    Object.assign(estado, { titulo, imagenes, alCerrar });

    const varias = imagenes.length > 1;
    el.titulo.textContent = titulo;
    el.prev.hidden = !varias;
    el.next.hidden = !varias;
    el.puntos.innerHTML = varias ? imagenes.map(() => '<span></span>').join('') : '';

    mostrar(indice);
    if (!dialogo.open) dialogo.showModal();
  }

  function cerrar() {
    if (dialogo.open) dialogo.close();
  }

  /* ---------- Eventos ---------- */
  el.cerrar.addEventListener('click', cerrar);
  el.prev.addEventListener('click', () => mostrar(estado.indice - 1));
  el.next.addEventListener('click', () => mostrar(estado.indice + 1));

  dialogo.addEventListener('close', () => {
    el.imagen.removeAttribute('src');
    estado.alCerrar?.();
  });

  // Clic en el fondo oscuro (fuera de la imagen y de los controles) cierra
  el.escenario.addEventListener('click', (evento) => {
    if (evento.target === el.escenario) cerrar();
  });

  dialogo.addEventListener('keydown', (evento) => {
    if (estado.imagenes.length < 2) return;
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); mostrar(estado.indice - 1); }
    if (evento.key === 'ArrowRight') { evento.preventDefault(); mostrar(estado.indice + 1); }
  });

  // Deslizar con el dedo en móvil
  let inicioX = null;
  el.escenario.addEventListener('pointerdown', (evento) => {
    if (evento.pointerType !== 'mouse') inicioX = evento.clientX;
  });
  el.escenario.addEventListener('pointerup', (evento) => {
    if (inicioX === null || estado.imagenes.length < 2) return;
    const distancia = evento.clientX - inicioX;
    inicioX = null;
    if (Math.abs(distancia) > UMBRAL_DESLIZAR) mostrar(estado.indice + (distancia < 0 ? 1 : -1));
  });

  return { abrir, cerrar, get abierto() { return dialogo.open; } };
}
