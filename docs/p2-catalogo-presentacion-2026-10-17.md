# CAT-005, PERF-001 y SEO-001: presentación del catálogo

La corrección mantiene los 134 objetos comerciales de `data/proyectos.json` sin cambios: 104 con precio y 30 sin precio. No incorpora proyectos, cotizaciones, recursos ni una nueva verificación comercial.

## Comportamiento

| Hallazgo | Antes | Después |
| --- | --- | --- |
| CAT-005 | Las tarjetas no mostraban la fecha ni las condiciones retenidas del precio. | Cada tarjeta muestra la fecha de `commercialSource.verifiedOn` o `verificacion.fecha`, un aviso de confirmación y un enlace contextual a la ficha. Se conservan las notas de Sento, sus unidades, descuentos y exclusiones; Nórdico muestra la condición documentada de unidad 101 y exclusión de estacionamiento/bodega sólo mientras coincidan el precio y la revisión retenidos. |
| PERF-001 | Las cinco cubiertas León solicitaban el archivo principal sin `srcset`. | Reutilizan 16 variantes distintas y sus cinco principales existentes. `src` conserva el original; `sizes` corresponde al grid y las fuentes sólo se aplican si coinciden proyecto e imagen principal. Se mantienen `lazy`, el placeholder al fallar y el acceso a la ficha. |
| SEO-001 | Sin JavaScript o con fallo de `fetch`, no había enlaces de fichas en el catálogo. | El HTML incluye un directorio accesible con las mismas 134 identidades y rutas, sin precios, imágenes ni documentos privados. Se oculta después de renderizar las tarjetas; permanece disponible sin JavaScript o si falla la carga. |

La fecha mostrada es la retenida en la evidencia, no la fecha de este cambio. Las condiciones de Nórdico proceden de `data/fichas-proyectos.json`, `sourceNotes`, y de `docs/nordico-y-parque-germania-2026-10-13.md`. Las de Sento ya estaban en el catálogo. Cuando falte una fecha se muestra un pendiente explícito.

Los enlaces de condiciones apuntan a `#proyecto` en 131 fichas. Distrito Centro, INN Puerto Chico y Edificio Suecia usan `#contenido-principal`, el contenedor existente que incluye sus notas comerciales; su bloque `#detalle-adicional` sólo contiene galería y superficies. El generador verifica que los 134 destinos existan y genera las tres excepciones. Las pruebas comprueban también las notas comerciales de esos tres destinos.

La tipografía, colores, grid, orden, imágenes originales y controles existentes se conservan. Sólo se añaden notas comerciales discretas, estados de foco y el directorio alternativo; no se cambia el diseño general.

## Generación y alcance de publicación

`python3 -B scripts/build-catalog-presentation.py --check` valida el contenido generado. Sin `--check` actualiza únicamente los tres bloques identificados en `proyectos.html`.

El generador compara cada cubierta con la misma imagen de investigación y del manifiesto León; verifica archivo regular, proyecto, SHA-256, tamaño y dimensiones reales con Pillow antes de incorporarla. No deduce nombres de variantes ni convierte imágenes. Dos manifiestos repiten el principal entre sus variantes: la salida lo desduplica por ruta.

El packager conserva las 134 identidades y rutas en todos sus perfiles; sus transformaciones de catálogo se limitan a las cubiertas. El directorio no añade contenido de las capas protegidas. El manifiesto León sigue marcado `protectedPreviewOnly`; las validaciones y controles de publicación permanecen intactos y no se genera ni publica un artefacto de release en esta fase. Las variantes mantienen el alcance de sus fotos de origen.

## Validación y límites

Se añaden 12 pruebas Node de comportamiento actual, generación y proyección histórica estricta. La proyección es exclusivamente de tests: acepta el archivo completo aprobado o el blob anterior exacto, y rechaza ediciones adicionales, precios, rutas, fotos o avisos alterados. Ningún validador de publicación la importa.

Se ejecutan además las 22 pruebas existentes del buscador financiero. La comprobación local con Chromium cubre 390, 768 y 1440 píxeles, cada uno con DPR 1 y 2, las cinco cubiertas, ausencia de desbordamiento horizontal, filtros y directorio sin JavaScript y con `fetch` fallido. El directorio y un enlace se activan por teclado y se navega a la ficha. Se bloquean todos los hosts externos y las rutas API durante esa comprobación.

En esas seis combinaciones, Don Lautaro selecciona el archivo de 480 px a DPR 1 (71.136 bytes) y el de 960 px a DPR 2 (288.172 bytes), frente al principal de 1.297.214 bytes. Es peso de los archivos seleccionados por `currentSrc`, no una medición de transferencia, LCP o CLS en producción.

El alcance restante de PERF-001 —galerías, otras imágenes grandes y métricas reales— sigue pendiente de medición y recursos autorizados. No se alteran planos ni sus enlaces de ampliación. Los casos privados de release y Search Console siguen pendientes de sus accesos y recursos; esta corrección no acredita indexación ni stock actual.
