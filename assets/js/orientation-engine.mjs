import { calculateMortgage } from './mortgage-engine.mjs';

export const BENEFIT_REVIEW = Object.freeze({ reviewedOn: '2026-10-31', reviewUntil: '2026-11-30', maxUf: 6000, end: '2028-05-31' });
function number(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name}: ingresa un número entre ${min} y ${max}.`);
  return value;
}
/** Inverse of the shared mortgage engine. No bank approval, fees or UF forecast. */
export function orientBudget(input) {
  const income = number(input.income, 'Renta líquida', 1, 1e10);
  const debt = number(input.debt, 'Cuotas de deudas', 0, 1e10);
  const savings = number(input.savings, 'Ahorro disponible', 0, 1e12);
  const monthlySavings = number(input.monthlySavings, 'Ahorro mensual', 0, 1e10);
  const horizon = number(input.horizon, 'Meses de ahorro', 0, 600);
  if (!Number.isInteger(horizon)) throw new RangeError('Los meses de ahorro deben ser enteros.');
  const uf = number(input.uf, 'UF de referencia', 1, 1e6);
  if (![25, 30].includes(input.burden)) throw new RangeError('Selecciona el criterio 25% o 30%.');
  // Shared engine validates down payment, term, convention and rate.
  const unit = calculateMortgage({ propertyUf: 100, downPaymentPercent: input.down, years: input.years, annualRatePercent: input.rate, rateConvention: input.convention });
  const monthlyBudget = Math.max(0, income * input.burden / 100 - debt);
  const savingsUf = (savings + monthlySavings * horizon) / uf;
  const maxByPayment = monthlyBudget / uf / unit.monthlyPaymentUf * 100;
  const maxBySavings = savingsUf / (input.down / 100);
  const maxPriceUf = Math.min(maxByPayment, maxBySavings, 1_000_000);
  return { monthlyBudget, savingsUf, maxByPayment, maxBySavings, maxPriceUf, limiting: maxByPayment <= maxBySavings ? 'dividendo' : 'pie', paymentUf: maxPriceUf * unit.monthlyPaymentUf / 100, downUf: maxPriceUf * input.down / 100 };
}
export function compareQuotes({ price, down, years, convention, rateA, rateB }) {
  const scenario = { propertyUf: price, downPaymentPercent: down, years, rateConvention: convention };
  const a = calculateMortgage({ ...scenario, annualRatePercent: rateA });
  const b = calculateMortgage({ ...scenario, annualRatePercent: rateB });
  return { a, b, monthlyDifferenceUf: a.monthlyPaymentUf - b.monthlyPaymentUf, interestDifferenceUf: a.totalInterestUf - b.totalInterestUf };
}
export function benefitGuide({ price, condition, promise, novation }, today) {
  number(price, 'Precio de la vivienda', 100, 1e6);
  if (!['new', 'used', 'unknown'].includes(condition) || !['yes', 'no', 'unknown'].includes(novation)) throw new RangeError('Completa el tipo de vivienda y de crédito.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !Number.isFinite(Date.parse(today)) || new Date(today).toISOString().slice(0,10) !== today) throw new RangeError('Fecha de consulta inválida.');
  if (promise && (!/^\d{4}-\d{2}-\d{2}$/.test(promise) || !Number.isFinite(Date.parse(promise)) || new Date(promise).toISOString().slice(0,10) !== promise || promise > today)) throw new RangeError('La fecha de promesa debe ser válida y no futura; puedes dejarla vacía.');
  if (today > BENEFIT_REVIEW.end) return { state: 'review', message: 'El plazo publicado ha terminado. Verifica si existe una extensión oficial.' };
  if (today > BENEFIT_REVIEW.reviewUntil || today < BENEFIT_REVIEW.reviewedOn) return { state: 'review', message: 'La revisión de estas reglas requiere actualización. Consulta MINVU y la entidad financiera antes de evaluar este beneficio.' };
  if (condition === 'used' || price > BENEFIT_REVIEW.maxUf || novation === 'yes' || (promise && promise < '2024-12-31')) return { state: 'outside', message: 'Este escenario queda fuera de al menos una condición general revisada del subsidio a la tasa para vivienda nueva. Explora DS1, DS19 u otras alternativas con MINVU.' };
  if (condition === 'unknown' || novation === 'unknown' || !promise) return { state: 'pending', message: 'Faltan antecedentes para contrastar las condiciones generales. Confirma el tipo de vivienda, fecha de promesa y si es un crédito nuevo con la entidad financiera.' };
  return { state: 'potential', message: 'El precio, tipo de vivienda, promesa y crédito informado coinciden con las condiciones generales revisadas. Esto no confirma elegibilidad, cupos, garantía ni aprobación bancaria. La institución debe verificar todos los requisitos.' };
}
export const CHECKLIST = Object.freeze([
  { id: 'budget', title: 'Definir mi presupuesto', detail: 'Consideré renta, deudas, pie, seguros y una reserva para gastos y emergencias.' },
  { id: 'quotes', title: 'Pedir cotizaciones comparables', detail: 'Comparé mismo monto, plazo, tasa, CAE, seguros y costo total; revisé vigencia y condiciones.' },
  { id: 'benefits', title: 'Consultar beneficios y cupos', detail: 'Confirmé requisitos, llamado y compatibilidad con MINVU, SERVIU y la entidad financiera.' },
  { id: 'project', title: 'Revisar el proyecto y la unidad', detail: 'Solicité precio final, superficie, orientación, entrega, estacionamiento y bodega por escrito.' },
  { id: 'documents', title: 'Preparar mis antecedentes', detail: 'Tengo identificación y respaldos de renta y ahorro; los entregaré sólo por canales oficiales.' },
  { id: 'promise', title: 'Revisar reserva y promesa', detail: 'Revisé multas, devolución, plazos y condiciones de financiamiento con un profesional independiente.' },
  { id: 'legal', title: 'Verificar estudio de títulos y escritura', detail: 'Confirmé tasación, títulos, permisos, recepción municipal e inscripción con los profesionales responsables.' },
  { id: 'delivery', title: 'Preparar entrega y posventa', detail: 'Revisaré inventario, medidores, acta, garantías, gastos comunes y canales de posventa.' },
]);
export function cleanChecklist(value) {
  if (!Array.isArray(value)) return [];
  return CHECKLIST.map(item => item.id).filter(id => value.includes(id));
}
export const JOURNEY = Object.freeze([
  { title: 'Ordena tus números', text: 'Define para qué compras, cuándo y cuánto puedes destinar. Reserva dinero para gastos operacionales y emergencias además del pie.', action: 'Explorar mi presupuesto', href: '#presupuesto' },
  { title: 'Compara alternativas', text: 'Revisa ubicación, conectividad, superficie útil y total, orientación y fecha de entrega. Pide una cotización de la unidad: un precio “desde” no asegura stock.', action: 'Explorar el portafolio', href: '/proyectos.html' },
  { title: 'Cotiza financiamiento', text: 'Solicita ofertas para el mismo monto y plazo. Contrasta convención de tasa, CAE, seguros, gastos y vigencia. Una preevaluación no es aprobación definitiva.', action: 'Abrir el comparador', href: '/comparador-hipotecario.html' },
  { title: 'Revisa antes de comprometerte', text: 'Lee reserva y promesa con asesoría independiente. Confirma multas, devoluciones, fechas y qué pasa si el banco rechaza el crédito. No transfieras sin validar destinatario y documentos.', action: 'Consultar a Sollahms', href: '/contacto.html' },
  { title: 'Formaliza la compra', text: 'La entidad y los profesionales revisan tasación, títulos y escritura. Confirma costos, firma y seguimiento de inscripción en el Conservador de Bienes Raíces.', action: 'Revisar mis pendientes', href: '#checklist' },
  { title: 'Recibe y verifica', text: 'Revisa la vivienda y documenta observaciones en el acta. Pide manuales, garantías y canal de posventa. Confirma gastos comunes, suministros y comienzo de pagos.', action: 'Preparar mi checklist', href: '#checklist' },
]);
