import { evaluateProject, validateCapacityInput } from './purchase-capacity.mjs';
import { validateDataset, getUfStatus } from './mortgage-data.mjs';
import { chileDate } from './project-finance.mjs';
import { writeMortgageHandoff, MORTGAGE_HANDOFF_KEY } from './mortgage-handoff.mjs';

const CATEGORIES = Object.freeze({
  A: 'Potencialmente compatible', B: 'Requiere mayor ahorro',
  C: 'Requiere complementar renta o modificar financiamiento',
  D: 'Fuera del presupuesto estimado', E: 'Información insuficiente',
});
const uf = value => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value) + ' UF';
const clp = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
const officialUf = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const percent = value => new Intl.NumberFormat('es-CL', { style: 'percent', maximumFractionDigits: 1 }).format(value);
const node = (tag, text, className) => {
  const item = document.createElement(tag);
  if (text !== undefined) item.textContent = text;
  if (className) item.className = className;
  return item;
};

/** Optional local search. Income, debts and savings live only in this closure. */
export function initializeCapacitySearch({ projects, onChange }) {
  const form = document.getElementById('capacity-form');
  const toggle = document.getElementById('capacity-toggle');
  const summary = document.getElementById('capacity-summary');
  const error = document.getElementById('capacity-error');
  const ufInfo = document.getElementById('capacity-uf');
  const submit = document.getElementById('capacity-submit');
  const field = id => document.getElementById('capacity-' + id);
  let dataset = null, input = null, results = new Map(), evaluationDate = null;
  let loading = null, revision = 0;
  const updateUf = () => {
    const status = getUfStatus(dataset?.uf);
    ufInfo.replaceChildren(node('span', status.usable
      ? 'UF oficial del ' + dataset.uf.date + ': ' + officialUf(status.valueClp) + '. '
      : 'UF pendiente o sin vigencia para hoy. Las conversiones a pesos y la evaluación por renta quedan pendientes. '));
    if (dataset?.uf?.source?.url) {
      const source = node('a', 'Consultar fuente oficial UF');
      source.href = dataset.uf.source.url; source.target = '_blank'; source.rel = 'noopener noreferrer';
      ufInfo.append(source);
    }
  };
  const loadDataset = async () => {
    if (loading) return loading;
    loading = (async () => {
      const response = await fetch('/data/hipotecario.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('No pudimos cargar la referencia UF. Inténtalo nuevamente.');
      const data = await response.json();
      const validation = validateDataset(data);
      if (!validation.valid) throw new Error('La referencia financiera necesita verificación.');
      dataset = data; updateUf();
    })();
    try { await loading; } finally { loading = null; }
  };
  const clearResults = () => { input = null; results.clear(); evaluationDate = null; summary.textContent = ''; onChange(); };
  const updateConditional = () => {
    const complement = field('complement').value === 'yes';
    field('second-wrap').hidden = !complement; field('second').required = complement;
    field('second').disabled = !complement;
    if (!complement) field('second').value = '';
    for (const key of ['years', 'pie', 'horizon']) {
      const custom = field(key).value === 'custom';
      field(key + '-wrap').hidden = !custom;
      field(key + '-custom').required = custom;
      field(key + '-custom').disabled = !custom;
    }
    field('savings').max = field('currency').value === 'UF' ? '1000000' : '1000000000000';
  };
  const readInput = () => {
    const number = id => field(id).value.trim() === '' ? 0 : field(id).valueAsNumber;
    const choice = id => field(id).value === 'custom' ? number(id + '-custom') : Number(field(id).value);
    return validateCapacityInput({
      incomeClp: number('income'), complementIncome: field('complement').value === 'yes',
      secondIncomeClp: number('second'), debtClp: number('debt'),
      savings: number('savings'), savingsCurrency: field('currency').value,
      monthlySavingsClp: number('monthly'), horizonMonths: choice('horizon'),
      downPaymentPercent: choice('pie'), years: choice('years'),
      annualRatePercent: field('rate').value.trim() === '' ? null : field('rate').valueAsNumber,
      rateConvention: field('convention').value, burdenPercent: Number(field('criterion').value),
    });
  };
  const evaluate = () => {
    const now = new Date();
    results = new Map(projects.map(project => [project.slug, evaluateProject(project, input, dataset, now)]));
    evaluationDate = chileDate(now);
    const counts = Object.keys(CATEGORIES).map(category => category + ': ' + [...results.values()].filter(result => result.category === category).length).join(' · ');
    summary.textContent = 'Evaluación de ' + projects.length + ' proyectos. ' + counts + '. Orden por compatibilidad en “Orden original”; los filtros y el orden por precio siguen disponibles. No representa aprobación bancaria.';
    updateUf();
  };
  const refreshDate = () => { if (input && evaluationDate !== chileDate()) evaluate(); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open)); form.hidden = !open;
    if (open) field('income').focus();
  });
  form.addEventListener('input', () => { revision += 1; updateConditional(); error.textContent = ''; if (input) clearResults(); });
  form.addEventListener('change', () => { revision += 1; updateConditional(); if (input) clearResults(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (submit.disabled) return; error.textContent = ''; submit.disabled = true;
    const submittedRevision = revision;
    try {
      const next = readInput();
      if (!dataset) await loadDataset();
      if (revision !== submittedRevision) return;
      input = next; evaluate(); onChange();
      summary.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    } catch (failure) { error.textContent = failure.message || 'Revisa los parámetros de la búsqueda.'; }
    finally { submit.disabled = false; }
  });
  document.getElementById('capacity-reset').addEventListener('click', () => {
    revision += 1; form.reset(); updateConditional(); error.textContent = ''; clearResults();
    try { sessionStorage.removeItem(MORTGAGE_HANDOFF_KEY); } catch {}
    form.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
  });
  updateConditional();
  loadDataset().catch(failure => { ufInfo.textContent = failure.message + ' Puedes navegar el catálogo normalmente.'; });
  return {
    sortProjects(list) {
      refreshDate();
      if (!input) return list;
      return list.sort((a, b) => results.get(a.slug).category.localeCompare(results.get(b.slug).category));
    },
    decorateCard(article, project) {
      refreshDate();
      const result = results.get(project.slug);
      if (!input || !result) return;
      const block = node('section', undefined, 'capacity-result capacity-result-' + result.category.toLowerCase());
      block.setAttribute('aria-label', 'Evaluación financiera de ' + project.nombre);
      block.append(node('p', result.category + '. ' + CATEGORIES[result.category], 'capacity-badge'));
      block.append(node('p', result.reason, 'capacity-reason'));
      const values = node('dl', undefined, 'capacity-metrics');
      const metric = (label, value) => { const row = node('div'); row.append(node('dt', label), node('dd', value)); values.append(row); };
      if (result.price) {
        metric('Precio desde verificado', uf(result.price.valueUf));
        metric('Revisión del precio', result.price.date);
      }
      if (result.mortgage) {
        metric('Pie necesario (' + input.downPaymentPercent + '%)', uf(result.mortgage.downPaymentUf) + (result.downPaymentClp === null ? '' : ' · ' + clp(result.downPaymentClp)));
        if (result.currentSavingsUf !== null) metric('Ahorro actual', uf(result.currentSavingsUf));
        if (result.horizonSavingsUf !== null) metric('Ahorro a ' + input.horizonMonths + ' meses', uf(result.horizonSavingsUf));
        if (result.gapUf !== null) metric('Falta para el pie al horizonte', uf(result.gapUf));
        if (result.currentGapUf !== null) metric('Tiempo desde el ahorro actual', result.monthsToSave === null ? 'No calculable sin ahorro mensual' : result.monthsToSave + ' meses');
        metric('Monto a financiar', uf(result.mortgage.principalUf));
        metric('Dividendo financiero', uf(result.mortgage.monthlyPaymentUf) + (result.monthlyPaymentClp === null ? '' : ' · ' + clp(result.monthlyPaymentClp)));
        if (result.ratio !== null) {
          metric('Dividendo / renta', percent(result.ratio));
          metric('Dividendo + deudas / renta', percent(result.burdenRatio));
          metric('Presupuesto mensual (' + input.burdenPercent + '% − deudas)', clp(result.monthlyBudgetClp));
        }
      }
      block.append(values);
      const terms = result.paymentTerms;
      if (!terms) block.append(node('p', 'Facilidades de pago del pie: pendientes de verificación.', 'capacity-note'));
      else {
        const labels = {reservationUf:'Reserva',downPaymentInstallments:'Número de cuotas del pie',installmentAmountUf:'Monto de cuota',balloonUf:'Cuotón contra escritura',deferredDownPaymentUf:'Pie diferido',downPaymentBonusUf:'Bono pie',deliveryDate:'Entrega'};
        for (const [key, label] of Object.entries(labels)) if (terms[key] !== null) metric(label, ['deliveryDate','downPaymentInstallments'].includes(key) ? String(terms[key]) : uf(terms[key]));
        const source = node('a', 'Fuente de condiciones del pie'); source.href = terms.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; block.append(source);
      }
      const simulate = node('a', result.mortgage ? 'Simular este escenario' : 'Abrir simulador', 'capacity-simulate');
      simulate.href = '/comparador-hipotecario.html?proyecto=' + encodeURIComponent(project.slug);
      simulate.addEventListener('click', event => {
        // Recheck date/price before passing a scenario; never store capacity inputs.
        try { sessionStorage.removeItem(MORTGAGE_HANDOFF_KEY); } catch {}
        const current = evaluateProject(project, input, dataset);
        if (!current.mortgage) return;
        const passed = writeMortgageHandoff({
          projectSlug: project.slug, propertyUf: current.mortgage.propertyUf,
          downPaymentPercent: input.downPaymentPercent, years: input.years,
          annualRatePercent: input.annualRatePercent, rateConvention: input.rateConvention,
          propertyValueOrigin: 'catalogue',
        });
        if (!passed) { event.preventDefault(); error.textContent = 'No pudimos conservar el escenario. Abre la ficha y utiliza su botón de simulación.'; error.scrollIntoView({ block: 'center' }); }
      });
      block.append(simulate);
      article.querySelector('.catalog-card-body').insertBefore(block, article.querySelector('.catalog-actions'));
    },
  };
}
