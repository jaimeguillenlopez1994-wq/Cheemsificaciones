/**
 * Paginador de "Ver más": muestra los primeros N elementos y añade N
 * más en cada clic del botón ovalado rojo, que se oculta al llegar al final.
 *
 *   const paginador = new Paginador({
 *     contenedor, boton, porPagina: 12,
 *     renderizar: (item) => crearTarjetaPomkemon(item),
 *     alActualizar: ({ visibles, total }) => { ... },
 *     vacio: 'No hay resultados.',
 *   });
 *   paginador.establecer(lista);   // reinicia a la primera página
 */
import { escaparHTML } from '../core/utils.js';

export class Paginador {
  constructor({ contenedor, boton, porPagina, renderizar, alActualizar = () => {}, vacio = 'No hay elementos para mostrar.' }) {
    this.contenedor = contenedor;
    this.boton = boton;
    this.porPagina = porPagina;
    this.renderizar = renderizar;
    this.alActualizar = alActualizar;
    this.vacio = vacio;
    this.items = [];
    this.visibles = 0;

    this.boton?.addEventListener('click', () => this.verMas());
  }

  /** Reemplaza la lista completa y vuelve a mostrar solo la primera página. */
  establecer(items, { vacio } = {}) {
    this.items = items;
    this.visibles = 0;
    this.contenedor.innerHTML = '';
    if (vacio !== undefined) this.vacio = vacio;

    if (items.length === 0) {
      this.contenedor.innerHTML = `<p class="estado estado--vacio">${escaparHTML(this.vacio)}</p>`;
      this.contenedor.classList.add('sin-resultados');
      this.actualizar();
      return;
    }

    this.contenedor.classList.remove('sin-resultados');
    this.verMas();
  }

  /** Añade la siguiente página al final del contenedor. */
  verMas() {
    const siguientes = this.items.slice(this.visibles, this.visibles + this.porPagina);
    if (siguientes.length === 0) return;

    this.contenedor.insertAdjacentHTML('beforeend', siguientes.map(this.renderizar).join(''));
    this.visibles += siguientes.length;
    this.actualizar();
  }

  get total() {
    return this.items.length;
  }

  get hayMas() {
    return this.visibles < this.items.length;
  }

  actualizar() {
    if (this.boton) this.boton.hidden = !this.hayMas;
    this.alActualizar({ visibles: this.visibles, total: this.total });
  }
}
