/**
 * Capa de datos: carga los JSON de /data una sola vez (con caché),
 * los normaliza y ofrece consultas para todas las páginas.
 *
 * Todas las funciones son asíncronas:
 *   const pomkemon = await obtenerPomkemon('0001');
 */
import { RUTAS, ARCHIVOS_DATOS } from './config.js';
import { normalizarNumero, rutaImagen, rutaMeme, rutaMiniatura, enlace } from './utils.js';

const cacheJSON = new Map();

/* ---------- Carga ---------- */

async function descargar(archivo) {
  if (location.protocol === 'file:') {
    throw new Error(
      'El sitio se abrió directamente desde el disco. Ábrelo con un servidor local (por ejemplo, Live Server).',
    );
  }
  const respuesta = await fetch(RUTAS.datos + archivo);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${archivo} (error ${respuesta.status}).`);
  }
  try {
    return await respuesta.json();
  } catch {
    throw new Error(`El archivo ${archivo} tiene un error de formato JSON.`);
  }
}

/** Carga un catálogo por clave ('pomkemons', 'memes', ...). Cada archivo se pide una sola vez. */
function cargar(clave) {
  if (!cacheJSON.has(clave)) {
    const promesa = descargar(ARCHIVOS_DATOS[clave]).then((datos) => {
      if (!Array.isArray(datos)) throw new Error(`${ARCHIVOS_DATOS[clave]} debe contener un arreglo.`);
      return datos;
    });
    // Si falla, se borra de la caché para permitir reintentar
    promesa.catch(() => cacheJSON.delete(clave));
    cacheJSON.set(clave, promesa);
  }
  return cacheJSON.get(clave);
}

/** Memoriza el resultado de una función asíncrona sin argumentos. */
function memorizar(fn) {
  let promesa = null;
  return () => {
    promesa ??= fn().catch((error) => {
      promesa = null;
      throw error;
    });
    return promesa;
  };
}

/* ---------- Pomkémon ---------- */

function esPomkemonValido(p) {
  const valido = p && /^\d{1,4}$/.test(String(p.numero ?? '').trim()) && p.nombre;
  if (!valido) console.warn('[datos] Pomkémon ignorado por datos incompletos:', p);
  return valido;
}

/** Lista ordenada por número, sin duplicados ni registros inválidos. */
export const obtenerPomkemons = memorizar(async () => {
  const crudos = await cargar('pomkemons');
  const porNumero = new Map();

  for (const p of crudos.filter(esPomkemonValido)) {
    const numero = normalizarNumero(p.numero);
    if (porNumero.has(numero)) {
      console.warn(`[datos] Número duplicado ${numero}: se conserva el primero.`);
      continue;
    }
    porNumero.set(numero, {
      ...p,
      numero,
      tipos: (p.tipos ?? []).slice(0, 2),
      tamano: ['S', 'L', 'X'].includes(p.tamano) ? p.tamano : 'L',
      evoluciones: (p.evoluciones ?? []).map(normalizarNumero),
    });
  }

  return [...porNumero.values()].sort((a, b) => a.numero.localeCompare(b.numero));
});

const obtenerMapaPomkemons = memorizar(async () => {
  const lista = await obtenerPomkemons();
  return new Map(lista.map((p) => [p.numero, p]));
});

/** Un Pomkémon por número ("1", "0001"...), o null si no existe. */
export async function obtenerPomkemon(numero) {
  const mapa = await obtenerMapaPomkemons();
  return mapa.get(normalizarNumero(numero)) ?? null;
}

/** Pomkémon anterior y siguiente existentes (se saltan los números faltantes). */
export async function obtenerVecinos(numero) {
  const lista = await obtenerPomkemons();
  const indice = lista.findIndex((p) => p.numero === normalizarNumero(numero));
  if (indice === -1) return { anterior: null, siguiente: null };
  return {
    anterior: lista[indice - 1] ?? null,
    siguiente: lista[indice + 1] ?? null,
  };
}

/** Cadena evolutiva como objetos Pomkémon (se omiten los que aún no existen). */
export async function obtenerEvoluciones(pomkemon) {
  const mapa = await obtenerMapaPomkemons();
  return (pomkemon?.evoluciones ?? []).map((n) => mapa.get(n)).filter(Boolean);
}

/* ---------- Habilidades ---------- */

const obtenerMapaHabilidades = memorizar(async () => {
  const lista = await cargar('habilidades');
  return new Map(lista.map((h) => [h.id, h]));
});

export async function obtenerHabilidad(id) {
  const mapa = await obtenerMapaHabilidades();
  return mapa.get(id) ?? null;
}

/* ---------- Memes, novedades y recursos ---------- */

function conPomkemonsNormalizados(item) {
  return { ...item, pomkemons: (item.pomkemons ?? []).map(normalizarNumero) };
}

export const obtenerMemes = memorizar(async () =>
  (await cargar('memes')).map((m) => ({ ...conPomkemonsNormalizados(m), imagenes: m.imagenes ?? [] })),
);

/** Novedades de la más reciente a la más antigua. */
export const obtenerNovedades = memorizar(async () =>
  (await cargar('novedades'))
    .map((n) => ({ ...conPomkemonsNormalizados(n), contenido: n.contenido ?? [] }))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(b.id).localeCompare(String(a.id))),
);

export const obtenerRecursos = memorizar(async () =>
  (await cargar('recursos')).map((r) => ({ ...conPomkemonsNormalizados(r), archivos: r.archivos ?? [] })),
);

export async function obtenerMeme(id) {
  return (await obtenerMemes()).find((m) => m.id === id) ?? null;
}

export async function obtenerNovedad(id) {
  return (await obtenerNovedades()).find((n) => n.id === id) ?? null;
}

export async function obtenerRecurso(id) {
  return (await obtenerRecursos()).find((r) => r.id === id) ?? null;
}

/* ---------- Índice inverso: "Imágenes donde aparece" ---------- */

/**
 * Mapa numero → [{ tipo, id, titulo, imagen, enlace }]
 * construido una sola vez a partir de memes, novedades y recursos.
 */
const obtenerIndiceApariciones = memorizar(async () => {
  const [memes, novedades, recursos] = await Promise.all([
    obtenerMemes(),
    obtenerNovedades(),
    obtenerRecursos(),
  ]);

  const indice = new Map();
  const registrar = (numeros, aparicion) => {
    for (const numero of new Set(numeros)) {
      if (!indice.has(numero)) indice.set(numero, []);
      indice.get(numero).push(aparicion);
    }
  };

  memes.forEach((m) =>
    registrar(m.pomkemons, {
      tipo: 'meme',
      id: m.id,
      titulo: m.titulo,
      imagen: rutaMiniatura(rutaMeme(m.imagenes[0])),
      enlace: enlace('meme', m.id),
    }),
  );
  novedades.forEach((n) =>
    registrar(n.pomkemons, {
      tipo: 'novedad',
      id: n.id,
      titulo: n.titulo,
      imagen: rutaMiniatura(rutaImagen(n.imagenPortada)),
      enlace: enlace('novedad', n.id),
    }),
  );
  recursos.forEach((r) =>
    registrar(r.pomkemons, {
      tipo: 'recurso',
      id: r.id,
      titulo: r.titulo,
      imagen: rutaMiniatura(rutaImagen(r.imagenPortada)),
      enlace: enlace('recurso', r.id),
    }),
  );

  return indice;
});

/** Todo el contenido (memes, novedades, recursos) donde aparece un Pomkémon. */
export async function obtenerApariciones(numero) {
  const indice = await obtenerIndiceApariciones();
  return indice.get(normalizarNumero(numero)) ?? [];
}
