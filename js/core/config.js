/**
 * Configuración central de Cheemsificaciones Pomkémon.
 * Todo lo que no es contenido (rutas, catálogo de tipos, textos fijos,
 * enlaces externos) vive aquí para no repetirlo en cada página.
 */

export const SITIO = {
  nombre: 'Cheemsificaciones Pomkémon',
  autor: 'Yeims',
  anio: 2026,
  // Cuando exista el logo definitivo: 'assets/img/ui/logo.webp'.
  // Mientras sea null se muestra el logo de texto provisional.
  logo: null,
};

/* ---------- Rutas ---------- */
export const RUTAS = {
  datos: 'data/',
  img: 'assets/img/',                  // base para las rutas que vienen en los JSON
  pomkemons: 'assets/img/pomkemons/',  // "imagen": "0001.webp"
  memes: 'assets/img/memes/',          // "imagenes": ["meme001_1.webp"]
  tipos: 'assets/img/tipos/',          // <id>.svg
  audio: 'assets/audio/',
  placeholder: 'assets/img/ui/placeholder.svg',
};

export const ARCHIVOS_DATOS = {
  pomkemons: 'pomkemons.json',
  habilidades: 'habilidades.json',
  memes: 'memes.json',
  novedades: 'novedades.json',
  recursos: 'recursos.json',
};

/* ---------- Catálogo de los 18 tipos ----------
   Colores con contraste AA (≥ 4.5:1) frente al texto del badge.
   "texto" es opcional: por defecto el nombre va en blanco. */
export const TIPOS = {
  amcero:     { nombre: 'Amcero',     color: '#647687' },
  amgua:      { nombre: 'Amgua',      color: '#2c74d2' },
  bicho:      { nombre: 'Bicho',      color: '#6b7c16' },
  dramgon:    { nombre: 'Dramgon',    color: '#5a50c9' },
  elemctrico: { nombre: 'Elemctrico', color: '#e0b000', texto: '#1f1a00' },
  famtasma:   { nombre: 'Famtasma',   color: '#6a4f92' },
  fuemgo:     { nombre: 'Fuemgo',     color: '#c3511d' },
  hamda:      { nombre: 'Hamda',      color: '#c33ba9' },
  hiemlo:     { nombre: 'Hiemlo',     color: '#287e8e' },
  lumcha:     { nombre: 'Lumcha',     color: '#c0402f' },
  normalm:    { nombre: 'Normalm',    color: '#757558' },
  plamta:     { nombre: 'Plamta',     color: '#438231' },
  psimquico:  { nombre: 'Psimquico',  color: '#d9315d' },
  romca:      { nombre: 'Romca',      color: '#86732e' },
  simniestro: { nombre: 'Simniestro', color: '#4f4040' },
  tiemrra:    { nombre: 'Tiemrra',    color: '#936e31' },
  vemneno:    { nombre: 'Vemneno',    color: '#9150a8' },
  vomlador:   { nombre: 'Vomlador',   color: '#4670d2' },
};

// Cambiar a true cuando existan los 18 archivos assets/img/tipos/<id>.svg.
// Mientras sea false se muestran píldoras de color con el nombre del tipo.
export const USAR_SVG_TIPOS = false;

/* ---------- Escala visual según "tamano" ---------- */
export const ESCALAS = {
  S: 0.7,
  L: 0.85,
  X: 1,
};

/* ---------- Paginación y tiempos ---------- */
export const PAGINACION = {
  pomkedex: 12,
  memes: 12,
  recursos: 12,
  novedades: 5,
};

export const INICIO = {
  novedadesCarrusel: 3,
  intervaloCarruselMs: 7000,
  pomkemonsAlAzar: 3,
};

/* ---------- Audio ---------- */
export const SONIDOS = {
  hover: 'hover.mp3',
  click: 'click.mp3',
  favorite: 'favorite.mp3',
  donation: 'donation.mp3',
  bonk: 'bonk.mp3', // guiño Cheems (opcional)
};

/* ---------- Claves de localStorage ---------- */
export const STORAGE = {
  favoritos: 'cheems.favoritos',
  silencio: 'cheems.silencio',
  ultimaBusqueda: 'cheems.ultimaBusqueda', // sessionStorage
};

/* ---------- Navegación ---------- */
export const NAV = [
  { id: 'pomkedex',  texto: 'Pomkédex',       href: 'pomkedex.html',  paginas: ['pomkedex', 'pomkemon'] },
  { id: 'memes',     texto: 'Memes',          href: 'memes.html',     paginas: ['memes'] },
  { id: 'novedades', texto: 'Novedades',      href: 'novedades.html', paginas: ['novedades', 'post'] },
  { id: 'recursos',  texto: 'Recursos',       href: 'recursos.html',  paginas: ['recursos', 'recurso'] },
  { id: 'cafe',      texto: 'Tómate un café', href: 'cafe.html',      paginas: ['cafe'] },
];

/* ---------- Redes sociales (MARCADORES: reemplazar por las URLs reales) ---------- */
export const REDES = [
  { id: 'facebook',  nombre: 'Facebook',  url: 'https://www.facebook.com/TU_PAGINA' },
  { id: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/TU_USUARIO' },
  { id: 'tiktok',    nombre: 'TikTok',    url: 'https://www.tiktok.com/@TU_USUARIO' },
];

/* ---------- Donaciones (MARCADORES: reemplazar por las URLs reales) ---------- */
export const DONACION = {
  montoMinimo: 10,
  moneda: 'MXN',
  plataformas: [
    { id: 'kofi',        nombre: 'Ko-fi',        url: 'https://ko-fi.com/TU_USUARIO' },
    { id: 'mercadopago', nombre: 'Mercado Pago', url: 'https://link.mercadopago.com.mx/TU_USUARIO' },
    { id: 'paypal',      nombre: 'PayPal.Me',    url: 'https://paypal.me/TU_USUARIO' },
  ],
  limites: {
    remitente: 25,
    destinatario: 25,
    mensaje: 140,
  },
  // Fondos de la tarjeta conmemorativa. El primero es el predeterminado.
  // "imagen" es opcional (se dibuja sobre "color"); para añadir más, sube
  // la imagen a assets/img/cafe/ y agrega otra entrada aquí.
  fondos: [
    { id: 'clasico', nombre: 'Clásico', color: '#ffffff', imagen: 'assets/img/cafe/tarjeta-fondo.png' },
    { id: 'crema',   nombre: 'Crema',   color: '#fbf0da' },
    { id: 'rosa',    nombre: 'Rosa',    color: '#fde6ea' },
    { id: 'menta',   nombre: 'Menta',   color: '#e2f5ea' },
    { id: 'cielo',   nombre: 'Cielo',   color: '#e3effc' },
    { id: 'lavanda', nombre: 'Lavanda', color: '#efe7fb' },
  ],
  imagenCafe: 'assets/img/cafe/cafe.png',
};

/* ---------- Textos fijos ---------- */
export const TEXTOS = {
  sinApariciones: 'Este Pomkémon no aparece en ningún catálogo',
  agradecimientoDonativo: '¡Muchas gracias por tu donativo a nombre de Cheemsificaciones Pomkémon!',
  disclaimer:
    'Cheemsificaciones Pomkémon es un proyecto de fanart no oficial. Pokémon y sus personajes, ' +
    'nombres y marcas pertenecen a sus respectivos propietarios. Este sitio no está afiliado ni ' +
    'respaldado por The Pokémon Company, Nintendo, Game Freak o Creatures Inc.',
  acercaDe:
    'Texto provisional. Cheemsificaciones Pomkémon es un proyecto de fanarts creado por Yeims, ' +
    'donde los Pomkémon se reimaginan al estilo Cheems.',
};
