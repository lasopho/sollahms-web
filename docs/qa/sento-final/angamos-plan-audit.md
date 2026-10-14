Auditoría de las seis tipologías de Angamos 205, consultadas el 14 de octubre de 2026. Datos y evidencias internas: `data/sento-plan-audit-angamos.json` y `docs/qa/sento-final/angamos-plan-verification.json`. Se contrastaron los códigos, las imágenes y los campos individuales de la [página oficial](https://sento.cl/proyectos/angamos-205/).

| Código | Presentación propuesta | Útil m² | Terraza m² | Total m² |
|---|---|---:|---:|---:|
| B10-I | 1 dormitorio · 1 baño | 31,22 | 2,50 | 33,72 |
| C3 | 2 dormitorios · 2 baños | 45,55 | 2,55 | 48,10 |
| C4 | 2 dormitorios · 2 baños | 47,39 | 2,68 | 50,07 |
| C6 | 2 dormitorios · 2 baños | Omitir | Omitir | 51,36 |
| A2 | 1 baño | 22,31 | 2,31 | 24,62 |
| A4 | 1 baño | 22,89 | 1,78 | 24,67 |

A2 y A4 aparecen en la pestaña Estudio, mientras sus tarjetas indican un dormitorio. Las plantas técnicas oficiales imprimen DORMITORIO y BAÑO, pero no resuelven la clasificación. Se conservan dormitorios `null` internamente y se presenta únicamente el baño confirmado, sin inferir la distribución a partir del dibujo.

En C6, la fuente publica 48,37 m² útiles, 2,89 m² de terraza y 51,36 m² totales. La comprobación aritmética arroja 51,26 m²; ese resultado sólo sirve como diagnóstico interno. Se conservan todos los valores de origen y se recomienda publicar únicamente el total declarado de 51,36 m². Útil y terraza tienen `publishable: false`.

Las seis imágenes del repositorio mantienen sus hashes y sus dimensiones originales. Sus píxeles RGB decodificados son idénticos a los JPEG oficiales actuales; no se recortaron, ampliaron ni quitaron bandas. C4 y C6 conservan el original de 800 × 616 px. Las variantes de mayor resolución de 2024 contienen una promoción histórica y no se incorporan.

Se verificaron 18 campos de superficie por código y los seis vínculos entre tarjeta e imagen. Los 16 campos publicables conservan exactamente sus valores; no se añaden áreas calculadas, promedios, ceros ni superficies de otro modelo.

La página actual no enlaza un PDF de planos. El inventario público completo de medios de Angamos devuelve tres PDF, correspondientes a términos promocionales y de referidos. Se extrajo el texto disponible y se revisaron visualmente las 18 páginas escaneadas: no contienen una planta ni una tabla por código que resuelva A2, A4 o C6. Esto documenta las fuentes públicas consultadas; no prueba que no existan documentos sin publicar. El OCR local falló, por lo que no se usa su ausencia de resultados como evidencia.

El estado y precio de la página siguen iguales al control del 13 de octubre: entrega inmediata y desde UF 2.794 para la unidad 516 de 1D/1B, con 20% de descuento incluido, sin estacionamiento ni bodega y sujeto a disponibilidad. Esta auditoría no modifica precio ni disponibilidad.

Para la ficha comercial se proponen avisos discretos: «Imágenes y decoración referenciales» y «Planos y superficies aproximados. Confirma las medidas de la unidad al cotizar». A2 y A4 conservan la banda de origen y la nota «Plano marcado como reservado. Consulta distribución y disponibilidad». La documentación, fechas, URLs, hashes y discrepancias permanecen en el registro interno.
