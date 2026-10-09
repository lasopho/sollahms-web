# Comparador hipotecario Sollahms — guía de revisión y mantenimiento

Desarrollado para revisión en `codex/comparador-hipotecario`, desde `origin/main` (`69eb895`). No se modifica `main` ni se publican cambios en producción. El checkout original y las fichas inmobiliarias permanecen separados de este trabajo.

## Funcionalidades

- Página `/comparador-hipotecario.html`, accesible desde la navegación de inicio, proyectos, contacto, agenda y privacidad. Las fichas y `data/proyectos.json` no se modifican.
- Valor de propiedad en UF; pies de 10%, 15%, 20% y personalizado; plazos 15, 20, 25, 30 y personalizado (5–40 años).
- Tasa anual ingresada por el visitante o seleccionada de una referencia verificada. Convenciones nominal convertible mensualmente y efectiva anual explícitas, sin tasa numérica ficticia predeterminada.
- Pie, capital, financiamiento, dividendo financiero, pesos a UF fechada, intereses y suma de cuotas. Seguros y gastos aparecen separados; no se inventan costos contractuales.
- Referencias comparables con selección, detalle y orden por dividendo financiero, tasa anual efectiva equivalente, CAE dentro de grupos de cobertura y costo completo cuando exista.
- Asesoría con nombre, correo, teléfono, comentario opcional, consentimiento y contexto recalculado en el servidor. Reutiliza `/api/contact` y Resend.
- Diseño verde `#003229` y dorado `#E9C176`, adaptable, navegación móvil, teclado, etiquetas y estados accesibles; respeta reducción de movimiento.

## Fuentes y cobertura disponible

La [investigación de fuentes](cmf-fuentes-hipotecarias-2026-10-09.md) identifica URLs, fechas originales, diferencias y exclusiones. UF SII: **$41.130,94 al 09/10/2026**, contrastada con CMF. No se proyecta una UF futura ni se utiliza una UF antigua como actual.

El catálogo consulta 10 instituciones: BancoEstado, Santander, Banco de Chile, BCI, Scotiabank, Itaú, BICE/Security, Coopeuch, Internacional y Falabella. Security se identifica como marca de BICE para evitar duplicar la entidad. Una institución consultada no equivale a una oferta publicada.

Las tres referencias iniciales son **Scotiabank, Itaú y Banco de Chile**. Se aplican sólo al escenario observado de **propiedad 4.000 UF, pie 25%, crédito 3.000 UF, 20 años y área metropolitana de Santiago**. El botón para explorar el escenario CMF muestra ese ejemplo; no afirma que la propiedad del visitante reúna estas condiciones.

Scotia e Itaú incluyen desgravamen/incendio/sismo. La CAE de Chile tiene cobertura desgravamen/incendio y se presenta en un grupo separado. Los seguros y dividendos totales de Chile se omiten por discrepancias entre tabla y detalle. Ninguna de las tres referencias proporciona un costo contractual completo: la CMF excluye impuestos e inscripciones, y las primas no se suponen constantes durante todo el crédito. Por ello, el orden por costo completo está deshabilitado con los datos actuales.

La convención efectiva utilizada para las referencias CMF se confirmó por contraste con sus dividendos publicados, no sólo por interpretar su texto sobre base 360. Las campañas con subsidio, FOGAES y viviendas nuevas se documentan separadamente y no se incorporan como tasas universales.

## Actualización controlada

No se encontró una API pública documentada de ofertas del simulador CMF. Su API de indicadores, incluida UF, exige una clave y no constituye un catálogo de ofertas hipotecarias. No se implementa scraping recurrente ni acceso a endpoints internos.

1. Un responsable revisa una fuente oficial y conserva evidencia de las condiciones exactas, convención, cobertura, fecha de publicación y fecha de revisión.
2. Edita `data/hipotecario.json`: instituciones, UF y referencias. No sustituye la fecha original de publicación por la fecha de consulta. Mantiene desconocidos como `null`, no cero; `0` sólo cuando se verifica ausencia de ese cargo en el alcance declarado.
3. Una referencia de escenario exige monto, financiamiento, plazo y ubicación exactos. Los seguros, gastos y CAE no se extrapolan. Para condiciones con rangos, deben verificarse todos los requisitos aplicables; las promociones con requisitos adicionales requieren extender y probar su modelo de elegibilidad antes de incorporarlas.
4. Ejecuta el validador y las pruebas; revisa sus estados y diferencias; conserva el cambio en una rama para revisión. No publica en producción sin autorización.

```sh
node scripts/validate-mortgage-data.mjs
node --test tests/*.test.mjs
```

El validador devuelve error para un esquema inválido y enumera estados de vigencia. La interfaz excluye referencias con publicación mayor a 30 días, revisión mayor a 7 días, fechas futuras o vencimiento técnico. Estos límites son políticas internas, no vigencia contractual ofrecida por el banco. Scotia puede retirarse antes del 16/10 por antigüedad de publicación. El simulador libre continúa en UF cuando no hay referencias actuales.

La UF sólo se usa para pesos si su fecha coincide con el día vigente en Chile. El responsable debe actualizarla para cada día de operación; hasta entonces la interfaz conserva cálculos en UF y explica la conversión pendiente. Una caída o JSON inválido no produce tasas o conversiones inventadas: se ofrece reintento y simulación manual.

## Arquitectura

| Archivo | Responsabilidad |
|---|---|
| `assets/js/mortgage-engine.mjs` | Validación numérica, tasas mensuales, anualidad y UF→CLP |
| `assets/js/mortgage-data.mjs` | Esquema, fuentes oficiales, vigencia, elegibilidad y orden |
| `data/hipotecario.json` | Datos controlados con procedencia y notas institucionales |
| `assets/js/hipotecario.mjs` | Interacción, renderizado y formulario |
| `lib/mortgage-lead.mjs` | Recálculo y contexto confiable del contacto |
| `api/contact.mjs` | Transporte Resend existente, validación y manejo de errores |
| `scripts/preview.mjs` | Vista local sin dependencias adicionales, con handler real |
| `tests/*.test.mjs` | Matemática independiente, datos y solicitudes API |

No hay nuevas dependencias de ejecución ni servicios de pago. Node.js 22 o 24 soporta la sintaxis de importación JSON; el proyecto Vercel consultado usa Node 24.

## Captación y configuración

Destino existente: `contacto@sollahms.cl`. Remitente existente: `formularios@forms.sollahms.cl`. La única credencial de correo es `RESEND_API_KEY`, privada en entorno servidor. No debe incluirse en HTML, JavaScript público, JSON, Git ni URLs. `.env.example` contiene sólo nombres y `.gitignore` protege archivos de entorno y configuración local de Vercel.

La función valida tipos, tamaños, teléfono, consentimiento y antigüedad de simulación; comprueba selección contra el catálogo y recalcula montos, usando únicamente la UF confiable. La protección básica contra spam incluye honeypot, tiempo mínimo de formulario y rechazo de origen incompatible. No se presenta como un límite distribuido de solicitudes; controles de abuso adicionales pueden configurarse en la plataforma si el tráfico lo exige.

Sin clave, rechazo de Resend o respuesta sin identificador de aceptación, responde con error y conserva el formulario. Una aceptación del proveedor no prueba por sí sola la llegada a una bandeja. Las pruebas automatizadas verifican el payload y el destino con proveedor simulado. Los resultados de la prueba externa deben registrarse aparte en el informe de verificación, sin exponer credenciales.

## Cómo revisar

```sh
git switch codex/comparador-hipotecario
node --test tests/*.test.mjs
node scripts/validate-mortgage-data.mjs
node scripts/preview.mjs
```

Abre `http://127.0.0.1:4173/comparador-hipotecario.html`. Para revisar sin enviar correos reales, inicia con `RESEND_API_KEY= node scripts/preview.mjs`; el formulario devolverá un error de envío honesto. El servidor sólo escucha en loopback y bloquea archivos ocultos y rutas privadas. `PORT` permite otro puerto local. Reinicia el servidor al cambiar el catálogo o el backend, porque el JSON del servidor se importa al inicio.

1. Ingresa una tasa propia: prueba pie 10/20%, varios plazos, tasa cero y valores inválidos.
2. Explora el escenario CMF y selecciona un banco. Revisa fuente, fechas, seguros y cobertura; cambia el orden por CAE y observa los grupos.
3. Modifica monto, pie, plazo o ubicación: la asociación bancaria se retira si deja de aplicar.
4. Solicita asesoría, revisa el contexto y completa consentimiento. Comprueba errores y confirmación según el entorno de correo.
5. Revisa en móvil y teclado; accede también desde la navegación de inicio.

La [auditoría técnica](comparador-auditoria.md) documenta cálculos y correcciones. El [informe de verificación](comparador-verificacion.md) conserva las pruebas de navegador, vista previa y límites reales de entrega de correo.
