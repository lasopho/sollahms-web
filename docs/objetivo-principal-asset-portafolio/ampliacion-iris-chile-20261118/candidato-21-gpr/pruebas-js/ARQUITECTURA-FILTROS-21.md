# Integración local de 21 proyectos Iris

Arquitectura inicial basada en los contratos publicados875 y T2; posteriormente implementada por autorización del agente principal en el checkout local nuevo. El universo131, el candidato24a y sus datos permanecen intactos. La ampliación está autorizada sólo como candidato local; push, PR, despliegue y publicación siguen siendo pasos independientes.

## Composición de datos

Conservar `data/proyectos.json` y `data/catalog-facets.json` con sus hashes actuales. Un archivo público mínimo nuevo contiene exclusivamente las21identidades autorizadas, fuentes, fechas originales, valores públicos y alcances. Un adaptador nuevo valida esa fuente, detecta colisiones con los131slugs y compone las152tarjetas en memoria. No usar un generador de aplicación ni el importador comercial histórico.

El JSON público es una proyección permitida, no el expediente raw: excluir usuarios, historial interno, comisiones, intermediarios, respuestas privadas, rutas locales y notas operativas. Mantener URL Iris y fecha de observación, con fecha de documento desconocida cuando corresponda.

## Testigos separados

1. `externalIris.projectFromPrice`: precio desde externo con valorUF, literal original, URL, fecha y etiquetaIris. Crear un testigo de precio únicamente; no le prestar dormitorios, baños, modelos, superficies o stock desde la cabecera. No escribir ese importe como `precioDesdeUF` de Sollahms.
2. `headerBedroomProfile`: sólo número exacto explícito, en su perfil separado. Conservar rangos como literal sin expandirlos. El textoIris «Estudio» no se convierte en0D. Un perfil2D puede contestar una búsquedaD2 sin precio; no contesta precio+D2 usando el desdeIris.
3. `unclassifiedSurfaceSummary`: literal general; útil, total, interior, terraza y terreno canónicos permanecen desconocidos. No alias ni suma.
4. `ownerReferences`: declaraciones propietarias ya recibidas con su fecha y categoría. Pueden soportar precio+D si la misma declaración contiene ambos, como las categorías existentes de NuevoVivacetaECasa y Compañía1735Sento. No completar baño/superficie ni asignar unidad/plano desdeIris. La claveowner0 necesita el mapa de categoría existente; su etiqueta tampoco se toma de textoIris.
5. Tipo, entrega y amenities generales conservan alcance de proyecto y su atribución original. El bloque propio de proyectoIris puede respaldar tipo+precioheader, pero su tipo no migra a una referencia unitaria o propietaria separada. No inferir estado comercial, entrega legal, modalidad de compra, inclusión de estacionamiento/bodega ni stock.

La reutilización de `matchProjectFilters` debe hacerse con los registros validados, sin cambiar su regla de un único testigo para los predicados de opción. Los desconocidos fallan cuando se activa su filtro; las búsquedas que no requieren ese campo conservan el proyecto. Amenity general no se convierte en derecho de una cotización o unidad: precio+amenity requiere alcance compatible explícito; no un join por proyecto.

La clase de uso no está acreditada en esta fuente21. Casa/Departamento son tipos explícitos y no fabrican usoResidencial: los nuevos llevan`tipoActivo:null` y`assetTypes:[]`, y un filtro de uso activo falla antes del evaluador común. Las proyecciones de amenities conservan`scope:project-general` y su`propertyTypeScope`, sin etiqueta de uso derivada.

## Presentación y selección

El resultado y su precio se proyectan desde una referencia que satisfizo todos los filtros activos. La referencia seleccionada conserva autoridad, fecha, URL, alcance eID. No elegir el mínimo entre fuentes y después mostrar atributos de otro registro.

La última instrucción del agente principal fija prioridad propietaria en Compañía1735 y NuevoVivaceta: sus importesIris se conservan en procedencia, pero se enmascaran como precio filtrable en todas sus referenciasIris. Compañía1735 no cumple maxUF4000 por la campañaIris3640, y su precioowner4550 no recibe2B desde esa otra referencia. D2/B2 sin precio puede seguir utilizando su perfil externo. Los19sinprecioowner mantienen preciosIris explícitos con badge.

Entre testigos elegibles con precio, la presentación usa owner, referenciaIrisexacta y desdeIris de proyecto en ese orden; dentro de cada origen usa el menor importe elegible. Ordenar por precio utiliza exactamente ese valor mostrado. El registrosource conserva su lista/final rotulado sin sumarlos ni calcular descuentos.

Un precioIris debe leerse como «ReferenciaIris desdeUF…», con fuente, fecha de consulta y disponibilidad/vigencia por confirmar. No mostrarlo como precioSoll. Los detalles de header y superficies sin métrica pueden mostrarse como resúmenes atribuidos, separados de «Datos de la referencia que coincide».

Para precioIris, `financialBaselineCompatible:false`. Conservar intactos los módulos/fórmulas financieros, CRM360, AILab, Resend, formularios y funciones. Evitar que la mera existencia de un importe externo habilite simuladores o el resumen financiero; la solución debe quedar en los puntos de presentación del catálogo.

## Opciones y mapa

Construir opciones con la composición152validada para queGPR, regiones y comunas nuevos estén disponibles. No mantener una lista de inmobiliarias codificada sólo con las actuales. Las opcionesD/B/superficie canónica no se rellenan a partir de rangos sin contrato; que un filtro esté disponible no obliga a todos los proyectos a coincidir.

Coordenadas nuevas siguen`null` hasta evidencia real. No geocodificar silenciosamente, usar coordenadas cero, centrar cada ficha en su comuna o reutilizar la ubicación de otro proyecto. Tarjetas y listado siguen accesibles; mapa/vista dividida deben distinguir resultados sin coordenada y no anunciar un pin inexistente. Metro y distancias tampoco se deducen de la dirección.

## Archivos propuestos

- Nuevo `data/catalog-iris-expansion-21.json`: proyección pública mínima, separada del baseline131.
- Nuevo `assets/js/catalog-iris-expansion.mjs`: validación, normalización, composición y referencias admitidas; funciones puras y carga same-origin separada.
- `assets/js/catalog-filter-engine.mjs`: ruta específica para proyectos marcados por el adaptador, antes del fallback publicado. Delegar los predicados al evaluador existente; no modificar las rutas de131, Leben, Euro oNollagam.
- `assets/js/catalog-model.mjs`: precio/badge/notas/datos desde el testigo coincidente y origenIris; compatibilidad financiera explícita.
- `assets/js/catalog.mjs`: cargar, validar y anexar21; conservar131si falla la fuente, mostrar un aviso accesible y no presentar el fallo como cero proyectos comercializables. Integrar opciones y presentación.
- `assets/js/catalog-filter-controls.mjs`, `assets/js/catalog-map.mjs`, `proyectos.html` yCSS: revisar primero si los puntos existentes son dinámicos y ya manejan ausencia de coordenadas/avisos. Sólo editar si se demuestra una necesidad concreta. No crear versiones paralelas completas del catálogo ni tocar finanzas.
- Nuevas21fichas y sus datos/media: responsabilidad de la línea de fichas; usar el mismo contrato externo y no crear superficies o media inexistente.

La inspección875 confirmó que el mapa existente ya conserva los proyectos sin coordenada en su lista pendiente. No se modificó su módulo. Los cambiosJS se limitaron a nuevo`catalog-expansion.mjs`, hooks en`catalog.mjs`/`catalog-model.mjs`/`catalog-filter-engine.mjs`/`catalog-filter-controls.mjs` y pruebas nuevas. HTML/CSS/datos/fichas corresponden al agente principal y al agente de datos.

## Pruebas dirigidas propuestas

1. Fuente21acepta exactamente los IDs/identidades autorizados; rechaza colisiones de slug/ID, país distinto, importes no numéricos, campos raw inesperados y URLs no permitidas.
2. PrecioIris solo coincide con rangoUF y se muestra con atribución; no coincide con precio+D/B/útil/total al carecer de un mismo testigo.
3. Perfil exactoD2 coincide sin precio; rango «Estudio a1dormitorio» no fabrica0D/1D ni categorías intermedias. Baño desconocido y útil/total sin rótulo permanecen negativos con sus filtros activos.
4. Declaraciónownerprecio+D2 sí coincide usando su propio importe y categoría, sin prestar atributos deIris; precioowner eIris conservan procedencias separadas.
5. Desconocidos no excluyen la consulta vacía; amenity de proyecto no produce coincidencia precio+amenity sin alcance compatible; mención de estacionamiento no genera incluido/disponible.
6. GPR, región, comuna y nombre se pueden filtrar/buscar; el baseline131es profundamente idéntico antes/después de componer152.
7. Coordenadas`null`no producen pin0/0ni distanciasMetro; los mismos proyectos siguen visibles en tarjetas/listado y el mapa explica la ausencia de ubicación.
8. Fallo/corrupción de la fuente21conserva131y muestra aviso accesible persistente fuera del panel colapsable; no toma un precio de otra fuente como fallback.
9. Misma referencia y etiquetas de origen en tarjetas, listado, popup de mapa y vista dividida; nuevos detalles también conservan el aviso externo. Precio externo no habilita controles financieros.
10. Integridad de datos131, fuentes21originales, 155protegidos, siete funciones y candidato24a; revisión del diff acotado, sin generadores.

No repetir84/16certificadas por rutina. Si cambian módulos compartidos, ejecutar las regresiones concretamente afectadas y los controles nuevos; los resultados antiguos siguen siendo históricos y no se suman de nuevo.

## Verificación de la implementación

Pasaron19casos distintos de comportamiento: suite18/18 tras la corrección regional y un caso posterior de uso desconocido1/1. Las26regresiones de filtros, presentación y compatibilidad financiera afectadas también pasaron:45casosJS distintos. Las repeticiones dirigidas de etiqueta/fecha, contenedor financiero y alcance no se suman como pruebas nuevas. No se ejecutaron los motores/fórmulas financieros ni se repitió el84certificado.

El wrapper financiero inicializa únicamente el universo131, ordena ese subconjunto y conserva los nuevos como no evaluados. Una búsqueda sóloGPR oculta el contenedor financiero completo y su resumen, los restaura en resultados publicados/mixtos y nunca pasa los slugs nuevos a la caché financiera. El fallback de fuente21 conserva131 y muestra un aviso`role=status`/`aria-live=polite` antes del contador, fuera del panel colapsable.

QAChrome del agente principal detectó dos variantes de región nuevas (`De los Lagos` y`Del Biobío`). Se normalizaron sólo los tres registros afectados de la proyección21 a`Los Lagos`/`Biobío`, preservando el literalIris en`source.originalRegion`. Pasaron los dos casos dirigidos; no cambia la clasificaciónMetropolitana preexistente.
