# Verificación del comparador hipotecario

Revisión inicial: 9 de octubre de 2026, Chile. Actualización con prueba de correo remota y confirmación de recepción del usuario: 10 de octubre de 2026.

## Resultado comprobado

- 33 pruebas automatizadas aprobadas, 0 fallas.
- Amortización iterativa independiente en 512 escenarios; tasas nominales y efectivas, cero y casi cero, límites y entradas inválidas.
- Contraste independiente con dividendos financieros CMF: Scotia 19,04 UF, Itaú 19,65 UF y Chile 19,27 UF para crédito 3.000 UF a 20 años.
- Catálogo válido: 10 instituciones, 3 referencias vigentes el 09/10/2026; sin datos financieros ficticios.
- Contacto probado mediante `Request` HTTP y Resend simulado: destinatario, recálculo, fuentes, consentimiento, cobertura, errores y compatibilidad del formulario existente.
- Formulario remoto probado mediante sesión Vercel autenticada el 10/10: un envío ficticio autorizado, confirmación visible, Resend HTTP 200 con ID y eventos Sent/Delivered; recepción efectiva en `contacto@sollahms.cl` confirmada por el usuario mediante captura de pantalla, según su declaración en el chat.

## Navegador local

Vista local servida con `scripts/preview.mjs` y clave de correo desactivada, sin efectos externos. HTTP 200 de la página comprobado. Se usó el navegador integrado y su control de viewport.

| Recorrido | Evidencia observada |
|---|---|
| Simulación manual | 4.000 UF, pie 20%, 25 años, tasa efectiva 4%: 16,76 UF y $689.547 a UF del 09/10/2026; capital 3.200 UF y suma de dividendos 5.029,40 UF. |
| Tasa nominal | Mismo escenario, 4% nominal: 16,89 UF; etiqueta de convención diferenciada. |
| Financiamiento 90%, tasa cero | 4.000 UF, pie 10%, 30 años: crédito 3.600 UF, dividendo 10 UF, total financiero 3.600 UF, banco retirado del contexto. |
| Plazo personalizado | 7 años aceptado y resultados actualizados. |
| Entrada inválida | Propiedad −1: se retiran dividendo y alternativas; asesoría deshabilitada hasta corregir. |
| Escenario CMF | Botón de ejemplo establece propiedad 4.000 UF, pie 25%, 20 años y Santiago; aparecen 3 referencias. |
| Selección y detalle | Scotia 19,04 UF financiero; primas 1,223 UF; cuota con seguros 20,26 UF. Itaú 19,65 UF y primas 0,8927 UF. Fuente y fechas visibles. |
| CAE | Grupos de cobertura visibles; Scotia/Itaú ordenadas dentro de desgravamen/incendio/sismo y Chile en desgravamen/incendio. Costo completo deshabilitado por falta de datos. |
| Captación conectada | La selección de Scotia o Itaú se refleja en contexto, tasa, dividendo y fecha. Cambiar pie/plazo retira el banco y actualiza contexto. |
| Comentario corto y error de proveedor | Formulario con comentario «Hola» válido: devuelve error de envío por clave local ausente, conserva todos los datos y no muestra confirmación falsa. |
| Falla de datos financieros | Se reemplazó temporalmente el JSON por un objeto inválido: el simulador calculó 16,76 UF con tasa propia, ocultó pesos y referencias. Tras restaurar el archivo, «Reintentar» recuperó UF, conversión y catálogo. El archivo válido quedó restaurado. |
| Fuentes institucionales | Los 10 enlaces apuntan a URLs oficiales, no a autorreferencias vacías; fechas desde `institution.source`. |
| Navegación | Menú móvil abre y cierra con Escape. Desde inicio a 1024 px, el enlace Hipotecario navega a la página correcta. |
| Responsive | Viewports 320, 390, 768, 1024 y 1280 px: sin desbordamiento horizontal en calculadora, tarjetas y formulario. Selección y contexto de asesoría comprobados a 390 px. |

No se observaron errores JavaScript en la revisión final. Las capturas [escritorio](qa/escritorio.jpg) y [móvil](qa/movil.jpg) conservan evidencia visual. Los equivalentes CLP se calculan desde montos sin redondear; pueden diferir en algunos pesos del valor CMF que convierte cuotas previamente redondeadas.

## Despliegue y permisos

Vercel generó una vista previa de la rama `codex/comparador-hipotecario` para el commit de interfaz `1d235e2` y confirmó **READY**, origen Git, `target: null` (vista previa). La URL de esa versión es:

https://project-wrapp-6i71ae7j3-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html

Alias estable de la rama para revisar su última versión:

https://project-wrapp-git-codex-compar-79f640-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html

El proyecto confirmado es `project-wrapp`, repositorio `lasopho/sollahms-web`. Antes del push, su despliegue de producción identificado correspondía a `main` / `69eb895`. No se invocó despliegue de producción, promoción ni merge. El push se dirigió expresamente a `refs/heads/codex/comparador-hipotecario`.

La vista previa tiene protección Vercel SSO. El acceso inicial del 9/10 llegó a login; la revisión automática rechazó crear o reutilizar un enlace temporal por ampliar acceso sin autorización específica. El usuario mantuvo esa restricción y el 10/10 inició sesión normalmente en Vercel y Resend. Esa vía permitió probar el formulario remoto. La metadata posterior confirma Authentication activa (`all_except_custom_domains`); no se desactivó la protección ni se utilizó bypass.

**Contacto remoto comprobado:** preview del commit `635dc94`, deployment `dpl_55imMM7hv4bepVxnEaYKPxeL8vUm`, URL `https://project-wrapp-mbokvmnqf-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html`. Se introdujo la simulación manual ficticia de 5.000 UF, pie 20%, 25 años y tasa nominal 4,5%; se abrió asesoría, validaron campos y consentimiento, y se pulsó enviar una sola vez. La interfaz confirmó el envío. No se capturó directamente el HTTP de la aplicación; el HTTP del proveedor sí se comprobó.

Se comprobó únicamente la metadata de entorno, sin descifrar ni mostrar valores: `RESEND_API_KEY` está configurada en preview, production y development. El correo remoto utilizó la configuración existente del servidor. No se descargó ni creó una credencial; el checkout local conserva sus pruebas sin una clave real.

**Correo real:** se envió un único mensaje a `contacto@sollahms.cl` el 10/10 a las 07:51 de Chile. En Resend se observó `POST /emails` HTTP 200 con ID `01a12570-c935-7dda-a216-5c697b748382`, log `ec6855bb-9a03-4576-979b-20c7acb9d9c3`, y eventos Sent/Delivered. El registro contiene `QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90`, teléfono ficticio, escenario y resumen correctos. Página y correo omiten la conversión a pesos porque la UF del 9/10 ya no corresponde al día de la prueba.

**Recepción efectiva confirmada por el usuario:** el titular informó que recibió y abrió correctamente el mensaje en `contacto@sollahms.cl`. Confirmó el identificador `QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90` y los datos: propiedad 5.000 UF, pie 1.000 UF, crédito 4.000 UF, plazo 25 años y dividendo financiero 22,23 UF. Solicitó registrar la confirmación mediante captura de pantalla. La evidencia de recepción se atribuye al usuario: no se adjuntó una captura del buzón en ese mensaje ni el agente inspeccionó directamente el buzón. La carpeta no fue informada.

Las búsquedas anteriores en las conexiones Gmail disponibles no constituían acceso directo al buzón de contacto. Delivered acredita entrega al servidor; la confirmación posterior del titular acredita la recepción y apertura efectiva. La [prueba controlada ejecutada](prueba-correo-hipotecario.md) conserva los registros y las capturas de aplicación/Resend, sin secretos. **Prueba cerrada con un solo envío; no realizar más envíos de prueba.**

La integración GitHub devolvió `403 Resource not accessible by integration` al intentar crear un PR borrador. La rama está publicada y es revisable; no existe un PR creado por esta ejecución. Enlace de rama:

https://github.com/lasopho/sollahms-web/tree/codex/comparador-hipotecario

## Cierre técnico

No hay errores críticos conocidos en las funciones comprobadas. Los límites de comparación son deliberados por calidad de datos y se muestran en la experiencia. El flujo de correo en preview queda verificado: confirmación de aplicación, aceptación y entrega por Resend, y recepción/apertura en el buzón confirmadas por el usuario. No se ejecutaron pruebas ni publicación en Production. Todo queda listo para revisión final, sin merge.

Las fichas inmobiliarias, `data/proyectos.json`, `main` y el checkout original no fueron modificados. El trabajo conserva commits separados para motor/datos, captación, interfaz y documentación de revisión.
