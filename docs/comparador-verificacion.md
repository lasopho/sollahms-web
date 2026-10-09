# Verificación del comparador hipotecario

Fecha: 9 de octubre de 2026, Chile.

## Resultado comprobado

- 33 pruebas automatizadas aprobadas, 0 fallas.
- Amortización iterativa independiente en 512 escenarios; tasas nominales y efectivas, cero y casi cero, límites y entradas inválidas.
- Contraste independiente con dividendos financieros CMF: Scotia 19,04 UF, Itaú 19,65 UF y Chile 19,27 UF para crédito 3.000 UF a 20 años.
- Catálogo válido: 10 instituciones, 3 referencias vigentes el 09/10/2026; sin datos financieros ficticios.
- Contacto probado mediante `Request` HTTP y Resend simulado: destinatario, recálculo, fuentes, consentimiento, cobertura, errores y compatibilidad del formulario existente.

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

La vista previa tiene protección Vercel SSO. El acceso normal en el navegador integrado llegó a la pantalla de login. La revisión automática rechazó la herramienta que crearía o reutilizaría un enlace temporal de autenticación por ampliar acceso a una vista protegida sin autorización específica. No se desactivó la protección ni se ejecutó un método indirecto para saltar ese rechazo.

**Pendiente:** verificar navegación y función de contacto en el despliegue remoto tras disponer de una sesión Vercel autorizada. El usuario confirmó que debe mantenerse la protección y no autoriza un enlace temporal de acceso sin autenticación. El estado READY comprueba el despliegue, no el envío remoto ni la recepción de correo.

Se comprobó únicamente la metadata de entorno, sin descifrar ni mostrar valores: `RESEND_API_KEY` está configurada en preview, production y development. En el checkout local no hay una clave disponible y el servidor de prueba la desactivó expresamente. No hace falta crear una credencial nueva para la vista previa; falta el acceso autorizado para probarla.

**Correo:** las pruebas simuladas y el error local están comprobados. No se envió ningún correo real durante esta ejecución y no se confirmó llegada a `contacto@sollahms.cl`. Esa recepción debe verificarse mediante una prueba técnica identificada y comprobación del destino una vez autorizado el acceso remoto. Nunca debe confundirse un éxito simulado o aceptación del proveedor con entrega efectiva a la bandeja.

La [prueba controlada preparada](prueba-correo-hipotecario.md) conserva campos ficticios, un identificador único, un único envío al destino autorizado y pasos exactos para verificar aplicación, aceptación Resend, entrega al servidor y recepción en el buzón. La autorización de ejecución ya consta; faltan las sesiones normales. Las comprobaciones de acceso realizadas en esta continuación llegaron a login de Vercel y Resend. No hay envío externo ni un resultado de aceptación/recepción que pueda declararse exitoso.

La integración GitHub devolvió `403 Resource not accessible by integration` al intentar crear un PR borrador. La rama está publicada y es revisable; no existe un PR creado por esta ejecución. Enlace de rama:

https://github.com/lasopho/sollahms-web/tree/codex/comparador-hipotecario

## Cierre técnico

No hay errores críticos conocidos en las funciones comprobadas. Los límites de comparación son deliberados por calidad de datos y se muestran en la experiencia. Permanecen pendientes las verificaciones remotas descritas; el componente de correo no se declara verificado en producción ni en una bandeja real.

Las fichas inmobiliarias, `data/proyectos.json`, `main` y el checkout original no fueron modificados. El trabajo conserva commits separados para motor/datos, captación, interfaz y documentación de revisión.
