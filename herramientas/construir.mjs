#!/usr/bin/env node
/**
 * Genera la versión publicable del sitio en _sitio/:
 *
 *   npm run construir
 *
 * 1. Copia el sitio (sin herramientas de desarrollo).
 * 2. Activa el modo publicado en js/core/config.js (COMPILADO).
 * 3. Miniaturas de ~600 px de las imágenes en subcarpetas min/ (T2).
 * 4. Imágenes para compartir en redes (1200×630) en assets/img/social/ (T3).
 * 5. Una página fija por Pomkémon, novedad, recurso y meme con etiquetas
 *    Open Graph, para que Facebook, TikTok, WhatsApp… muestren la vista previa
 *    (las redes no ejecutan JavaScript) (T3).
 * 6. sitemap.xml y robots.txt.
 *
 * Variables de entorno opcionales:
 *   SITIO_URL  dirección pública (por defecto SITIO.url de config.js)
 *   VERSION    identificador de la publicación (por defecto el commit de git)
 */
import { cp, rm, mkdir, readFile, writeFile, readdir, access } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SITIO, TIPOS, RUTAS, ARCHIVOS_DATOS } from '../js/core/config.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, '_sitio');

const EXCLUIR = new Set([
  '.git', '.github', '.gitignore', 'node_modules', 'herramientas', 'pruebas', '_sitio',
  'package.json', 'package-lock.json', 'playwright.config.js', 'test-results', 'playwright-report',
  'README.md', 'CLAUDE.md',
]);

const CARPETAS_MINIATURAS = ['pomkemons', 'memes', 'novedades', 'recursos'];
const ANCHO_MINIATURA = 600;
const SOCIAL = { ancho: 1200, alto: 630 };
const PAGINAS_BASE = ['index.html', 'pomkedex.html', 'memes.html', 'novedades.html', 'recursos.html', 'cafe.html'];

const urlSitio = (process.env.SITIO_URL || SITIO.url).replace(/\/?$/, '/');
const version = process.env.VERSION || obtenerVersion();

/* ---------- Utilidades ---------- */

function obtenerVersion() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return String(Date.now());
  }
}

async function existe(ruta) {
  try {
    await access(ruta);
    return true;
  } catch {
    return false;
  }
}

const escapar = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

async function leerDatos(clave) {
  return JSON.parse(await readFile(path.join(RAIZ, 'data', ARCHIVOS_DATOS[clave]), 'utf8'));
}

/** Parte un texto en líneas de como máximo `ancho` caracteres (sin cortar palabras). */
function partirLineas(texto, ancho, maximo) {
  const lineas = [];
  let actual = '';
  for (const palabra of String(texto).split(/\s+/)) {
    if ((actual + ' ' + palabra).trim().length > ancho && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = (actual + ' ' + palabra).trim();
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length > maximo) {
    lineas.length = maximo;
    lineas[maximo - 1] = lineas[maximo - 1].replace(/\s*\S*$/, '') + '…';
  }
  return lineas;
}

const ID_SEGURO = /^[a-z0-9-]+$/;

/* ---------- 1-2. Copia y modo publicado ---------- */

async function copiarSitio() {
  await rm(SALIDA, { recursive: true, force: true });
  await mkdir(SALIDA);
  for (const entrada of await readdir(RAIZ)) {
    if (EXCLUIR.has(entrada)) continue;
    await cp(path.join(RAIZ, entrada), path.join(SALIDA, entrada), { recursive: true });
  }
}

async function activarModoPublicado() {
  const ruta = path.join(SALIDA, 'js/core/config.js');
  const original = await readFile(ruta, 'utf8');
  const patron = /export const COMPILADO = \{[^}]*\};/;
  if (!patron.test(original)) throw new Error('No se encontró COMPILADO en js/core/config.js.');
  await writeFile(ruta, original.replace(patron, `export const COMPILADO = { activo: true, version: '${version}' };`));
}

/* ---------- 3. Miniaturas ---------- */

async function generarMiniaturas() {
  let total = 0;
  for (const carpeta of CARPETAS_MINIATURAS) {
    const origen = path.join(SALIDA, RUTAS.img, carpeta);
    if (!(await existe(origen))) continue;
    const destino = path.join(origen, 'min');
    await mkdir(destino, { recursive: true });

    for (const archivo of await readdir(origen)) {
      const extension = path.extname(archivo).toLowerCase();
      if (!['.webp', '.png', '.jpg', '.jpeg'].includes(extension)) continue;
      const imagen = sharp(path.join(origen, archivo)).resize({ width: ANCHO_MINIATURA, withoutEnlargement: true });
      if (extension === '.webp') imagen.webp({ quality: 80, alphaQuality: 90 });
      else if (extension === '.png') imagen.png({ compressionLevel: 9, palette: false });
      else imagen.jpeg({ quality: 80, mozjpeg: true });
      await imagen.toFile(path.join(destino, archivo));
      total++;
    }
  }
  return total;
}

/* ---------- 4. Imágenes para redes (1200×630) ---------- */

const FUENTE_SVG = "Fredoka, 'DejaVu Sans', Arial, Helvetica, sans-serif";

/**
 * Líneas de texto SVG. La fuente disponible al generar puede variar de un equipo
 * a otro, así que si una línea podría pasar de `anchoMaximo` se comprime para caber.
 */
function svgTexto({ lineas, x, y, tamano, color = '#222', peso = 700, interlineado = 1.2, ancla = 'start', anchoMaximo = 1100 }) {
  const ANCHO_LETRA = 0.64; // ancho medio aproximado de una letra, en proporción al tamaño
  return lineas
    .map((linea, i) => {
      const estimado = linea.length * tamano * ANCHO_LETRA;
      const ajuste = estimado > anchoMaximo ? ` textLength="${anchoMaximo}" lengthAdjust="spacingAndGlyphs"` : '';
      return `<text x="${x}" y="${y + i * tamano * interlineado}" font-family="${FUENTE_SVG}" font-size="${tamano}" font-weight="${peso}" fill="${color}" text-anchor="${ancla}"${ajuste}>${escapar(linea)}</text>`;
    })
    .join('');
}

/** Tarjeta de texto (sin imagen de contenido): se usa para el sitio y como respaldo. */
function svgTarjetaTexto(titulo, subtitulo) {
  const lineas = partirLineas(titulo, 22, 3);
  const inicioY = 315 - ((lineas.length - 1) * 76 * 1.15) / 2;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL.ancho}" height="${SOCIAL.alto}">
      <rect width="100%" height="100%" fill="#faf0dc"/>
      <rect x="24" y="24" width="1152" height="582" rx="40" fill="none" stroke="#6b0d14" stroke-width="12"/>
      ${svgTexto({ lineas, x: 600, y: inicioY, tamano: 76, color: '#6b0d14', ancla: 'middle', interlineado: 1.15, anchoMaximo: 1040 })}
      ${svgTexto({ lineas: [subtitulo], x: 600, y: 540, tamano: 34, color: '#444', peso: 500, ancla: 'middle' })}
    </svg>`);
}

async function guardarSocial(nombre, imagen) {
  const destino = path.join(SALIDA, RUTAS.img, 'social', `${nombre}.jpg`);
  await imagen.jpeg({ quality: 84, mozjpeg: true }).toFile(destino);
  return `${RUTAS.img}social/${nombre}.jpg`;
}

async function socialGeneral() {
  return guardarSocial('general', sharp(svgTarjetaTexto(SITIO.nombre, `Fanarts por ${SITIO.autor}`)));
}

async function socialPomkemon(p) {
  const tipo = TIPOS[p.tipos?.[0]] ?? { color: '#a0161f' };
  const fanart = path.join(SALIDA, RUTAS.pomkemons, p.imagen ?? '');
  const imagen = (await existe(fanart)) && p.imagen ? fanart : path.join(SALIDA, RUTAS.placeholder);
  const retrato = await sharp(imagen).resize(540, 540, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

  const pildoras = (p.tipos ?? [])
    .map((id, i) => {
      const t = TIPOS[id] ?? { nombre: id, color: '#888' };
      const x = 640 + i * 230;
      return `<rect x="${x}" y="360" width="210" height="56" rx="28" fill="${t.color}"/>
              <text x="${x + 105}" y="398" font-family="${FUENTE_SVG}" font-size="28" font-weight="700" fill="${t.texto ?? '#fff'}" text-anchor="middle">${escapar(t.nombre)}</text>`;
    })
    .join('');

  const nombre = partirLineas(p.nombre, 12, 2);
  const capa = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL.ancho}" height="${SOCIAL.alto}">
      <rect x="18" y="18" width="1164" height="594" rx="40" fill="none" stroke="${tipo.color}" stroke-width="14"/>
      ${svgTexto({ lineas: [`#${p.numero}`], x: 640, y: 150, tamano: 48, color: '#6b0d14', peso: 600 })}
      ${svgTexto({ lineas: nombre, x: 640, y: 245, tamano: 76, color: '#222', interlineado: 1.08, anchoMaximo: 500 })}
      ${pildoras}
      ${svgTexto({ lineas: [SITIO.nombre], x: 640, y: 540, tamano: 30, color: '#6b0d14', peso: 600, anchoMaximo: 500 })}
    </svg>`);

  return guardarSocial(
    `pomkemon-${p.numero}`,
    sharp({ create: { width: SOCIAL.ancho, height: SOCIAL.alto, channels: 3, background: '#faf0dc' } }).composite([
      { input: retrato, left: 50, top: 45 },
      { input: capa, left: 0, top: 0 },
    ]),
  );
}

/** Portada recortada a 1200×630 con una banda y el título encima. */
async function socialConPortada(nombre, rutaRelativa, titulo, { encajar = 'cover' } = {}) {
  const origen = rutaRelativa ? path.join(SALIDA, rutaRelativa) : null;
  if (!origen || !(await existe(origen))) {
    return guardarSocial(nombre, sharp(svgTarjetaTexto(titulo, SITIO.nombre)));
  }
  const fondo = await sharp(origen)
    .resize(SOCIAL.ancho, SOCIAL.alto, { fit: encajar, background: '#faf0dc' })
    .flatten({ background: '#faf0dc' })
    .toBuffer();
  const lineas = partirLineas(titulo, 38, 2);
  const alto = 70 + lineas.length * 58;
  const banda = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL.ancho}" height="${SOCIAL.alto}">
      <rect y="${SOCIAL.alto - alto}" width="1200" height="${alto}" fill="#14080a" fill-opacity="0.78"/>
      ${svgTexto({ lineas, x: 48, y: SOCIAL.alto - alto + 70, tamano: 50, color: '#fff', interlineado: 1.16, anchoMaximo: 1100 })}
    </svg>`);
  return guardarSocial(nombre, sharp(fondo).composite([{ input: banda, left: 0, top: 0 }]));
}

/* ---------- 5. Páginas con etiquetas para redes ---------- */

function etiquetasSociales({ titulo, descripcion, url, imagen, alt, tipo = 'website' }) {
  const atributos = (valor) => escapar(valor);
  return `
  <link rel="canonical" href="${atributos(url)}">
  <meta property="og:type" content="${tipo}">
  <meta property="og:site_name" content="${atributos(SITIO.nombre)}">
  <meta property="og:locale" content="es_MX">
  <meta property="og:title" content="${atributos(titulo)}">
  <meta property="og:description" content="${atributos(descripcion)}">
  <meta property="og:url" content="${atributos(url)}">
  <meta property="og:image" content="${atributos(urlSitio + imagen)}">
  <meta property="og:image:width" content="${SOCIAL.ancho}">
  <meta property="og:image:height" content="${SOCIAL.alto}">
  <meta property="og:image:alt" content="${atributos(alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${atributos(titulo)}">
  <meta name="twitter:description" content="${atributos(descripcion)}">
  <meta name="twitter:image" content="${atributos(urlSitio + imagen)}">
`;
}

/** Inserta las etiquetas y, opcionalmente, cambia título, descripción e id de la página. */
function personalizarHTML(html, { titulo, descripcion, etiquetas, id }) {
  let salida = html;
  if (titulo) salida = salida.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(titulo)}</title>`);
  if (descripcion) {
    salida = salida.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapar(descripcion)}">`);
  }
  if (id) salida = salida.replace(/<body data-pagina="([^"]*)">/, `<body data-pagina="$1" data-id="${escapar(id)}">`);
  return salida.replace('</head>', `${etiquetas}</head>`);
}

async function paginaFija(plantilla, archivo, datos) {
  const html = await readFile(path.join(SALIDA, plantilla), 'utf8');
  await writeFile(path.join(SALIDA, archivo), personalizarHTML(html, datos));
  return archivo;
}

function tituloDe(html) {
  return /<title>([\s\S]*?)<\/title>/.exec(html)?.[1].trim() ?? SITIO.nombre;
}
function descripcionDe(html) {
  return /<meta name="description" content="([^"]*)">/.exec(html)?.[1] ?? '';
}

/* ---------- 6. Sitemap ---------- */

async function escribirSitemap(paginas) {
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = paginas
    .map((p) => `  <url><loc>${escapar(urlSitio + (p === 'index.html' ? '' : p))}</loc><lastmod>${hoy}</lastmod></url>`)
    .join('\n');
  await writeFile(
    path.join(SALIDA, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  await writeFile(path.join(SALIDA, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${urlSitio}sitemap.xml\n`);
}

/* ---------- Principal ---------- */

async function principal() {
  const inicio = Date.now();
  console.log(`\nConstruyendo ${SITIO.nombre} → _sitio/  (versión ${version}, ${urlSitio})\n`);

  await copiarSitio();
  await activarModoPublicado();
  const miniaturas = await generarMiniaturas();
  await mkdir(path.join(SALIDA, RUTAS.img, 'social'), { recursive: true });

  const [pomkemons, memes, novedades, recursos] = await Promise.all(
    ['pomkemons', 'memes', 'novedades', 'recursos'].map(leerDatos),
  );

  const imagenGeneral = await socialGeneral();
  const paginas = [];

  // Páginas base: etiquetas genéricas
  for (const pagina of PAGINAS_BASE) {
    const ruta = path.join(SALIDA, pagina);
    const html = await readFile(ruta, 'utf8');
    const titulo = tituloDe(html);
    await writeFile(
      ruta,
      personalizarHTML(html, {
        etiquetas: etiquetasSociales({
          titulo,
          descripcion: descripcionDe(html),
          url: urlSitio + (pagina === 'index.html' ? '' : pagina),
          imagen: imagenGeneral,
          alt: SITIO.nombre,
        }),
      }),
    );
    paginas.push(pagina);
  }

  // Pomkémon
  for (const p of pomkemons) {
    if (!/^\d{4}$/.test(p?.numero ?? '')) continue;
    const imagen = await socialPomkemon(p);
    const titulo = `#${p.numero} ${p.nombre} | ${SITIO.nombre}`;
    const archivo = `pomkemon-${p.numero}.html`;
    paginas.push(
      await paginaFija('pomkemon.html', archivo, {
        titulo,
        descripcion: p.descripcion,
        id: p.numero,
        etiquetas: etiquetasSociales({ titulo, descripcion: p.descripcion, url: urlSitio + archivo, imagen, alt: `Fanart de ${p.nombre}` }),
      }),
    );
  }

  // Novedades, recursos y memes
  const grupos = [
    { lista: novedades, plantilla: 'post.html', tipo: 'article', portada: (n) => n.imagenPortada && RUTAS.img + n.imagenPortada, texto: (n) => n.resumen },
    { lista: recursos, plantilla: 'recurso.html', tipo: 'website', portada: (r) => r.imagenPortada && RUTAS.img + r.imagenPortada, texto: (r) => r.resumen },
    { lista: memes, plantilla: 'memes.html', tipo: 'website', portada: (m) => m.imagenes?.[0] && RUTAS.memes + m.imagenes[0], texto: () => `Meme de ${SITIO.nombre}`, encajar: 'contain' },
  ];
  for (const { lista, plantilla, tipo, portada, texto, encajar } of grupos) {
    for (const item of lista) {
      if (!ID_SEGURO.test(item?.id ?? '')) {
        console.warn(`  ⚠ Se omite la página fija de "${item?.id}": id no válido (ejecuta npm run validar).`);
        continue;
      }
      const imagen = await socialConPortada(item.id, portada(item), item.titulo, { encajar });
      const titulo = `${item.titulo} | ${SITIO.nombre}`;
      const descripcion = texto(item) ?? '';
      const archivo = `${item.id}.html`;
      paginas.push(
        await paginaFija(plantilla, archivo, {
          titulo,
          descripcion,
          id: item.id,
          etiquetas: etiquetasSociales({ titulo, descripcion, url: urlSitio + archivo, imagen, alt: item.titulo, tipo }),
        }),
      );
    }
  }

  await escribirSitemap(paginas);

  console.log(`  ✔ ${miniaturas} miniatura(s) en min/`);
  console.log(`  ✔ ${paginas.length - PAGINAS_BASE.length} página(s) fijas con vista previa para redes`);
  console.log(`  ✔ sitemap.xml con ${paginas.length} direcciones y robots.txt`);
  console.log(`\nListo en ${((Date.now() - inicio) / 1000).toFixed(1)} s. Pruébalo con: npm run servir:sitio\n`);
}

principal().catch((error) => {
  console.error(`\n✖ ${error.message}\n`);
  process.exitCode = 1;
});
