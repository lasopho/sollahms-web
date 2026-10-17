# Correcciones SEC-002 y UX-002; bloqueo SEC-001

Revisión del 17 de octubre de 2026, sobre el árbol P1. Los identificadores
corresponden al informe maestro; este lote conserva los datos comerciales y los
controles de publicación.

| Hallazgo | Antes | Resultado en el checkout revisado |
| --- | --- | --- |
| SEC-001 | No hay cuota distribuida verificable en los handlers públicos; la lectura previa de WAF devolvió 404. | Propuesta concreta en `proposals/p2-sec001-distributed-admission.md`. Continúa bloqueado por política de cuotas, servicio distribuido y lectura/configuración autorizada. No se ha instalado ni activado un limitador. |
| SEC-002 | La política reduce los tours Matterport a dos proyectos y no refleja los otros alojamientos. | Se retira ese alcance obsoleto, se describen las conexiones de los contenidos integrados y se enumeran los 17 hosts de tours encontrados en las 134 fichas versionadas. Se actualiza la fecha de revisión. |
| UX-002 | Indicador global oro con contraste 1,70:1 contra blanco y 1,64:1 contra papel. | Indicador de dos colores, blanco y verde de marca, de 3 px cada uno. El oro permanece en la identidad visual. Nav utiliza un indicador interior y la galería Leben recibe el indicador en el contenedor para evitar recortes observados en navegador. |

## Inventario y privacidad

`scripts/audit-privacy-embeds.py` lee los HTML del catálogo actual y compara sus
hosts de recorridos con los nombres visibles en la política. El resultado es
reproducible: 134 fichas, 220 elementos de embed, 18 hosts distintos, de los que
17 alojan tours y el restante corresponde a Google Maps. Matterport directo
aparece en 17 fichas; la política ya no lo limita a dos.

El auditor incluye iframes directos y `data-embed-src`; no confunde un enlace con
un recurso integrado ni toma la mera presencia de un dominio en un atributo
oculto como identificación visible del proveedor. Detecta alojamientos nuevos,
entradas obsoletas, repetidas o con texto diferente del host declarado. No
navega a esos dominios ni certifica qué solicita cada proveedor después de
cargar un frame.

Este cambio factual no determina cookies específicas, transferencias, plazos de
retención, identidades jurídicas de los proveedores o términos contractuales.
No se modifica el tratamiento descrito de RUT, datos de simulación, Resend,
Google ni los demás apartados jurídicos. El propietario debe revisar responsable,
contratos y retención; la comprobación de red de proveedores y la composición
efectivamente publicada siguen siendo verificaciones separadas. No se presenta
el checkout como una inspección de Preview/Production.

## Foco y comprobación en navegador

La combinación blanco/verde tiene una razón de contraste de más de 13:1 entre
sus componentes. Sobre las superficies declaradas blancas, papel, suaves y
verdes, al menos uno de los dos componentes supera 3:1. El indicador conserva el
contorno de sistema en colores forzados.

Chromium real, sobre un servidor de archivos limitado a loopback, comprobó
Tab/Shift+Tab y estilos computados en una ficha representativa de las 13
inmobiliarias: 39 escenarios que combinan 1440 px, 390 px y ampliación CSS de
200%. Los destinos externos y todas las API se bloquearon antes del despacho;
no se enviaron formularios. La ampliación CSS no se presenta como una prueba de
zoom nativo del navegador ni como una certificación WCAG global.

La inspección encontró dos recortes de foco: la barra con desplazamiento
horizontal y los enlaces de imágenes Leben dentro de figuras con
`overflow:hidden`. El ajuste de estos dos recortes queda en `project-detail.css`: un anillo interior
en navegación, compensación de padding/margen para conservar exactamente las
posiciones del texto, y anillo exterior en la figura Leben al recibir foco
interno. Se compararon las posiciones del texto de navegación con el CSS P1 en
los tres escenarios y resultaron idénticas. También se comprobó en Chromium el
contorno de sistema de 3 px sin sombra al emular colores forzados.

El foco de los enlaces alternativos también se corrige en la hoja compartida
`project-embeds.css`, que cubre las cuatro fichas con estilos particulares que
no cargan `project-detail.css`. No se alteran sus HTML, URLs ni manifiestos. Se verificó además el CSS nuevo con los HTML
del lote UX-001 (`46f513c`) en Chromium real: Distrito Centro, Edificio Indi e
Independencia 4745 conservaron foco visible por Tab sobre sus enlaces
alternativos y el contorno de sistema al emular colores forzados.

El navegador encontró los recursos faltantes ya documentados; no se recuperan
ni sustituyen desde terceros. Las imágenes ausentes limitan la revisión visual
del contenido, pero permiten observar el contenedor y su indicador de foco.
El zoom nativo y otras combinaciones de navegador/tecnología de asistencia
permanecen pendientes.

## Pruebas y preservación

- `python -B -m unittest discover -s tests -p test_p2_security.py -v`: 12 casos
  aprobados, con inventario real, fixtures de proveedores, negativos de
  privacidad, cálculo de contraste y controles de foco.
- `node --test tests/p2-security-preservation.test.mjs`: 2 casos aprobados.
- Regresión de contacto, reservas, contexto e idempotencia: 69 casos aprobados
  con proveedores falsos, incluidos los escenarios P1.
- El auditor de privacidad devuelve coincidencia exacta, sin hosts ausentes,
  obsoletos, repetidos o con texto incorrecto.

Las proyecciones históricas de `tests/p2-security-scope.mjs` aceptan sólo el SHA
completo anterior o el SHA completo de cada archivo revisado. Recuperan el
original mediante su Git blob inmutable y validan también su SHA-256. Los casos
negativos rechazan bytes adicionales tanto sobre el original como sobre el
sucesor. Este helper es exclusivamente de tests; no cambia guardas de release,
manifiestos históricos, workflow, packager, Vercel ni publicación.

Los 26 casos privados conservan su estado pendiente y sus exclusiones actuales.
SEC-001 continúa abierto; SEC-002 corrige la contradicción de inventario en
código, con revisión jurídica y de red pendiente; UX-002 corrige el indicador
en el alcance observado y registra los límites de QA descritos arriba.
