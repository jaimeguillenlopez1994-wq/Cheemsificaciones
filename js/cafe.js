/**
 * "Tómate un café": formulario de donativo, vista previa en vivo de la tarjeta
 * conmemorativa, generación del PNG (html2canvas), confeti (canvas-confetti),
 * sonido de donativo y opciones para compartir.
 *
 * El sitio no puede verificar pagos externos: la tarjeta se genera al pulsar
 * "Ya doné, generar mi tarjeta" (sistema de confianza).
 */
import { DONACION, TEXTOS, SITIO } from './core/config.js';
import { obtenerPomkemons, obtenerPomkemon } from './core/data.js';
import { escaparHTML, obtenerParametro, rutaPomkemon } from './core/utils.js';
import { reproducir } from './core/audio.js';

const TAMANO_TARJETA = 540; // px en pantalla; el PNG sale al doble (1080×1080)
const ESCALA_PNG = 2;
const TAZA_PROVISIONAL = 'assets/img/ui/taza-provisional.svg';

const $ = (id) => document.getElementById(id);
const el = {
  formulario: $('formulario-cafe'),
  pomkemon: $('pomkemon'),
  remitente: $('remitente'),
  destinatario: $('destinatario'),
  mensaje: $('mensaje'),
  campoDestinatario: $('campo-destinatario'),
  etiquetaRemitente: $('etiqueta-remitente'),
  plataformas: $('plataformas'),
  fondos: $('fondos'),
  generar: $('generar'),
  errorGeneral: $('error-general'),
  escala: $('tarjeta-escala'),
  tarjeta: $('tarjeta-cafe'),
  texto: $('tarjeta-texto'),
  taza: $('tarjeta-taza'),
  imagenPomkemon: $('tarjeta-pomkemon'),
  mensajeTarjeta: $('tarjeta-mensaje'),
  gracias: $('tarjeta-gracias'),
  modal: $('modal-resultado'),
  resultadoImagen: $('resultado-imagen'),
  descargar: $('resultado-descargar'),
  compartir: $('resultado-compartir'),
  copiarImagen: $('resultado-copiar-imagen'),
  copiarTexto: $('resultado-copiar-texto'),
  aviso: $('resultado-aviso'),
};

const estado = {
  pomkemon: null,
  png: null, // Blob de la última tarjeta generada
};

/* ---------- Utilidades ---------- */

const limpiar = (texto) => texto.replace(/\s+/g, ' ').trim();
const modalidad = () => el.formulario.elements.modalidad.value;
const esRegalo = () => modalidad() === 'regalo';

function datosFormulario() {
  return {
    remitente: limpiar(el.remitente.value),
    destinatario: limpiar(el.destinatario.value),
    mensaje: limpiar(el.mensaje.value),
    pomkemon: estado.pomkemon?.nombre ?? '',
  };
}

/** Texto plano de la leyenda (para copiar y compartir). */
function leyendaTexto({ remitente, destinatario, pomkemon }) {
  return esRegalo()
    ? `${destinatario}, recibe este café a nombre de ${remitente} y ${pomkemon}, ¡Con mucho cariño de parte de ambos. Disfrútalo, relájate y dile adiós a la amsiedad!`
    : `${remitente}, te has tomado un café con ${pomkemon}, ahora se encuentra muy feliz y sus nivéles deamsiedad han bajado muchísimo!`;
}

/** Misma leyenda en HTML, con los nombres resaltados en rojo. */
function leyendaHTML({ remitente, destinatario, pomkemon }) {
  const nombre = (texto, respaldo) =>
    `<span class="tarjeta-cafe__nombre">${escaparHTML(texto || respaldo)}</span>`;

  return esRegalo()
    ? `${nombre(destinatario, '[Destinatario]')}, recibe este café a nombre de ${nombre(remitente, '[Remitente]')} y ${nombre(pomkemon, '[Pomkémon]')}, ¡Con mucho cariño de parte de ambos. Disfrútalo, relájate y dile adiós a la amsiedad!`
    : `${nombre(remitente, '[Nombre]')}, te has tomado un café con ${nombre(pomkemon, '[Pomkémon]')}, ahora se encuentra muy feliz y sus nivéles deamsiedad han bajado muchísimo!`;
}

/* ---------- Vista previa en vivo ---------- */

function actualizarVista() {
  const datos = datosFormulario();
  el.texto.innerHTML = leyendaHTML(datos);
  el.mensajeTarjeta.hidden = !datos.mensaje;
  el.mensajeTarjeta.textContent = datos.mensaje ? `"${datos.mensaje}"` : '';
}

function actualizarContador(campo, limite) {
  const contador = $(`contador-${campo.id}`);
  const usados = campo.value.length;
  contador.textContent = `${usados}/${limite}`;
  contador.classList.toggle('campo__contador--limite', usados >= limite);
}

function actualizarModalidad() {
  const regalo = esRegalo();
  el.campoDestinatario.hidden = !regalo;
  el.destinatario.required = regalo;
  el.etiquetaRemitente.textContent = regalo ? 'Tu nombre (quien regala)' : 'Tu nombre';
  ocultarError(el.destinatario);
  actualizarVista();
}

async function seleccionarPomkemon(numero) {
  estado.pomkemon = numero ? await obtenerPomkemon(numero) : null;
  el.imagenPomkemon.src = estado.pomkemon ? rutaPomkemon(estado.pomkemon) : 'assets/img/ui/placeholder.svg';
  el.imagenPomkemon.alt = estado.pomkemon ? estado.pomkemon.nombre : '';
  ocultarError(el.pomkemon);
  actualizarVista();
}

/** Escala la tarjeta (540 px fijos) para que quepa en su columna. */
function ajustarEscala() {
  const disponible = el.escala.parentElement.clientWidth;
  const escala = Math.min(1, disponible / TAMANO_TARJETA);
  el.escala.style.setProperty('--escala-tarjeta', escala);
  el.escala.style.height = `${TAMANO_TARJETA * escala}px`;
}

/* ---------- Fondo de la tarjeta ---------- */

function renderizarFondos() {
  el.fondos.innerHTML = DONACION.fondos
    .map((fondo, i) => {
      let estilo = `--fondo-color: ${escaparHTML(fondo.color)}`;
      if (fondo.imagen) estilo += `; background-image: url('${escaparHTML(fondo.imagen)}')`;
      return `
        <label class="fondo">
          <input type="radio" name="fondo" value="${escaparHTML(fondo.id)}"${i === 0 ? ' checked' : ''}>
          <span class="fondo__muestra">
            <span class="fondo__color" style="${estilo}"></span>
            ${escaparHTML(fondo.nombre)}
          </span>
        </label>`;
    })
    .join('');
}

function aplicarFondo(id) {
  const fondo = DONACION.fondos.find((f) => f.id === id) ?? DONACION.fondos[0];
  if (!fondo) return;
  el.tarjeta.style.backgroundColor = fondo.color ?? '#ffffff';
  el.tarjeta.style.backgroundImage = fondo.imagen ? `url("${fondo.imagen}")` : 'none';
}

/* ---------- Validación ---------- */

function mostrarError(campo, mensaje) {
  const error = $(`error-${campo.id}`);
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', error.id);
  error.textContent = mensaje;
  error.hidden = false;
}

function ocultarError(campo) {
  const error = $(`error-${campo.id}`);
  campo.removeAttribute('aria-invalid');
  campo.removeAttribute('aria-describedby');
  if (error) error.hidden = true;
}

function validar() {
  const datos = datosFormulario();
  const errores = [];

  if (!estado.pomkemon) errores.push([el.pomkemon, 'Elige un Pomkémon para tu tarjeta.']);
  if (!datos.remitente) errores.push([el.remitente, 'Escribe tu nombre.']);
  if (esRegalo() && !datos.destinatario) errores.push([el.destinatario, 'Escribe el nombre de quien recibe el café.']);

  [el.pomkemon, el.remitente, el.destinatario].forEach(ocultarError);
  errores.forEach(([campo, mensaje]) => mostrarError(campo, mensaje));

  el.errorGeneral.hidden = errores.length === 0;
  el.errorGeneral.textContent = errores.length ? 'Revisa los campos marcados antes de generar tu tarjeta.' : '';
  if (errores.length) errores[0][0].focus();
  return errores.length === 0;
}

/* ---------- Generación de la tarjeta ---------- */

function esperarImagenes(contenedor) {
  const pendientes = [...contenedor.querySelectorAll('img')]
    .filter((img) => !img.complete)
    .map((img) => new Promise((listo) => {
      img.addEventListener('load', listo, { once: true });
      img.addEventListener('error', listo, { once: true });
    }));
  return Promise.all(pendientes);
}

async function generarPNG() {
  if (typeof window.html2canvas !== 'function') {
    throw new Error('No se pudo cargar la librería para generar la imagen (vendor/html2canvas.min.js).');
  }
  await esperarImagenes(el.tarjeta);

  const lienzo = await window.html2canvas(el.tarjeta, {
    scale: ESCALA_PNG,
    width: TAMANO_TARJETA,
    height: TAMANO_TARJETA,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    // En la copia que captura html2canvas se quita el escalado de la vista previa
    onclone: (documento) => {
      const escala = documento.getElementById('tarjeta-escala');
      escala.style.transform = 'none';
      escala.style.setProperty('--escala-tarjeta', '1');
    },
  });

  return new Promise((resolver, rechazar) => {
    lienzo.toBlob((blob) => (blob ? resolver(blob) : rechazar(new Error('No se pudo crear el PNG.'))), 'image/png');
  });
}

function lanzarConfeti() {
  if (typeof window.confetti !== 'function') return;
  const base = { disableForReducedMotion: true, zIndex: 2000 };
  window.confetti({ ...base, particleCount: 140, spread: 90, origin: { y: 0.6 } });
  setTimeout(() => window.confetti({ ...base, particleCount: 70, angle: 60, spread: 70, origin: { x: 0 } }), 250);
  setTimeout(() => window.confetti({ ...base, particleCount: 70, angle: 120, spread: 70, origin: { x: 1 } }), 400);
}

function nombreArchivo() {
  const base = (estado.pomkemon?.nombre ?? 'pomkemon').toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-');
  return `cafe-con-${base}.png`;
}

function mensajeParaCompartir() {
  return `${leyendaTexto(datosFormulario())}\n\n${TEXTOS.agradecimientoDonativo}\n${location.origin}${location.pathname}`;
}

async function mostrarResultado(blob) {
  if (estado.png?.url) URL.revokeObjectURL(estado.png.url);
  const url = URL.createObjectURL(blob);
  estado.png = { blob, url, archivo: new File([blob], nombreArchivo(), { type: 'image/png' }) };

  el.resultadoImagen.src = url;
  el.descargar.href = url;
  el.descargar.download = nombreArchivo();
  el.aviso.textContent = '';

  // Móvil: compartir nativo con la imagen. Escritorio: asistente de copia.
  const puedeCompartir = Boolean(navigator.canShare?.({ files: [estado.png.archivo] }));
  el.compartir.hidden = !puedeCompartir;
  el.copiarImagen.hidden = puedeCompartir || !(navigator.clipboard?.write && window.ClipboardItem);

  el.modal.showModal();
}

async function alGenerar(evento) {
  evento.preventDefault();
  if (!validar()) return;

  el.generar.disabled = true;
  el.generar.textContent = 'Generando tu tarjeta...';

  try {
    actualizarVista();
    const blob = await generarPNG();
    reproducir('donation');
    lanzarConfeti();
    await mostrarResultado(blob);
  } catch (error) {
    console.error(error);
    el.errorGeneral.textContent = error.message || 'Ocurrió un problema al generar la tarjeta. Inténtalo de nuevo.';
    el.errorGeneral.hidden = false;
  } finally {
    el.generar.disabled = false;
    el.generar.textContent = 'Ya doné, generar mi tarjeta';
  }
}

/* ---------- Compartir / copiar ---------- */

function avisar(texto) {
  el.aviso.textContent = texto;
}

async function compartir() {
  try {
    await navigator.share({
      files: [estado.png.archivo],
      title: SITIO.nombre,
      text: mensajeParaCompartir(),
    });
  } catch (error) {
    if (error.name !== 'AbortError') avisar('No se pudo compartir. Descarga la imagen y compártela manualmente.');
  }
}

async function copiarImagen() {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': estado.png.blob })]);
    avisar('¡Imagen copiada! Pégala en tu chat o red social con Ctrl+V.');
  } catch {
    avisar('Tu navegador no permitió copiar la imagen. Usa "Descargar PNG".');
  }
}

async function copiarTexto() {
  try {
    await navigator.clipboard.writeText(mensajeParaCompartir());
    avisar('¡Mensaje copiado al portapapeles!');
  } catch {
    avisar('No se pudo copiar el mensaje automáticamente.');
  }
}

/* ---------- Inicio ---------- */

function renderizarPlataformas() {
  const monto = `$${DONACION.montoMinimo} ${DONACION.moneda}`;
  document.querySelectorAll('#monto-minimo, .monto-minimo').forEach((nodo) => { nodo.textContent = monto; });

  el.plataformas.innerHTML = DONACION.plataformas
    .map((p) => `
      <a class="plataforma plataforma--${escaparHTML(p.id)}" href="${escaparHTML(p.url)}" target="_blank" rel="noopener noreferrer">
        ${escaparHTML(p.nombre)}
        <span class="visualmente-oculto">(se abre en una pestaña nueva)</span>
      </a>`)
    .join('');
}

async function cargarPomkemons() {
  const lista = await obtenerPomkemons();
  el.pomkemon.innerHTML =
    '<option value="">Elige un Pomkémon...</option>' +
    lista.map((p) => `<option value="${escaparHTML(p.numero)}">#${escaparHTML(p.numero)} – ${escaparHTML(p.nombre)}</option>`).join('');

  // cafe.html?pomkemon=0025 preselecciona uno
  const preseleccion = obtenerParametro('pomkemon');
  const existe = preseleccion && (await obtenerPomkemon(preseleccion));
  if (existe) {
    el.pomkemon.value = existe.numero;
    await seleccionarPomkemon(existe.numero);
  }
}

function registrarEventos() {
  el.formulario.addEventListener('change', (evento) => {
    if (evento.target.name === 'modalidad') actualizarModalidad();
    if (evento.target.name === 'fondo') aplicarFondo(evento.target.value);
  });
  el.pomkemon.addEventListener('change', () => seleccionarPomkemon(el.pomkemon.value));

  [[el.remitente, DONACION.limites.remitente], [el.destinatario, DONACION.limites.destinatario], [el.mensaje, DONACION.limites.mensaje]]
    .forEach(([campo, limite]) => {
      campo.maxLength = limite;
      campo.addEventListener('input', () => {
        actualizarContador(campo, limite);
        if (campo !== el.mensaje) ocultarError(campo);
        actualizarVista();
      });
      actualizarContador(campo, limite);
    });

  el.formulario.addEventListener('submit', alGenerar);
  el.compartir.addEventListener('click', compartir);
  el.copiarImagen.addEventListener('click', copiarImagen);
  el.copiarTexto.addEventListener('click', copiarTexto);

  el.modal.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-cerrar-modal]') || evento.target === el.modal) el.modal.close();
  });

  // Si cafe.png aún no existe se usa una taza provisional
  const usarTazaProvisional = () => { el.taza.src = TAZA_PROVISIONAL; };
  el.taza.addEventListener('error', usarTazaProvisional, { once: true });
  if (el.taza.complete && el.taza.naturalWidth === 0) usarTazaProvisional();

  new ResizeObserver(ajustarEscala).observe(el.escala.parentElement);
}

async function iniciar() {
  el.gracias.textContent = TEXTOS.agradecimientoDonativo;
  renderizarPlataformas();
  renderizarFondos();
  aplicarFondo(DONACION.fondos[0]?.id);
  registrarEventos();
  actualizarModalidad();
  ajustarEscala();

  try {
    await cargarPomkemons();
  } catch (error) {
    console.error(error);
    el.pomkemon.innerHTML = '<option value="">No se pudieron cargar los Pomkémon</option>';
    el.errorGeneral.textContent = error.message;
    el.errorGeneral.hidden = false;
  }
}

iniciar();
