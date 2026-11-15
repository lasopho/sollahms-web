# Prepublicación controlada de agenda — 15/11/2026

Resultado: **validación técnica aprobada; publicación pendiente de autorización expresa**.
Comprobación realizada el 15/11/2026, aproximadamente 10:00 America/Santiago (CLST).
No se reconstruyó, promovió ni publicó ningún deployment. No se fusionó ninguna rama ni se asignaron dominios.

## Identidad de producción y candidato
| Campo | Producción actual | Candidato aprobado |
|---|---|---|
| Deployment | dpl_BeqmLxC1V4nmNUeE3fG4wpMXGGes | dpl_3otu6np58efcMyX4pSvBmLtjpw3a |
| SHA declarado en deployment | 69b22400e4e53ee25701449345d03bf526f74467 | cb55f8db05495009d5ce15301747ccdf0696ccbd |
| Entorno | production | staging / VERCEL_ENV=preview |
| Estado | READY | READY |
| Creación, America/Santiago | 15/11/2026 09:20:00.896 | 15/11/2026 09:53:39.726 |
| READY, America/Santiago | 15/11/2026 09:20:10.776 | 15/11/2026 09:53:49.471 |

La fecha READY no equivale necesariamente al instante de asignación del dominio; ese evento no fue consultado.
Proyecto: project-wrapp, prj_URomRRU0MAy4etGKP5gWv3Qv4DGH.
La consulta directa de Vercel por sollahms.cl identifica el deployment de producción de la tabla.

URL correcta del candidato:
https://project-wrapp-7dje1d2kz-lsandoval2-8260s-projects.vercel.app/agenda-asesoria.html#agenda-coverage-title

El enlace suministrado en la petición omitía la «s» de «8260s-projects». La identidad se resolvió por deployment ID; no se utilizó el hostname erróneo.

## Cambios posteriores
Producción continúa en el mismo deployment y SHA utilizados para construir el candidato. **No se detectaron cambios posteriores en el artefacto publicado.** Se conserva íntegra la publicación documental de referencia y no se mezcla ningún trabajo no publicado de otras ramas.
No se requiere reconstruir el candidato para integrar cambios posteriores. Si el dominio cambia antes de publicar, se debe repetir sólo la comparación incremental y detenerse si hace falta una nueva decisión o reconstrucción.

## Comparación íntegra del paquete runtime
Los dos manifiestos completos contienen 1660 entradas únicas, sin rutas añadidas ni eliminadas; 1658 entradas son idénticas. La comparación abarca configuración de salida, archivos estáticos y funciones.
La identidad de cada manifiesto se verificó por SHA-1 contra el uid devuelto por Vercel para el archivo fuente del deployment:

| Manifiesto | SHA-1 |
|---|---|
| Producción: candidate-manifest.json; base del candidato: production-manifest.json | 7c78979a38f7c7a3485e22edd50fc5d266a7dc47 |
| Candidato: candidate-manifest.json | 35e4e821fb3b356be1f44efe69da6eb8b6536756 |

La respuesta de árbol de Vercel está truncada en los recursos voluminosos; **no se utilizó ese árbol parcial para contar archivos**. El inventario completo procede de los manifiestos identificados por contenido, junto con el constructor y su log ya aprobado, que comprueban rutas, hashes y tamaños disponibles de todos los archivos antes de copiarlos a .vercel/output.

Únicas diferencias runtime:

| Ruta | SHA-1 producción | SHA-1 candidato | Bytes antes → después |
|---|---|---|---|
| agenda-asesoria.html | 7844b99af292978c8b0f836b075f99cdd45768ed | 99ea7f5fd8d6faad961050b0c6faa9b2f50f2e31 | 19628 → 19628 |
| assets/css/agenda-coverage.css | 7c4d92711b904b6f50bcbb1e0f22236ca038fa76 | 5fc811ba2fd0575fa95e5ce1659cf95791fdb234 | 894 → 1537 |

Los dos archivos descargados del dominio público durante esta comprobación coinciden byte por byte con la base utilizada.

## Revisión línea por línea
- HTML: el bloque AGENDA_COVERAGE se retira de advisory-copy y se inserta después del panel del formulario, dentro de advisory-layout. El bloque conserva exactamente sus bytes.
- Al retirar ese bloque de ambos HTML, el resto es idéntico. Esto incluye formulario, validaciones declaradas, consentimiento, privacidad, scripts, encabezado, pie, metadatos, canonical y JSON-LD.
- CSS: la cobertura ocupa grid-column:1/-1; se elimina el margen superior redundante y se permite encoger con min-width:0.
- Las tarjetas usan repeat(auto-fit,minmax(min(100%,280px),1fr)), con alturas alineadas por fila.
- Las comunas usan columns:9rem en función del ancho real, manteniendo el orden de lectura vertical por columna.
- La tarjeta con ocho o más comunas ocupa toda la fila mediante :has(li:nth-child(8)); actualmente corresponde a Región Metropolitana.
- Se restablecen bajo agenda-coverage las reglas tipográficas, de enlaces y de nota que antes heredaba desde advisory-copy.
- No se cambian paleta, fuentes, bordes, radios ni espaciados interiores de tarjetas. No se añaden breakpoints.
- [Diff HTML exacto](prepublication-html.diff).
- [Diff CSS exacto](prepublication-css.diff).

Los archivos de construcción y manifiestos difieren entre las fuentes de ambos deployments por su función de empaquetado de producción/preview. Son archivos de construcción, no cambios funcionales del sitio. La documentación y capturas de GitHub no se incorporan al paquete runtime.

## Protección de funcionalidades
Los 1658 archivos restantes conservan exactamente su contenido. No hay cambios en CRM 360, Resend, scripts de validación, endpoints ni otras funciones, SEO/GEO, sitemap, robots, otras páginas corporativas o fichas.
Se preservan 10 regiones y 32 comunas con orden y relaciones originales. El formulario, encabezado y pie también cuentan con comparación DOM idéntica en la evidencia previa.
No se enviaron formularios ni se repitieron pruebas de integración: se confirma preservación, no una nueva certificación de disponibilidad de servicios externos.

## QA visual reutilizado
La implementación, el deployment y los hashes de los recursos no han cambiado; las evidencias siguen siendo aplicables. No se repitieron las pruebas aprobadas.

| Ancho | Tarjetas por fila normal | Columnas internas RM | Resultado |
|---|---:|---:|---|
| 1440 px | 3 | 6 | Aprobado |
| 1280 px | 3 | 6 | Aprobado |
| 1024 px | 3 | 5 | Aprobado |
| 768 px | 2 | 3 | Aprobado |
| 390 px | 1 | 1 | Aprobado |
| 320 px | 1 | 1 | Aprobado |

En todos: ancho de cobertura igual al contenedor principal; sin overflow horizontal, superposiciones ni texto recortado; 10 regiones y 32 comunas.
Evidencias: [qa.json](qa.json), [preservation.json](preservation.json) y seis capturas enlazadas en [README.md](README.md).
El alcance de la prueba visual es Chrome; no se afirma una nueva validación multinavegador.

## Condición pendiente para publicar
El candidato es **preview**, no un deployment de producción preparado sin dominio. Su prepare-preview.mjs exige VERCEL_ENV=preview. Por tanto, no se debe promover directamente suponiendo que Vercel conservará sin cambios el artefacto y el entorno: una reconstrucción con variables de producción fallaría con el constructor actual.

No hay un conflicto de contenido ni necesidad de reimplementar el diseño. Hace falta, tras autorización, preparar la envoltura de producción del mismo paquete congelado, sin dominio, conservando los 1660 archivos runtime verificados. Esto no se ejecutó en esta intervención.

## Procedimiento propuesto, no ejecutado
1. Obtener autorización expresa para preparar el paquete de producción y publicarlo condicionalmente.
2. Reconsultar sollahms.cl. Exigir la base de esta tabla o comparar cualquier cambio posterior; nunca sobrescribirlo.
3. Preparar el mismo manifiesto de 1660 archivos mediante el procedimiento controlado del proyecto para target production sin asignación automática de dominios. Adaptar únicamente el constructor de empaquetado al entorno, sin cambiar archivos runtime ni configuración de proveedores.
4. Esperar READY y verificar el paquete antes de cualquier dominio: rutas idénticas al candidato aprobado, hashes idénticos en los 1660 archivos, sólo los dos cambios permitidos frente a producción. Si aparece cualquier otra diferencia, detenerse.
5. Reutilizar QA visual si los recursos siguen idénticos. Comprobar sólo la correcta entrega de la nueva versión y las diferencias de entorno necesarias, sin enviar solicitudes comerciales.
6. Sólo dentro de la autorización posterior, publicar ese deployment de producción verificado. No promover la preview directamente ni fusionar main como sustituto de este procedimiento.
7. Confirmar en sollahms.cl los dos archivos y la distribución, y que no cambió el resto del paquete. Registrar fecha, deployment y SHA; conservar dpl_BeqmLxC1V4nmNUeE3fG4wpMXGGes como referencia de reversión.

**Se detiene antes de reconstruir o publicar.** La solicitud actual exige autorización posterior; este informe no la sustituye.
