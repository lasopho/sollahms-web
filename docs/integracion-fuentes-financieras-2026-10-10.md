# Integración financiera — fuentes y supuestos del 10 de octubre de 2026

## UF y conservación de referencias

El [SII, tabla UF 2026](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm), consultado el 10/10/2026, publica **$41.136,24 para el 10/10/2026**. Se actualizan únicamente la fecha, el valor y la fecha de verificación de `data/hipotecario.json.uf`. La publicación original de las referencias hipotecarias se conserva.

El motor reutiliza `getUfStatus`: sólo una UF oficial del día vigente en Chile permite conversiones actuales a pesos. Una UF no vigente produce categoría E en el cálculo de capacidad dependiente de renta CLP. Si el archivo financiero no carga o su estructura es inválida, la interfaz bloquea la evaluación y permite reintentar, sin presentar categorías calculadas. El cálculo hipotecario en UF puede seguir disponible sin presentar pesos actuales. La conversión y clasificación deben reactivarse mediante una revisión oficial de UF para el siguiente día de uso. Esta entrega no añade una API con claves ni un proceso de extracción periódica; la [API UF CMF](https://api.cmfchile.cl/documentacion/UF.html) exige una clave y no es un catálogo de ofertas bancarias.

Las referencias CMF mantienen monto, financiamiento, plazo, ubicación, convención y fechas exactos del comparador existente. Su evidencia detallada sigue fechada el 09/10/2026: la URL detallada no pudo reabrirse hoy mediante la herramienta de investigación, por lo que no se renueva su verificación. La [página inicial del simulador CMF](https://servicios.cmfchile.cl/simuladorhipotecario/aplicacion?indice=101.2.3&maxuf=), sí accesible, declara referencia informativa, financiamiento del 75%, área metropolitana de Santiago y exclusión de impuestos e inscripciones. Una tasa o CAE de este escenario no es una oferta universal ni se extrapola a otra propiedad.

## Capacidad de pago y ahorro

[CMF Educa — capacidad de pago](https://www.cmfchile.cl/educa/621/w3-article-27502.html) recomienda considerar ingresos, gastos fijos, cuotas existentes y contingencias. Describe el 25% como recomendación de varias instituciones. Los criterios seleccionables **25% y 30%** son parámetros de exploración de Sollahms, no requisitos universales ni porcentajes de aprobación.

Se declara explícitamente esta regla conservadora:

`presupuesto mensual referencial = máximo(0, renta total × criterio seleccionado − cuotas de deudas mensuales)`.

Se muestran por separado `dividendo financiero / renta total` y `(dividendo financiero + cuotas de deudas) / renta total`. No se evalúan gastos personales no proporcionados, historial, antigüedad laboral, edad ni reglas particulares de aceptación. El dividendo financiero excluye seguros y gastos no verificados; éstos permanecen desconocidos, no cero.

El ingreso complementado sólo se suma al seleccionar Sí. [BancoEstado](https://nwm.bancoestado.cl/content/bancoestado-public/cl/es/home/home/productos-/creditos/creditos-hipotecarios.html) y [Scotiabank](https://www.scotiabankchile.cl/scotia-impulsa/tips-y-coaching-financiero/impulsando-tu-nuevo-hogar/credito-hipotecario) publican condiciones propias y diferentes. Sumar ingresos en esta herramienta no acredita aceptación por una institución.

El ahorro al horizonte es ahorro actual más aporte mensual por meses, convertido mediante la UF oficial fechada constante. Es un supuesto de comparación, no un pronóstico de UF, rentabilidad ni garantía de precio. Los meses para completar el pie se calculan desde hoy con redondeo al entero superior; cero aporte y un pie pendiente producen tiempo desconocido. Si el pie ya está cubierto, el tiempo es cero.

## Clasificación y procedencia de proyectos

| Categoría | Pie al horizonte | Presupuesto mensual |
|---|---|---|
| A: Potencialmente compatible | Cumple | Cumple |
| B: Requiere mayor ahorro | No cumple | Cumple |
| C: Requiere complementar renta o modificar financiamiento | Cumple | No cumple |
| D: Fuera del presupuesto estimado | No cumple | No cumple |
| E: Información insuficiente | Precio, tasa, UF necesaria u otro dato esencial no disponible | Sin evaluación completa |

Las fronteras exactas se comparan antes de redondear para presentación. Las categorías no son aprobaciones ni probabilidades estadísticas. La B significa insuficiencia al horizonte seleccionado, aunque la persona pueda acumular el pie más adelante.

Un precio requiere `verificacion.estadoFuente = verified`, `precioDesdeUF` en `camposVerificados`, fuente HTTPS sin credenciales y fecha real no futura con antigüedad máxima interna de 30 días. Este límite es una política de mantenimiento Sollahms y no garantiza disponibilidad comercial. El texto identifica **precio desde y fecha de verificación**, no precio contractual ni cotización de una unidad. Hay 115 precios contrastados y 33 proyectos sin precio evaluable al 10/10; éstos permanecen visibles como E. No se altera `data/proyectos.json`.

La geografía automática de las referencias CMF es conservadora: sólo comuna Santiago y Región Metropolitana con ambos campos contrastados se identifican como `santiago-metropolitana`. Una región contrastada fuera de Metropolitana devuelve `other`; las demás comunas de Metropolitana devuelven `unknown` hasta contar con evidencia precisa del alcance metropolitano requerido. Región Metropolitana completa no equivale al área urbana. No hay un precio actual del catálogo exactamente igual al escenario CMF de 4.000 UF.

## Modelo preparado para facilidades del pie

`project.paymentTerms` es opcional. `normalizeVerifiedPaymentTerms` acepta campos `reservationUf`, `downPaymentInstallments`, `installmentAmountUf`, `balloonUf`, `deferredDownPaymentUf`, `downPaymentBonusUf` y `deliveryDate`. Su objeto `verificacion` usa la misma fecha/fuente/estado/campos contrastados del catálogo. Sólo devuelve campos enumerados como verificados con tipos y valores válidos; los demás quedan `null`. La fecha de entrega publicada puede ser futura; la fecha de revisión no. Actualmente no se rellenan planes, cuotas, bonos ni fechas en este nuevo objeto `project.paymentTerms`; las fechas de entrega ya verificadas en el catálogo existente se conservan. No se presupone financiamiento directo del pie ni elegibilidad para un beneficio.

## Contraste y pruebas

El wrapper de capacidad llama al motor existente `calculateMortgage` y a las funciones de UF existentes; no incorpora un segundo motor financiero de producción. Las pruebas usan una amortización mensual iterativa independiente.

Fixture **manual, no oferta bancaria**: propiedad 4.000 UF, pie 20%, 20 años, tasa anual efectiva 4,5%; capital 3.200 UF, pie 800 UF (**$32.908.992**), dividendo **20,089257090229005 UF / $826.396,50** a UF del 10/10/2026.

En el escenario CMF exacto, el motor conserva Scotia 19,035491393 UF, Itaú 19,646640820 UF y Banco de Chile 19,269541998 UF de dividendo financiero. Cambiar precio, pie, plazo o ubicación retira las referencias. Scotia pasa a vencida el 11/10 por el límite interno de antigüedad de publicación; no basta su fecha técnica final del 16/10.

`tests/purchase-capacity.test.mjs` añade **19 pruebas**: 148 proyectos y sus 115/33 precios, procedencia y caducidad, fecha de Chile, A–E y dos restricciones simultáneas, ingreso individual/complementado, deudas y ambos ratios, 25/30%, pies/plazos/convenciones, amortización independiente, tasa cero/ausente, ahorro UF/CLP, seis horizontes, tiempo para ahorrar, fronteras exactas, UF ausente/vencida/futura, entradas inválidas/extremos, modelo del pie y geografía conservadora CMF. Con las pruebas financieras existentes pasan **39 pruebas, cero fallas**. No se realizan envíos ni reservas en estas pruebas puras.
