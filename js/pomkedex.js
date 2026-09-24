/**
 * Pomkédex: búsqueda en tiempo real, filtro "Mis Favoritos",
 * contador dinámico y paginación de 12 en 12.
 * La búsqueda y el filtro se reflejan en la URL (?q=...&favoritos=1)
 * para conservarlos al volver desde una ficha.
 */
import { PAGINACION } from './core/config.js';
import { obtenerPomkemons } from './core/data.js';
import { normalizarTexto, debounce, mostrarEstado } from './core/utils.js';
import { obtenerFavoritos } from './core/favoritos.js';
import { crearTarjetaPomkemon, activarFavoritos } from './components/pomkemon-card.js';
import { Paginador } from './components/paginator.js';

const el = {
  formulario: document.getElementById('buscador'),
  busqueda: document.getElementById('busqueda'),
  contador: document.getElementById('contador'),
  filtro: document.getElementById('filtro-favoritos'),
  cantidadFavoritos: document.getElementById('cantidad-favoritos'),
  grilla: document.getElementById('grilla'),
  verMas: document.getElementById('ver-mas'),
};

const estado = {
  todos: [],
  consulta: '',
  soloFavoritos: false,
};

/* ---------- Filtrado ---------- */

/** "#25", "25", "0025" → coincide con el número; cualquier otro texto → con el nombre. */
function coincide(pomkemon, consulta) {
  if (!consulta) return true;
  const numeroBuscado = consulta.replace(/^#/, '');
  if (/^\d+$/.test(numeroBuscado)) {
    return (
      pomkemon.numero.includes(numeroBuscado) ||
      String(Number(pomkemon.numero)).startsWith(String(Number(numeroBuscado)))
    );
  }
  return normalizarTexto(pomkemon.nombre).includes(consulta);
}

function filtrar() {
  const consulta = normalizarTexto(estado.consulta);
  const favoritos = obtenerFavoritos();
  return estado.todos.filter(
    (p) => coincide(p, consulta) && (!estado.soloFavoritos || favoritos.has(p.numero)),
  );
}

function mensajeVacio() {
  if (estado.soloFavoritos && obtenerFavoritos().size === 0) {
    return 'Aún no tienes favoritos. Toca el corazón de cualquier Pomkémon para guardarlo aquí.';
  }
  if (estado.consulta && estado.soloFavoritos) {
    return `Ninguno de tus favoritos coincide con «${estado.consulta}».`;
  }
  return `Ningún Pomkémon coincide con «${estado.consulta}».`;
}

/* ---------- Interfaz ---------- */

function actualizarContador({ visibles, total }) {
  const totalCatalogo = estado.todos.length;
  const filtrando = estado.consulta || estado.soloFavoritos;
  let texto = `Mostrando <strong>${visibles}</strong> de <strong>${total}</strong> Pomkémon`;
  if (filtrando && total !== totalCatalogo) {
    texto += ` <span>(de ${totalCatalogo} en total)</span>`;
  }
  el.contador.innerHTML = texto;
}

function actualizarBotonFiltro() {
  el.filtro.setAttribute('aria-pressed', String(estado.soloFavoritos));
  el.cantidadFavoritos.textContent = obtenerFavoritos().size;
}

function guardarEnURL() {
  const parametros = new URLSearchParams();
  if (estado.consulta) parametros.set('q', estado.consulta);
  if (estado.soloFavoritos) parametros.set('favoritos', '1');
  const query = parametros.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

const paginador = new Paginador({
  contenedor: el.grilla,
  boton: el.verMas,
  porPagina: PAGINACION.pomkedex,
  renderizar: (p) => crearTarjetaPomkemon(p),
  alActualizar: actualizarContador,
});

function aplicarFiltros() {
  paginador.establecer(filtrar(), { vacio: mensajeVacio() });
  actualizarBotonFiltro();
  guardarEnURL();
}

/* ---------- Eventos ---------- */

function registrarEventos() {
  const buscarConRetraso = debounce(() => {
    estado.consulta = el.busqueda.value.trim();
    aplicarFiltros();
  }, 150);

  el.busqueda.addEventListener('input', buscarConRetraso);

  el.busqueda.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && el.busqueda.value) {
      el.busqueda.value = '';
      estado.consulta = '';
      aplicarFiltros();
    }
  });

  el.formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    estado.consulta = el.busqueda.value.trim();
    aplicarFiltros();
    el.busqueda.focus();
  });

  el.filtro.addEventListener('click', () => {
    estado.soloFavoritos = !estado.soloFavoritos;
    aplicarFiltros();
  });

  // Al desmarcar un favorito con el filtro activo, la tarjeta desaparece
  document.addEventListener('favoritos:cambio', () => {
    if (estado.soloFavoritos) aplicarFiltros();
    else actualizarBotonFiltro();
  });
}

/* ---------- Inicio ---------- */

async function iniciar() {
  const parametros = new URLSearchParams(location.search);
  estado.consulta = parametros.get('q')?.trim() ?? '';
  estado.soloFavoritos = parametros.get('favoritos') === '1';
  el.busqueda.value = estado.consulta;

  activarFavoritos(el.grilla);
  registrarEventos();

  try {
    estado.todos = await obtenerPomkemons();
    aplicarFiltros();
  } catch (error) {
    console.error(error);
    mostrarEstado(el.grilla, error.message, 'error');
    el.contador.textContent = '';
  }
}

iniciar();
