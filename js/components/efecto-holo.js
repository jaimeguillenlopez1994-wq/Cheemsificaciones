/**
 * Efecto de carta holográfica: las tarjetas de Pomkémon se inclinan hacia
 * el cursor y un brillo tornasolado sigue al puntero.
 * Solo con ratón y si el sistema no pide reducir el movimiento.
 */
const GIRO_MAXIMO = 9; // grados

const permitido =
  matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

let activa = null;
let cuadro = 0;

function soltar(tarjeta) {
  tarjeta.classList.remove('holo-activa');
  tarjeta.style.removeProperty('--giro-x');
  tarjeta.style.removeProperty('--giro-y');
}

function alMover(evento) {
  const tarjeta = evento.target.closest?.('.tarjeta-pomkemon:not(.tarjeta-esqueleto)');
  if (activa && activa !== tarjeta) soltar(activa);
  activa = tarjeta;
  if (!tarjeta) return;

  cancelAnimationFrame(cuadro);
  cuadro = requestAnimationFrame(() => {
    const caja = tarjeta.getBoundingClientRect();
    const x = (evento.clientX - caja.left) / caja.width;  // 0 → 1
    const y = (evento.clientY - caja.top) / caja.height; // 0 → 1
    tarjeta.classList.add('holo-activa');
    tarjeta.style.setProperty('--giro-x', `${((0.5 - y) * GIRO_MAXIMO * 2).toFixed(2)}deg`);
    tarjeta.style.setProperty('--giro-y', `${((x - 0.5) * GIRO_MAXIMO * 2).toFixed(2)}deg`);
    tarjeta.style.setProperty('--brillo-x', `${(x * 100).toFixed(1)}%`);
    tarjeta.style.setProperty('--brillo-y', `${(y * 100).toFixed(1)}%`);
  });
}

if (permitido) {
  document.addEventListener('pointermove', alMover, { passive: true });
  document.addEventListener('pointerleave', () => {
    if (activa) soltar(activa);
    activa = null;
  });
}
