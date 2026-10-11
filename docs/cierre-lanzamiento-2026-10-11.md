# Sollahms — cierre de preparación para lanzamiento

Fecha: **11 de octubre de 2026**. Rama: `codex/integracion-financiera-sollahms`.

La versión preparada conserva la cartera aprobada en `e7afe04`: **144 proyectos, 16 fichas Ingevec y 128 de otras inmobiliarias**. Vicuña Mackenna 7589 mantiene Etapa 1 y Etapa 2 como entradas comerciales diferenciadas dentro de una ficha. No se modifica la composición del catálogo.

**Preview protegida:** la URL y el identificador del despliegue se registran en el comprobante final de entrega. El contenido se ha contrastado contra un build publicable preparado sin desplegar en Production.

## Alcance contractual del material gráfico

Se contrastaron los [términos oficiales chilenos de IRIS](https://iris.yapo.cl/terminos-y-condiciones), actualizados según su publicación el 04/08/2023, en particular las cláusulas «Publicidad sobre el Proyecto» y «Entrega de materiales». La evidencia oficial se combina con la declaración expresa del titular sobre la procedencia Yapo/IRIS de los brochures y el uso comercial de Sollahms.

Los controles habilitan exclusivamente la promoción web en **`https://sollahms.cl`** de los **22 PDF identificados**: cinco AJ Urbana y diecisiete Ingevec, incluyendo ambas etapas de Vicuña Mackenna 7589. No se exige una licencia individual adicional para imágenes o planos comprendidos en ese alcance. No se afirma haber verificado una cuenta personal, una firma individual ni un contrato particular distinto de los términos disponibles y la declaración del titular.

Se mantienen la correspondencia de cada recurso con su proyecto, la revisión gráfica y los avisos sobre imágenes, planos y superficies referenciales. Los brochures complementan las fichas; no sustituyen los precios públicos, las condiciones autorizadas, la disponibilidad ni las fechas comerciales vigentes.

Contratos, originales PDF, candidatos no seleccionados, información interna y condiciones confidenciales permanecen fuera del directorio público. La trazabilidad contractual se conserva internamente y no aparece en las fichas. La autorización de redistribución de recursos en un repositorio Git público continúa pendiente; el permiso para promocionar proyectos en la web no se extiende artificialmente a ese canal.

La revisión de texto mediante OCR abarcó los **269 recursos seleccionados**, con **cero hallazgos de contenido interno en ese control**. La comprobación visual de los encabezados de los 64 planos Ingevec complementó el análisis. El comprobante detallado permanece privado.

## UF oficial automática

Se incorporó el endpoint read-only `/api/uf`, que consulta directamente la tabla anual pública del **Servicio de Impuestos Internos**, sin proveedor pagado, token, clave de API ni servicio adicional de indicadores. La consulta verificada para el 11/10/2026 obtuvo **$41.141,53 por UF** en la [fuente oficial SII](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm).

La fecha se determina en `America/Santiago`. La respuesta debe coincidir en sus tablas mensual y anual para el día exacto. El servicio limita tamaño y tiempo de respuesta, rechaza redirects y URLs del visitante, comparte consultas concurrentes y conserva el dato en memoria hasta una hora dentro del mismo día. La fecha anterior se invalida al cambiar el día en Chile.

Ante errores, el servicio devuelve una respuesta general con recuperación automática y pausa breve de reintento. El navegador actualiza periódicamente, al volver a la pestaña y al evaluar el buscador. Puede conservar un dato oficial ya verificado **del mismo día** durante un fallo transitorio; nunca convierte pesos con una UF antigua o futura. Los importes CLP ingresados no se pierden.

El buscador por renta y pie mantiene sus cálculos, horizonte, pie y clasificación A–E. Sin UF vigente se explica la ausencia y se omiten las conversiones, conservando los cálculos que pueden realizarse en UF. El comparador sigue trabajando en UF y muestra la fecha y fuente de los equivalentes en pesos. El servidor recalcula las consultas financieras sin confiar en una UF suministrada por el visitante.

**Las tasas y ofertas bancarias no se actualizan automáticamente por este cambio.** Conservan su proceso de verificación, vigencia y alcance; cuando no existe una referencia aplicable, sigue disponible la simulación con la tasa ingresada por el visitante.

## Auditoría de los builds y regresión

La ejecución completa aprobó **249 pruebas Node, 33 pruebas Python y cuatro validadores**, sin omitir pruebas para completar el cierre. Las pruebas de formularios utilizaron proveedores simulados, sin mensajes ni reservas reales.

La auditoría independiente contrastó el build publicable offline y la Preview equivalente:

| Control | Resultado |
|---|---:|
| Proyectos del catálogo | 144 |
| Fichas Ingevec | 16 |
| Páginas HTML | 151 |
| Portadas del lote AJ Urbana/Ingevec | 21 |
| Imágenes seleccionadas del lote | 127 |
| Planos seleccionados ampliables | 142 |
| Recursos gráficos seleccionados, con hash exacto | 269 |
| Referencias locales inspeccionadas | 6.183 |
| Canonical correctos de fichas | 144 |
| URL únicas del sitemap publicable | 150 |
| Errores de la auditoría independiente | 0 |
| Archivos raster decodificados completamente | 770 |

Se verificaron archivos, imágenes, planos, portadas, enlaces, anclas, navegación contextual, módulos financieros y exclusión de documentos privados. Ambos directorios contienen los mismos recursos y contenido comercial. Las únicas diferencias deliberadas de revisión son el bloqueo de indexación de la Preview y el aviso de formularios de sólo revisión; el bloqueo de mensajes y reservas se mantiene también en el servidor de Preview.

Las validaciones y regresiones incluyen catálogo, filtros, buscador CLP, comparador en UF, recuperación de UF, consultas, agenda y compatibilidad móvil. Se probaron $5.000.000, $20.000.000 y $100.000.000 de ahorro, el aviso de UF ausente y su recuperación. El comparador mantuvo el resultado de 13,88 UF para 3.000 UF, 20% de pie, 25 años y tasa efectiva anual de 5%; sin desbordamientos a 1440, 768 y 390 px. Los mapas y recorridos existentes se conservan con sus enlaces oficiales y listas permitidas de visores. La disponibilidad futura de todos los servicios externos no queda garantizada por una auditoría de archivos.

Las reservas y la disponibilidad rechazan orígenes ajenos antes de leer el cuerpo o acceder al proveedor. Se conservaron las validaciones de método, formato, tamaño, campos, horarios y errores generales. Se añadieron las cabeceras `nosniff`, política de referencias `strict-origin-when-cross-origin`, `SAMEORIGIN` y una CSP para URL base, objetos y sitios que pueden enmarcar Sollahms, compatible con mapas, recorridos y scripts existentes.

## Reproducción del despliegue público

El archivo fuente privado incluye todos los derivados seleccionados y las fuentes de la aplicación necesarias para reconstruir el despliegue. Excluye PDF originales, contratos, secretos y candidatos. Su SHA-256 aprobado es:

```text
0a12368ef521e4a6302af2658d6744431bffe7b3391cb91da2b73b88baba1e65
```

Los **165 recursos Ingevec siguen excluidos de Git**. Un build publicable ordinario desde un checkout que no los contiene debe fallar; no puede sustituir silenciosamente las portadas, galerías o planos aprobados por placeholders. El futuro despliegue autorizado debe usar el archivo fuente privado exacto, o un transporte equivalente verificado que preserve sus recursos y respete el alcance contractual. La revisión actual no inventa autorización para redistribuir los archivos en Git público.

El empaquetador reconstruye y compara los perfiles Preview y publicable antes de aceptar el paquete. Esta verificación prepara un despliegue reproducible; no efectúa una promoción ni publica Production.

Una segunda ejecución independiente reprodujo exactamente ese SHA-256: **964 archivos fuente**, 269 recursos seleccionados y un archivo de **138.632.917 bytes**, con cobertura contractual y equivalencia publicable verificadas. El comprobante de reproducción permanece privado.

## Pendientes comerciales y mejoras opcionales

Diez fichas aún no incluyen `og:image`; es una mejora opcional de las vistas compartidas en redes sociales y no afecta las imágenes visibles, los canonical ni la navegación. No se añaden enlaces `hreflang` a versiones inglesas que todavía no existen.

Se mantienen como pendientes los precios, estado y entrega sin evidencia vigente en Los Alerces y Valle Los Ingleses III, así como la disponibilidad, orientación y condiciones por unidad o etapa no confirmadas. Los avisos referenciales y las diferencias documentales conocidas permanecen registrados. Estos datos no se sustituyen por cifras históricas del brochure ni por estimaciones.

**No se ha hecho merge, no se ha modificado `main` ni otras ramas y no se ha publicado ni alterado Production.** El siguiente paso requiere que el titular revise la Preview y autorice expresamente la integración y el despliegue.
