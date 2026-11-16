# Centro de Orientación — auditoría y mejora

**Estado actualizado:** publicado el 16/11/2026 a las 12:29:56.873, America/Santiago. Deployment `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`. [Informe productivo y QA público](production-release-20261116/INFORME-PUBLICACION.md).

El cuerpo siguiente documenta la auditoría y entrega de Preview anterior a la autorización productiva. La copia exacta de aquel informe se conserva en `production-release-20261116/history/INFORME-AUDITORIA-preview.md` y en el commit 42ee1d1.

La página queda corregida y validada en escritorio, notebook, tablet y móvil. El panel «Tu punto de partida» vuelve a tener títulos, ayudas y acción legibles. Los seis pasos conservan sus controles originales, sus nombres y sus eventos. Las tres herramientas incorporan reinicio, y la UF manual queda protegida frente a respuestas tardías.

- [Preview privada con SSO](https://project-wrapp-9uq44evdh-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html).
- [PR #30 en Draft](https://github.com/lasopho/sollahms-web/pull/30).
- Rama: `codex/centro-auditoria-integral-20261116`.
- Commit de implementación servido por Preview: `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`.
- Checkout independiente: `/private/tmp/sollahms-centro-audit-20261116`.

## Base productiva comprobada

Antes de modificar se consultaron ambos aliases y el deployment productivo. `sollahms.cl` sirve `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`, con source SHA `534bf362b8960e275f5b8b42b5c786027906a4cb`. El HEAD remoto de su rama era `dffbd310fe0cb34d952bda493140504ec4e1241c`: sólo añade dos commits documentales, sin cambios de sitio. Ese HEAD es la base de esta rama y del PR.

El `main` remoto (`86e200ec191b38af355061e21bc0fc1e549cce3b`) es anterior y no se utilizó para reconstruir. Se leyeron `AGENTS.md`, `NEXT-PROMPT.md`, la documentación del Centro y Contacto, identidad, sistema visual, tema, script y helper de desvanecimiento. Los PR y ramas activos están registrados en [active-pull-requests.json](active-pull-requests.json) y [remote-branches.tsv](remote-branches.tsv). [provenance.json](provenance.json) conserva el detalle.

El artefacto se copia desde el paquete certificado del Production B9HL. Sólo se superponen tres archivos públicos: HTML del Centro, CSS aislado y controlador aislado. Se preservan 1.657 de 1.660 archivos idénticos, los 147 HTML salvo el Centro, las 131 fichas, Contacto publicado, los recorridos eliminados, siete funciones/57 archivos y configuración v3. No se ejecutó el empaquetador histórico ni generadores generales.

## Incidencias y justificación

| ID | Prioridad | Diagnóstico reproducido | Corrección |
|---|---|---|---|
| F01 | Alta | El tema compartido carga después del CSS local y aplica `.result-panel { background:var(--s-hero) }`. El Centro conserva texto verde oscuro, ayudas y CTA oscuros sobre ese fondo oscuro. | Regla específica `#presupuesto .result-panel`, panel blanco con acento dorado, figura verde, resultado suave y acción clara. No se modifica el tema compartido. |
| F02 | Alta | En la última etapa, `Siguiente` deshabilitado hereda texto claro de `.journey .text-button:disabled` sobre la superficie clara del tema. Contraste medido 1,19:1 en los cinco anchos. | Mismos botones y eventos; estados con borde y texto explícito. Contraste deshabilitado 5,87:1, opacidad 1. |
| F03 | Media | `<main data-scroll-static>` excluye toda la página del sistema compartido. | Se retira la exclusión global y se marcan estáticos formularios, finanzas, resultados, navegación, enlaces y controles. El script compartido queda intacto. |
| F04 | Media | No existen controles de reinicio de las tres herramientas. | Botones nativos `type=reset` restauran valores aprobados y el resultado inicial. No se guardan escenarios. |
| F05 | Media | La protección UF tardía compara sólo el valor anterior/final; una edición que vuelve al mismo número puede reclasificarse como oficial. | Contador de revisiones de UF; una respuesta tardía respeta la intervención manual incluso al volver al mismo valor. |
| F06 | Media | El foco de la ruta puede desplazar inesperadamente la pantalla, especialmente al usar Anterior/Siguiente en móvil. | Se mantiene foco accesible en el título con `preventScroll`, y se limita defensivamente el índice a las seis etapas. |
| V01 | Media | Tipografías corporativas declaradas sólo bajo alias del encabezado; el cuerpo depende de fallback. | Se registran Manrope e Inter desde los archivos locales ya existentes. Lectura Inter y títulos Manrope. |
| V02 | Media | Cuatro rutas iniciales dentro de una grilla de tres columnas generan una tarjeta huérfana. | Composición editorial 2×2 con separadores y una columna en móvil, mismos textos y destinos. |
| V03 | Media | Escenario largo, sin agrupación de lectura y con dos columnas estrechas en tablet. | Tres grupos: renta/ahorro, condiciones del crédito y referencia UF. Paneles apilados hasta 900 px; métricas adaptables y botones legibles a 320 px. |

La observación «Anteriores en blanco» se investigó sin sustituir controles. El formulario de presupuesto tiene una sola etapa; no existe un control literal «Anteriores» en producción. Los botones Anterior/Siguiente están en «De la primera idea a tus llaves». Sus textos y eventos sí estaban presentes y funcionaban. El defecto confirmado era el contraste del estado terminal de Siguiente, además del bloque de resultados oscuro. No se atribuye el problema a eventos inexistentes ni a pérdida de valores no reproducida.

La prueba de reinicio detectó una incidencia durante esta intervención: una microtarea del evento `reset` podía restaurar la UF antes de que Chrome terminara su restauración nativa, borrándola después. Se corrigió con `requestAnimationFrame`, posterior al reinicio nativo y antes del siguiente pintado. La prueba focalizada y la matriz final de Preview aprobaron. Los diagnósticos anteriores se conservan en `attempts/`.

## Comparación visual

| Ancho | Antes: panel | Después: panel | Página completa Preview |
|---|---|---|---|
| 1440 | [Captura](before/punto-partida-1440.png) | [Captura](after/punto-partida-1440.png) | [Captura](preview/page-1440.png) |
| 1024 | [Captura](before/punto-partida-1024.png) | [Captura](after/punto-partida-1024.png) | [Captura](preview/page-1024.png) |
| 768 | [Captura](before/punto-partida-768.png) | [Captura](after/punto-partida-768.png) | [Captura](preview/page-768.png) |
| 390 | [Captura](before/punto-partida-390.png) | [Captura](after/punto-partida-390.png) | [Captura](preview/page-390.png) |
| 320 | [Captura](before/punto-partida-320.png) | [Captura](after/punto-partida-320.png) | [Captura](preview/page-320.png) |

Antes y después del estado final móvil: [antes](before/recorrido-final-390.png), [después](after/recorrido-final-390.png). Resultados calculados en los cinco anchos: `accessibility/point-calculated-*.png`. Las capturas anteriores usan exactamente los bytes congelados de producción. Las capturas de Preview utilizan respuestas reales autenticadas de ese deployment, cargadas en Chrome mediante el transporte de lectura nativo. Las comparaciones usan movimiento reducido para poder juzgar el contenido completo.

## Resultados funcionales

[preview/results.json](preview/results.json) registra **78 comprobaciones en Chrome**: 15 en 1440, 15 en 1024 y 16 en cada uno de 768, 390 y 320. Todos aprobaron:

- Renta/ahorro/pie/plazo/convenciones, validación vacía, invalidación y recálculo.
- Presupuesto contrastado con motor preservado; caso independiente de tasa cero: renta $2.000.000, deudas $100.000, criterio 25%, UF manual $40.000, 25 años, pie 20%, ahorro $100.000.000 → 3.750 UF y dividendo de 10 UF. Valores sintéticos de QA.
- Seis etapas: diez transiciones adelante/atrás, seis selecciones directas, estados extremos, foco y conservación de todos los campos/resultados.
- Cotizaciones con tasa cero y diferencia negativa, mensajes de datos modificados y reinicio.
- Beneficios con condiciones revisadas y escenario fuera de condiciones; reinicio sin conceder elegibilidad.
- Ocho marcas del checklist, progreso, opt-in que almacena sólo IDs, descarga real `.txt` y borrado.
- Todos los desplegables, menú móvil, Escape/cierre, RUT inválido/válido, consentimiento y orden de foco.
- Ausencia de overflow, controles vacíos, campos sin etiqueta o datos financieros en almacenamiento/URL.

También aprobaron **53/53 pruebas** de orientación, motores y UF. Sus transportes están inyectados con fixtures sintéticos; no se enviaron mensajes reales a Resend, CRM ni endpoints comerciales. El test existente `orientation-20261031.mjs` se volvió a ejecutar después de corregir el reinicio: 18/18.

La prueba UF de respuesta tardía comprueba edición manual, edición que vuelve al mismo valor y restauración de la UF oficial del día al reiniciar. El navegador usa fixtures explícitos del contrato UF para no depender de una cifra variable ni transmitir escenarios. Un GET independiente al endpoint real respondió HTTP 200 con UF oficial vigente del 16/11/2026; se documenta en `remote-verification/uf-get.json` y no se confunde con estos fixtures.

## Accesibilidad y movimiento

[accessibility/results.json](accessibility/results.json): **80 contrastes medidos**, todos aprobados; mínimo 5,68:1 en las superficies revisadas. Botones activos: 14,11:1; deshabilitados: 5,87:1. Se ejecutaron Enter, Tab, estados extremos, foco en título y nombres accesibles. Se incluyen snapshots ARIA de la etapa final.

El navegador registró 35 grupos editoriales del desvanecimiento compartido: opacidad 1 en el área de lectura y 0,353 en el borde muestreado, sin grupos anidados ni controles/resultados dentro de ellos. Movimiento reducido elimina los grupos y la impresión mantiene el texto visible. No se modificó `scroll-presence.js`, su helper ni el tema compartido.

La matriz final registra cero excepciones JavaScript y cero recursos propios fallidos. El único recurso externo bloqueado deliberadamente en Preview es la barra de comentarios de Vercel, ajena al sitio. El diagnóstico adicional registró cero errores inesperados de consola, 15 anclas activadas, cuatro formularios correctamente deshabilitados sin JavaScript y la alternativa a Contacto. El desplazamiento inicial acumulado observado fue 0,00049 durante la carga local de fuentes; no es una medición de Core Web Vitals de campo. Detalle en `diagnostics.json`. Esta revisión es accesibilidad básica con comprobaciones específicas, no una certificación WCAG completa.

## Enlaces, contenido financiero y SEO

[link-audit.json](link-audit.json): 58 anclas, 34 destinos HTML únicos, 23 destinos/fragmentos locales válidos incluidos los de las seis etapas; diez referencias externas con respuesta 200. La fuente CMF conserva su URL aprobada HTTPS pero su servidor redirige a HTTP: dependencia externa registrada, sin alterar fuente ni cálculos. Los enlaces de correo/WhatsApp se inspeccionaron sin iniciar conversaciones.

No se modificaron tasas, parámetros, fórmulas, fechas de vigencia, reglas de beneficios, valores desconocidos, advertencias, servicio UF ni fuentes oficiales. Los beneficios conservan su ventana de revisión al 30/11/2026 y su cierre automático posterior. No se presenta un resultado como aprobación bancaria ni se duplican descuentos.

Preservación exacta verificada de title, description, canonical, Open Graph, JSON-LD, identidades, cuatro formularios y 46 controles originales. Los nuevos subtítulos H4 agrupan campos sin alterar H1/H2/H3 aprobados. Los textos aprobados se conservan; las adiciones son ayudas estructurales y nombres de reinicio. [source-preservation.json](source-preservation.json) contiene las pruebas y hashes de 28 recursos protegidos.

## Paquete, seguridad y entrega

Inventario candidato SHA256: `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`. [candidate-manifest.json](candidate-manifest.json) contiene las 1.660 rutas, tamaños, SHA1 y SHA256. [stage-receipt.json](stage-receipt.json) contiene los tres deltas. [modified-files.json](modified-files.json) y [SHA256SUMS](SHA256SUMS) describen la intervención y sus evidencias.

La verificación remota aprobó 26/26 controles: las 1.660 rutas/SHA1 coinciden con el candidato, siete funciones registradas y acceso anónimo 302 hacia SSO con TLS válido. Ambos aliases conservan B9HL y sus timestamps; los ajustes se comprobaron iguales antes/después. No se cambiaron dominios, secretos, integraciones, Resend, CRM 360 ni protecciones. No hubo leads, correos, reservas ni datos comerciales reales. `vercel.json` incorpora únicamente la regla que desactiva despliegue automático de nuestra rama; no se despliega ese archivo en el overlay público. El PR permanece Draft y su base es la rama publicada de Contacto, no el main histórico. No se realizaron fusiones.

La primera llamada CLI fue rechazada por usar `--skip-domain` con Preview; no generó deployment. Se confirmó la lista remota vacía, se retiró esa opción y se creó una sola Preview. [preview-validation-attempt.json](preview-validation-attempt.json) conserva ese diagnóstico. No se utilizó `--prod`, `promote`, `--verify`, sharelink ni cambio de protección para este trabajo.

La autorización productiva posterior ya fue recibida y ejecutada. Se promovió el Production certificado y el QA público aprobó; [informe y recibos](production-release-20261116/INFORME-PUBLICACION.md). El [siguiente prompt vigente](production-release-20261116/SIGUIENTE-PROMPT.md) conserva el cierre y evita repetir una publicación ya completada.
