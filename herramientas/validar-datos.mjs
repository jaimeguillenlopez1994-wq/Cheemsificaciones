#!/usr/bin/env node
/**
 * Valida los JSON de data/ antes de publicar.
 *
 *   npm run validar
 *
 * - ERRORES: rompen el sitio o muestran datos incorrectos → el comando falla
 *   (y en GitHub Actions se bloquea la publicación).
 * - AVISOS: no rompen nada (p. ej. una imagen que aún no se sube).
 *
 * Reglas tomadas del Documento Técnico de Especificaciones v3.0.
 */
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS, RUTAS, ARCHIVOS_DATOS } from '../js/core/config.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_GITHUB = Boolean(process.env.GITHUB_ACTIONS);

const errores = [];
const avisos = [];

function error(archivo, mensaje) {
  errores.push({ archivo, mensaje });
}
function aviso(archivo, mensaje) {
  avisos.push({ archivo, mensaje });
}

/* ---------- Utilidades ---------- */

async function existe(rutaRelativa) {
  try {
    await access(path.join(RAIZ, rutaRelativa));
    return true;
  } catch {
    return false;
  }
}

/** Posición de un error de JSON.parse → "línea X, columna Y". */
function ubicacion(texto, mensaje) {
  const posicion = Number(/position (\d+)/.exec(mensaje)?.[1]);
  if (Number.isNaN(posicion)) return '';
  const antes = texto.slice(0, posicion).split('\n');
  return ` (línea ${antes.length}, columna ${antes.at(-1).length + 1})`;
}

async function leerJSON(clave) {
  const archivo = `data/${ARCHIVOS_DATOS[clave]}`;
  let texto;
  try {
    texto = await readFile(path.join(RAIZ, archivo), 'utf8');
  } catch {
    error(archivo, 'El archivo no existe.');
    return { archivo, datos: null };
  }
  try {
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos)) {
      error(archivo, 'Debe contener un arreglo: [ {...}, {...} ].');
      return { archivo, datos: null };
    }
    return { archivo, datos };
  } catch (e) {
    error(archivo, `Error de formato JSON${ubicacion(texto, e.message)}. Revisa comas, comillas y llaves.`);
    return { archivo, datos: null };
  }
}

const esTexto = (valor) => typeof valor === 'string' && valor.trim() !== '';
const etiqueta = (item, i, campo = 'id') => (item && esTexto(item[campo]) ? `"${item[campo]}"` : `#${i + 1}`);

function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto ?? '')) return false;
  const [a, m, d] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

/**
 * Los ids dan nombre a las páginas fijas que se generan al publicar
 * (post-001.html, rec-001.html, meme-001.html): prefijo obligatorio y solo
 * minúsculas, números y guiones, para que nunca pisen otra página del sitio.
 */
function revisarId(archivo, quien, id, prefijo) {
  if (!esTexto(id)) return;
  if (!new RegExp(`^${prefijo}-[a-z0-9-]+$`).test(id)) {
    error(archivo, `${quien}: el id debe empezar por "${prefijo}-" y usar solo minúsculas, números y guiones (p. ej. "${prefijo}-001").`);
  }
}

function revisarDuplicados(archivo, lista, campo, nombre) {
  const vistos = new Set();
  for (const item of lista) {
    const valor = item?.[campo];
    if (!esTexto(valor)) continue;
    if (vistos.has(valor)) error(archivo, `${nombre} duplicado: "${valor}".`);
    vistos.add(valor);
  }
}

/** Archivos que faltan, agrupados por JSON para no inundar el informe. */
const faltantes = new Map();

async function revisarImagen(archivo, quien, rutaRelativa) {
  if (!esTexto(rutaRelativa) || (await existe(rutaRelativa))) return;
  if (!faltantes.has(archivo)) faltantes.set(archivo, []);
  faltantes.get(archivo).push(rutaRelativa);
}

function revisarReferencias(archivo, quien, pomkemons, numeros) {
  if (pomkemons === undefined) return;
  if (!Array.isArray(pomkemons)) {
    error(archivo, `${quien}: "pomkemons" debe ser un arreglo de números, p. ej. ["0001"].`);
    return;
  }
  for (const n of pomkemons) {
    if (!numeros.has(n)) aviso(archivo, `${quien}: menciona al Pomkémon "${n}", que no existe en pomkemons.json.`);
  }
}

/* ---------- Validaciones por catálogo ---------- */

async function validarPomkemons({ archivo, datos }, habilidades) {
  const numeros = new Set();
  if (!datos) return numeros;

  revisarDuplicados(archivo, datos, 'numero', 'Número de Pomkémon');

  for (const [i, p] of datos.entries()) {
    const quien = `Pomkémon ${etiqueta(p, i, 'numero')}`;
    if (typeof p !== 'object' || p === null) {
      error(archivo, `Elemento #${i + 1}: no es un objeto.`);
      continue;
    }
    if (!/^\d{4}$/.test(p.numero ?? '')) error(archivo, `${quien}: "numero" debe tener 4 dígitos entre comillas, p. ej. "0001".`);
    else numeros.add(p.numero);

    if (!esTexto(p.nombre)) error(archivo, `${quien}: falta "nombre".`);
    if (!esTexto(p.descripcion)) aviso(archivo, `${quien}: falta "descripcion".`);

    if (!esTexto(p.imagen)) error(archivo, `${quien}: falta "imagen" (p. ej. "${p.numero ?? '0001'}.webp").`);
    else {
      if (!p.imagen.endsWith('.webp')) aviso(archivo, `${quien}: la imagen debería ser .webp (${p.imagen}).`);
      await revisarImagen(archivo, quien, RUTAS.pomkemons + p.imagen);
    }

    if (!Array.isArray(p.tipos) || p.tipos.length < 1 || p.tipos.length > 2) {
      error(archivo, `${quien}: "tipos" debe tener 1 o 2 tipos.`);
    } else {
      for (const tipo of p.tipos) {
        if (!TIPOS[tipo]) error(archivo, `${quien}: el tipo "${tipo}" no existe. Válidos: ${Object.keys(TIPOS).join(', ')}.`);
      }
      if (new Set(p.tipos).size !== p.tipos.length) error(archivo, `${quien}: tipo repetido.`);
    }

    if (!esTexto(p.habilidad)) error(archivo, `${quien}: falta "habilidad".`);
    else if (habilidades && !habilidades.has(p.habilidad)) {
      error(archivo, `${quien}: la habilidad "${p.habilidad}" no existe en habilidades.json.`);
    }

    if (!['S', 'L', 'X'].includes(p.tamano)) error(archivo, `${quien}: "tamano" debe ser "S", "L" o "X".`);

    if (p.evoluciones !== undefined) {
      if (!Array.isArray(p.evoluciones)) error(archivo, `${quien}: "evoluciones" debe ser un arreglo.`);
      else if (p.evoluciones.some((n) => !/^\d{4}$/.test(n))) {
        error(archivo, `${quien}: cada evolución debe ser un número de 4 dígitos entre comillas.`);
      } else if (p.evoluciones.length && !p.evoluciones.includes(p.numero)) {
        aviso(archivo, `${quien}: su línea evolutiva no lo incluye a sí mismo.`);
      }
    }
  }

  // Evoluciones que apuntan a números inexistentes (se omiten en la web, pero conviene saberlo)
  const faltantes = new Set();
  for (const p of datos) for (const n of p?.evoluciones ?? []) if (!numeros.has(n)) faltantes.add(n);
  if (faltantes.size) aviso(archivo, `Evoluciones que aún no existen (se omiten en la web): ${[...faltantes].sort().join(', ')}.`);

  return numeros;
}

function validarHabilidades({ archivo, datos }) {
  if (!datos) return null;
  revisarDuplicados(archivo, datos, 'id', 'id de habilidad');
  for (const [i, h] of datos.entries()) {
    const quien = `Habilidad ${etiqueta(h, i)}`;
    if (!esTexto(h?.id)) error(archivo, `${quien}: falta "id".`);
    if (!esTexto(h?.nombre)) error(archivo, `${quien}: falta "nombre".`);
    if (!esTexto(h?.descripcion)) aviso(archivo, `${quien}: falta "descripcion".`);
  }
  return new Set(datos.map((h) => h?.id).filter(esTexto));
}

async function validarMemes({ archivo, datos }, numeros) {
  if (!datos) return;
  revisarDuplicados(archivo, datos, 'id', 'id de meme');
  for (const [i, m] of datos.entries()) {
    const quien = `Meme ${etiqueta(m, i)}`;
    if (!esTexto(m?.id)) error(archivo, `${quien}: falta "id".`);
    revisarId(archivo, quien, m?.id, 'meme');
    if (!esTexto(m?.titulo)) error(archivo, `${quien}: falta "titulo".`);
    if (!Array.isArray(m?.imagenes) || m.imagenes.length === 0) error(archivo, `${quien}: "imagenes" debe tener al menos una imagen.`);
    else for (const img of m.imagenes) await revisarImagen(archivo, quien, RUTAS.memes + img);
    revisarReferencias(archivo, quien, m?.pomkemons, numeros);
  }
}

const BLOQUES = {
  parrafo: (b) => esTexto(b.texto) || 'necesita "texto"',
  subtitulo: (b) => esTexto(b.texto) || 'necesita "texto"',
  imagen: (b) => esTexto(b.url) || 'necesita "url"',
};

async function validarNovedades({ archivo, datos }, numeros) {
  if (!datos) return;
  revisarDuplicados(archivo, datos, 'id', 'id de novedad');
  for (const [i, n] of datos.entries()) {
    const quien = `Novedad ${etiqueta(n, i)}`;
    if (!esTexto(n?.id)) error(archivo, `${quien}: falta "id".`);
    revisarId(archivo, quien, n?.id, 'post');
    if (!esTexto(n?.titulo)) error(archivo, `${quien}: falta "titulo".`);
    if (!fechaValida(n?.fecha)) error(archivo, `${quien}: "fecha" debe ser una fecha real con formato AAAA-MM-DD (tiene "${n?.fecha}").`);
    if (!esTexto(n?.resumen)) aviso(archivo, `${quien}: falta "resumen" (se usa en la lista y en el carrusel).`);
    await revisarImagen(archivo, quien, n?.imagenPortada && RUTAS.img + n.imagenPortada);
    revisarReferencias(archivo, quien, n?.pomkemons, numeros);

    if (!Array.isArray(n?.contenido)) {
      error(archivo, `${quien}: "contenido" debe ser un arreglo de bloques.`);
      continue;
    }
    for (const [j, bloque] of n.contenido.entries()) {
      const regla = BLOQUES[bloque?.tipo];
      if (!regla) {
        error(archivo, `${quien}, bloque ${j + 1}: tipo "${bloque?.tipo}" desconocido (usa ${Object.keys(BLOQUES).join(', ')}).`);
        continue;
      }
      const resultado = regla(bloque);
      if (resultado !== true) error(archivo, `${quien}, bloque ${j + 1} (${bloque.tipo}): ${resultado}.`);
      if (bloque.tipo === 'imagen') await revisarImagen(archivo, `${quien}, bloque ${j + 1}`, RUTAS.img + bloque.url);
    }
  }
}

async function validarRecursos({ archivo, datos }, numeros) {
  if (!datos) return;
  revisarDuplicados(archivo, datos, 'id', 'id de recurso');
  for (const [i, r] of datos.entries()) {
    const quien = `Recurso ${etiqueta(r, i)}`;
    if (!esTexto(r?.id)) error(archivo, `${quien}: falta "id".`);
    revisarId(archivo, quien, r?.id, 'rec');
    if (!esTexto(r?.titulo)) error(archivo, `${quien}: falta "titulo".`);
    if (!esTexto(r?.categoria)) aviso(archivo, `${quien}: falta "categoria".`);
    await revisarImagen(archivo, quien, r?.imagenPortada && RUTAS.img + r.imagenPortada);
    revisarReferencias(archivo, quien, r?.pomkemons, numeros);

    if (!Array.isArray(r?.archivos)) {
      error(archivo, `${quien}: "archivos" debe ser un arreglo.`);
      continue;
    }
    if (r.archivos.length === 0) aviso(archivo, `${quien}: no tiene archivos para descargar.`);
    for (const [j, a] of r.archivos.entries()) {
      if (!esTexto(a?.url)) error(archivo, `${quien}, archivo ${j + 1}: falta "url".`);
      else await revisarImagen(archivo, `${quien}, archivo ${j + 1}`, RUTAS.img + a.url);
      if (!esTexto(a?.nombre)) aviso(archivo, `${quien}, archivo ${j + 1}: falta "nombre".`);
    }
  }
}

/* ---------- Informe ---------- */

function imprimir(lista, nivel, simbolo) {
  for (const { archivo, mensaje } of lista) {
    if (EN_GITHUB) console.log(`::${nivel} file=${archivo}::${mensaje}`);
    else console.log(`  ${simbolo} ${archivo}: ${mensaje}`);
  }
}

async function principal() {
  const [pomkemons, habilidades, memes, novedades, recursos] = await Promise.all(
    ['pomkemons', 'habilidades', 'memes', 'novedades', 'recursos'].map(leerJSON),
  );

  const idsHabilidades = validarHabilidades(habilidades);
  const numeros = await validarPomkemons(pomkemons, idsHabilidades);
  await validarMemes(memes, numeros);
  await validarNovedades(novedades, numeros);
  await validarRecursos(recursos, numeros);

  if (idsHabilidades && pomkemons.datos) {
    const usadas = new Set(pomkemons.datos.map((p) => p?.habilidad));
    const sinUso = [...idsHabilidades].filter((id) => !usadas.has(id));
    if (sinUso.length) aviso(habilidades.archivo, `Habilidades sin ningún Pomkémon: ${sinUso.join(', ')}.`);
  }

  for (const [archivo, rutas] of faltantes) {
    aviso(archivo, `Faltan ${rutas.length} archivo(s) por subir (la web muestra una imagen provisional): ${rutas.join(', ')}.`);
  }

  console.log('\nValidación de datos — Cheemsificaciones Pomkémon\n');
  imprimir(errores, 'error', '✖');
  imprimir(avisos, 'warning', '⚠');
  console.log(
    `\n${errores.length ? '✖' : '✔'} ${errores.length} error(es), ${avisos.length} aviso(s). ` +
      `${numeros.size} Pomkémon revisados.\n`,
  );
  process.exitCode = errores.length ? 1 : 0;
}

principal();
