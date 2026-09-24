/**
 * Ficha individual: pomkemon.html?id=XXXX
 * Encabezado, fanart, descripción, habilidad, navegación anterior/siguiente,
 * línea evolutiva y carrusel "Imágenes donde aparece".
 */
import { SITIO, TEXTOS, STORAGE } from './core/config.js';
import {
  obtenerPomkemon,
  obtenerVecinos,
  obtenerEvoluciones,
  obtenerHabilidad,
  obtenerApariciones,
} from './core/data.js';
import { obtenerParametro, escaparHTML, normalizarNumero, rutaPomkemon, mostrarEstado } from './core/utils.js';
import { crearListaBadges } from './components/type-badges.js';
import { crearMarcoImagen, crearBotonFavorito, activarFavoritos, enlacePomkemon } from './components/pomkemon-card.js';
import { crearCarrusel, activarCarrusel } from './components/carousel.js';

const el = {
  ficha: document.getElementById('ficha'),
  secuencia: document.getElementById('secuencia'),
  volver: document.getElementById('volver'),
};

const ETIQUETAS_APARICION = { meme: 'Meme', novedad: 'Novedad', recurso: 'Recurso' };

/* ---------- Plantillas ---------- */

function plantillaSecuencia({ anterior, siguiente }) {
  const boton = (p, direccion) => {
    if (!p) return `<span class="boton-secuencia boton-secuencia--vacio" aria-hidden="true"></span>`;
    const texto = direccion === 'anterior'
      ? `<span aria-hidden="true">←</span> <span class="boton-secuencia__texto">#${escaparHTML(p.numero)} ${escaparHTML(p.nombre)}</span>`
      : `<span class="boton-secuencia__texto">#${escaparHTML(p.numero)} ${escaparHTML(p.nombre)}</span> <span aria-hidden="true">→</span>`;
    const etiqueta = direccion === 'anterior' ? 'Pomkémon anterior' : 'Siguiente Pomkémon';
    return `
      <a class="boton-secuencia boton-secuencia--${direccion}" href="${enlacePomkemon(p.numero)}"
         aria-label="${etiqueta}: #${escaparHTML(p.numero)} ${escaparHTML(p.nombre)}" rel="${direccion === 'anterior' ? 'prev' : 'next'}">
        ${texto}
      </a>`;
  };
  return boton(anterior, 'anterior') + boton(siguiente, 'siguiente');
}

function plantillaHabilidad(habilidad, idHabilidad) {
  if (!habilidad) {
    return `<p class="ficha__texto ficha__texto--suave">Habilidad por definir${idHabilidad ? ` (${escaparHTML(idHabilidad)})` : ''}.</p>`;
  }
  return `
    <div class="tarjeta-habilidad">
      <h3 class="tarjeta-habilidad__nombre">${escaparHTML(habilidad.nombre)}</h3>
      <p class="tarjeta-habilidad__descripcion">${escaparHTML(habilidad.descripcion)}</p>
    </div>`;
}

function plantillaEvoluciones(pomkemon, cadena) {
  if (cadena.length < 2) {
    return `<p class="estado">Este Pomkémon no tiene una línea evolutiva registrada.</p>`;
  }

  const pasos = cadena
    .map((p) => {
      const actual = p.numero === pomkemon.numero;
      const contenido = `
        ${crearMarcoImagen(p, { clase: 'evolucion__imagen' })}
        <span class="evolucion__numero">#${escaparHTML(p.numero)}</span>
        <span class="evolucion__nombre">${escaparHTML(p.nombre)}</span>`;
      return actual
        ? `<li class="evolucion evolucion--actual"><div class="evolucion__tarjeta" aria-current="page">${contenido}</div></li>`
        : `<li class="evolucion"><a class="evolucion__tarjeta" href="${enlacePomkemon(p.numero)}">${contenido}</a></li>`;
    })
    .join('<li class="evolucion__flecha" aria-hidden="true">→</li>');

  return `<ol class="linea-evolutiva" role="list">${pasos}</ol>`;
}

function plantillaAparicion(aparicion) {
  return `
    <a class="aparicion" href="${aparicion.enlace}">
      <span class="aparicion__imagen">
        <img src="${escaparHTML(aparicion.imagen)}" alt="" loading="lazy" decoding="async">
        <span class="aparicion__tipo aparicion__tipo--${aparicion.tipo}">${ETIQUETAS_APARICION[aparicion.tipo]}</span>
      </span>
      <span class="aparicion__titulo">${escaparHTML(aparicion.titulo)}</span>
    </a>`;
}

function plantillaFicha(pomkemon, habilidad) {
  const numero = escaparHTML(pomkemon.numero);
  const nombre = escaparHTML(pomkemon.nombre);

  return `
    <article class="ficha" aria-labelledby="ficha-titulo">
      <header class="ficha__encabezado">
        <h1 class="ficha__titulo" id="ficha-titulo">
          <span class="ficha__numero">#${numero}</span> ${nombre}
        </h1>
        ${crearListaBadges(pomkemon.tipos, 'grande')}
      </header>

      <div class="ficha__cuerpo">
        <div class="ficha__imagen">
          ${crearMarcoImagen(pomkemon, { perezosa: false })}
          ${crearBotonFavorito(pomkemon.numero, pomkemon.nombre)}
        </div>

        <div class="ficha__info">
          <section class="ficha__seccion">
            <h2 class="ficha__subtitulo">Descripción</h2>
            <p class="ficha__texto">${escaparHTML(pomkemon.descripcion ?? '')}</p>
          </section>
          <section class="ficha__seccion">
            <h2 class="ficha__subtitulo">Habilidad</h2>
            ${plantillaHabilidad(habilidad, pomkemon.habilidad)}
          </section>
        </div>
      </div>
    </article>

    <section class="bloque-ficha" aria-labelledby="titulo-evoluciones">
      <h2 class="bloque-ficha__titulo" id="titulo-evoluciones">Línea evolutiva</h2>
      <div id="evoluciones"><p class="estado estado--cargando">Cargando...</p></div>
    </section>

    <section class="bloque-ficha" aria-labelledby="titulo-apariciones">
      <h2 class="bloque-ficha__titulo" id="titulo-apariciones">Imágenes donde aparece</h2>
      <div id="apariciones"><p class="estado estado--cargando">Cargando...</p></div>
    </section>`;
}

/* ---------- Secciones asíncronas ---------- */

async function renderizarEvoluciones(pomkemon) {
  const contenedor = document.getElementById('evoluciones');
  contenedor.innerHTML = plantillaEvoluciones(pomkemon, await obtenerEvoluciones(pomkemon));
}

async function renderizarApariciones(pomkemon) {
  const contenedor = document.getElementById('apariciones');
  try {
    const apariciones = await obtenerApariciones(pomkemon.numero);
    if (apariciones.length === 0) {
      contenedor.innerHTML = `<p class="estado estado--sin-apariciones">${escaparHTML(TEXTOS.sinApariciones)}</p>`;
      return;
    }
    contenedor.innerHTML = crearCarrusel(apariciones.map(plantillaAparicion), {
      etiqueta: `Imágenes donde aparece ${pomkemon.nombre}`,
      clase: 'carrusel--apariciones',
      puntos: false,
    });
    activarCarrusel(contenedor.querySelector('.carrusel'));
  } catch (error) {
    console.error(error);
    mostrarEstado(contenedor, 'No se pudieron cargar las apariciones.', 'error');
  }
}

/* ---------- Inicio ---------- */

/** Restaura la búsqueda o el filtro que tenía la Pomkédex antes de entrar a las fichas. */
function ajustarEnlaceVolver() {
  try {
    const busqueda = sessionStorage.getItem(STORAGE.ultimaBusqueda);
    if (busqueda) el.volver.href = `pomkedex.html?${busqueda}`;
  } catch {
    /* Sin almacenamiento: se mantiene pomkedex.html */
  }
}

function mostrarNoEncontrado(id) {
  document.title = `Pomkémon no encontrado | ${SITIO.nombre}`;
  el.ficha.innerHTML = `
    <div class="ficha ficha--vacia">
      <h1 class="ficha__titulo">Pomkémon no encontrado</h1>
      <p class="estado">${id ? `No existe ningún Pomkémon con el número #${escaparHTML(normalizarNumero(id))}.` : 'No se indicó ningún Pomkémon.'}</p>
      <p><a class="boton-ovalado" href="pomkedex.html">Ir a la Pomkédex</a></p>
    </div>`;
}

async function iniciar() {
  ajustarEnlaceVolver();
  const id = obtenerParametro('id');

  try {
    const pomkemon = id ? await obtenerPomkemon(id) : null;
    if (!pomkemon) {
      mostrarNoEncontrado(id);
      return;
    }

    document.title = `#${pomkemon.numero} ${pomkemon.nombre} | ${SITIO.nombre}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', pomkemon.descripcion ?? '');

    const [habilidad, vecinos] = await Promise.all([
      obtenerHabilidad(pomkemon.habilidad),
      obtenerVecinos(pomkemon.numero),
    ]);

    el.secuencia.innerHTML = plantillaSecuencia(vecinos);
    el.ficha.innerHTML = plantillaFicha(pomkemon, habilidad);
    activarFavoritos(el.ficha);

    // Precarga la imagen siguiente para que el salto se sienta instantáneo
    if (vecinos.siguiente) new Image().src = rutaPomkemon(vecinos.siguiente);

    await Promise.all([renderizarEvoluciones(pomkemon), renderizarApariciones(pomkemon)]);
  } catch (error) {
    console.error(error);
    mostrarEstado(el.ficha, error.message, 'error');
  }
}

iniciar();
