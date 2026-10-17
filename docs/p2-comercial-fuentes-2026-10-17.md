# P2 — capacidad financiera y vigencia comercial

Revisión del 17/10/2026, America/Santiago. Alcance: FUN-003, FUN-004, CAT-003 y SRC-003 del informe maestro. Esta revisión no cambia precios, superficies, stock, fechas de entrega ni el catálogo de referencias bancarias. Los controles productivos de publicación conservan sus bytes.

## FUN-004 — corregido

La capacidad de compra conserva su motor, parámetros, categorías A–E y resultados matemáticos. Para `tipoActivo: Comercial` o `Terreno`, cada resultado identifica el cálculo como escenario manual y advierte que no confirma acceso a crédito de vivienda ni permite aplicar las referencias CMF residenciales. El aviso también aparece cuando falta precio, tasa o UF; queda antes de los importes y de la acción para abrir el simulador. Las viviendas conservan su presentación.

No se introducen condiciones bancarias para oficinas o terrenos. La tasa sigue siendo proporcionada por el visitante. El traspaso al comparador conserva únicamente el escenario anónimo y no selecciona una institución. El comparador ya excluía las referencias CMF para esos activos; se añadió una prueba de regresión de ese comportamiento.

## FUN-003 — verificación ejecutada; renovación bloqueada

Se consultó la URL exacta del escenario oficial CMF retenido y se realizó una búsqueda acotada en el dominio oficial. El conector no pudo leer el escenario exacto. Los resultados accesibles contienen ejemplos antiguos o información general; el aviso CMF de octubre sobre tasas corriente/máxima convencional no es una oferta hipotecaria comparable y no se incorporó como tal. Esto no demuestra una caída del sitio.

- [Simulador oficial CMF](https://servicios.cmfchile.cl/simuladorhipotecario/aplicacion?indice=101.2.3).
- [Alcance publicado por CMF para el simulador](https://www.cmfchile.cl/portal/prensa/625/w4-article-49845.html).
- [Aviso CMF del 14/10/2026](https://cmfchile.cl/portal/prensa/625/w4-article-114221.html).

No se renovaron `verifiedAt`, `updatedAt`, `validFrom` ni `validUntil`. Las pruebas fijan dos referencias utilizables el 16/10, ninguna el 17/10 y ninguna en fechas posteriores. Scotia continúa excluida por antigüedad. La interfaz explica que faltan tasas verificadas y permite continuar con tasa manual, sin insinuar que la ausencia de un banco equivalga a rechazo crediticio. El snapshot UF retenido no se presenta como vigente; `/api/uf` mantiene su comportamiento existente.

Procedimiento de mantenimiento propuesto, pendiente de asignar una persona al rol de **mantenimiento comercial Sollahms**:

1. Revisar diariamente los estados con `node scripts/validate-mortgage-data.mjs`; priorizar cualquier alternativa que venza en las próximas 48 horas. Realizar revisión sustantiva semanal y antes de cualquier publicación autorizada.
2. Conservar fecha original de publicación, fecha de consulta, escenario exacto, cobertura, condiciones y evidencia oficial por institución. La consulta no rejuvenece una publicación antigua.
3. Si falta una condición comparable y actual, conservar la alternativa excluida. Solicitar por el canal del propietario el documento oficial necesario; esta fase no envía comunicaciones.
4. Validar datos y ejecutar las pruebas de capacidad/comparador antes de solicitar integración. Una persona revisora comercial debe contrastar la evidencia con los valores propuestos.

Este procedimiento no crea horarios, automatizaciones externas ni cambios de CI. El cierre comercial requiere fuentes oficiales renovadas y la asignación del responsable.

## CAT-003 / SRC-003 — avance documental; bloqueos conservados

La revisión acotada encontró nueva evidencia textual para tres proyectos del conjunto de 47 fuentes no recertificadas. No repitió el barrido de 131 URL. Ninguno de los tres queda comercialmente recertificado en su totalidad.

| Proyecto | Evidencia nueva | Decisión y dependencia |
|---|---|---|
| Distrito Centro | La búsqueda devuelve un extracto de la [página oficial de Maestra](https://maestra.cl/proyectos/distrito-centro/) que coincide con el precio de lista retenido y la dirección. Un índice no acredita respuesta directa actual ni stock. | Persisten etiquetas de superficies incompatibles entre cabecera y modelos, promociones condicionadas y entrega sin corroborar. No se generalizan áreas de un modelo a todo el proyecto ni se aplican descuentos. |
| Don Tomás | La ruta [oficial con www](https://www.crescer.cl/project/dontomas), enlazada desde la portada de la misma inmobiliaria, pudo leerse. Corrobora identidad, dirección y modelos descritos. | Conserva precio con sufijo mensual, área sin clasificación y fecha de 2025. Precio, superficies y entrega actual siguen pendientes. |
| Don Rafael | La ruta [oficial con www](https://www.crescer.cl/project/donrafael), enlazada desde la portada de la misma inmobiliaria, pudo leerse. Corrobora identidad, dirección y tipologías descritas. | Conserva precio con sufijo mensual y área sin clasificación. No permite convertir el precio en oferta de venta ni asignar una superficie útil/total. |

Se identificó además [inmobiliariacrescer.cl](https://www.inmobiliariacrescer.cl/) como **fuente candidata**, con los mismos datos de contacto y direcciones, pero precios diferentes. La coincidencia no acredita por sí sola que sea la fuente canónica autorizada: no se encontró un enlace desde el dominio retenido que lo confirme. No se importaron sus ofertas, promociones de pie, arriendos garantizados, imágenes ni stock. Se necesita confirmar su autoridad y conservar condiciones por unidad antes de proponer cambios comerciales.

Se conserva el inventario de 124 fichas con pendientes; no se cierran campos por ausencia de información. Los Alerces y Valle Los Ingleses III siguen dependiendo de originales privados actuales. El resto de fuentes sin nueva evidencia mantiene sus dependencias del informe maestro, sin interpretar errores del conector como sitios caídos.

## Validación y límites

Se añadieron ocho casos Node: conservación de matemática, avisos con datos completos/incompletos, fechas de vencimiento, transferencia anónima, exclusión CMF en activos no residenciales y preservación histórica estricta. Las proyecciones históricas existen sólo en tests, fijan ambos archivos completos por SHA-256 y el blob Git anterior, y rechazan mutaciones adicionales. No se sustituyen las pruebas del comportamiento actual por proyecciones.

La comprobación real en Chromium usó datos sintéticos, UF interceptada localmente y proveedores bloqueados en 390, 768 y 1440 px. Verificó los dos avisos visibles y sin desborde horizontal; no certifica condiciones bancarias, stock, acceso a fuentes ni una reserva real. Las simulaciones DOM son evidencia funcional separada del navegador. Los 26 casos privados de release conservan su estado pendiente.
