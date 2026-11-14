import { splitCapital } from './inversion-empresas-engine.mjs';
const price = document.getElementById('empresa-precio');
const percent = document.getElementById('empresa-porcentaje');
const error = document.getElementById('capital-error');
const equity = document.getElementById('capital-propio');
const debt = document.getElementById('capital-deuda');
const format = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
function update() {
  price.removeAttribute('aria-invalid'); percent.removeAttribute('aria-invalid');
  try {
    for (const field of [price, percent]) {
      if (field.value.trim() === '' || !field.validity.valid) { field.setAttribute('aria-invalid', 'true'); throw new RangeError(field === price ? 'Ingresa un precio entre 0,01 y 100.000.000 UF, con hasta dos decimales.' : 'Ingresa un porcentaje entre 0 y 100, con hasta dos decimales.'); }
    }
    const result = splitCapital(price.valueAsNumber, percent.valueAsNumber);
    equity.textContent = format.format(result.equity) + ' UF'; debt.textContent = format.format(result.debt) + ' UF';
    error.hidden = true; error.textContent = '';
  } catch (e) {
    equity.textContent = '—'; debt.textContent = '—'; error.textContent = e.message; error.hidden = false;
  }
}
price.addEventListener('input', update); percent.addEventListener('input', update); update();
