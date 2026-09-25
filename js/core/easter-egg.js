/**
 * Guiño Cheems: ¡BONK! 🔨
 * Se activa escribiendo "cheems" en cualquier página (fuera de los campos
 * de texto) o con 5 clics rápidos en el logo estando en la portada.
 */
import { reproducir } from './audio.js';

const PALABRA = 'cheems';
const CLICS_NECESARIOS = 5;
const VENTANA_CLICS_MS = 1500;
const DURACION_MS = 1600;
const FRASES = [
  '¡Bonk! Menos amsiedad, más Pomkémon.',
  '¡Bonk! Hora de tomarse un café.',
  '¡Bonk! Nivéles de amsiedad: reiniciados.',
];

let escrito = '';
let clics = [];
let enCurso = false;

function bonk() {
  if (enCurso) return;
  enCurso = true;
  reproducir('bonk');

  const logo = document.querySelector('.logo');
  if (logo) {
    logo.insertAdjacentHTML(
      'beforeend',
      '<span class="bonk" aria-hidden="true"><span class="bonk__martillo">🔨</span><span class="bonk__texto">¡BONK!</span></span>',
    );
    logo.classList.add('logo--bonk');
  }

  const aviso = document.createElement('p');
  aviso.className = 'aviso-bonk';
  aviso.setAttribute('role', 'status');
  aviso.textContent = FRASES[Math.floor(Math.random() * FRASES.length)];
  document.body.append(aviso);

  setTimeout(() => {
    logo?.classList.remove('logo--bonk');
    logo?.querySelector('.bonk')?.remove();
    aviso.remove();
    enCurso = false;
  }, DURACION_MS);
}

/* Escribir "cheems" */
document.addEventListener('keydown', (evento) => {
  const destino = evento.target;
  if (destino.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (evento.key.length !== 1 || evento.ctrlKey || evento.metaKey || evento.altKey) return;
  escrito = (escrito + evento.key.toLowerCase()).slice(-PALABRA.length);
  if (escrito === PALABRA) {
    escrito = '';
    bonk();
  }
});

/* 5 clics rápidos en el logo (solo en la portada, donde el logo no necesita navegar) */
document.addEventListener(
  'click',
  (evento) => {
    if (document.body.dataset.pagina !== 'inicio' || !evento.target.closest('.logo')) return;
    evento.preventDefault(); // fase de captura: antes que el retraso de navegación del audio
    const ahora = Date.now();
    clics = [...clics.filter((t) => ahora - t < VENTANA_CLICS_MS), ahora];
    if (clics.length >= CLICS_NECESARIOS) {
      clics = [];
      bonk();
    } else if (clics.length === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  true,
);
