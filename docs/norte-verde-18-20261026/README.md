# Norte Verde: catálogo autorizado de 18 proyectos

Actualización solicitada por el propietario de Sollahms el 26/10/2026 UTC (25/10 en Chile). Base exacta: fuentes `710a60262004ccbc524b7dfb8cc75866d9e01f08`, código publicado `9041a5e33617335a3baa7d32fd4fb6a0b2615a73`, despliegue `dpl_31y1i14ip3X7n1bufX4YchkBawfJ`. Rama `codex/norte-verde-18-20261025`; sin merge ni cambios a main.

Se reutilizan las 18 fichas existentes. Se retiran Atelier Prat Oficinas y Corrientes Oficinas: desaparecen del JSON público, directorio, contexto de formularios y sitemap. Sus rutas pasan a HTTP 404, sin redirigir a otro proyecto. Los originales y registros completos anteriores están en esta carpeta y en el commit base; no se incluyen en el paquete público. Se conservan las imágenes originales. Quedan 132 proyectos, 18 Norte Verde y 114 de las demás inmobiliarias sin cambios de datos.

## Criterios comerciales

El listado del propietario es la fuente de precios por tipología, entrega y estado. Los valores no se sustituyen por promociones de la web de la inmobiliaria. `commercialSource.type = owner-supplied` distingue esta procedencia en tarjetas, fichas, simulación y resumen calculado en servidor. La fecha corresponde a Chile. No se afirma stock ni recepción final obtenida. Estado y entrega se muestran por separado. Las referencias caducan en el simulador según la política existente de 30 días.

Los mínimos identifican la tipología concreta. Bordevivo, Vergara Domeyko y Parque Panamá tienen oferta comercial; no heredan superficies ni dormitorios de los departamentos. Dual, Parque Quinta, Origen Atacama y Plaza Nova tienen oferta mixta y aparecen al filtrar residencial, comercial o mixto. El mínimo residencial comprobable de Dual es UF 7.337,21. El estudio informado de UF 1.877,27 permanece documentado pero excluido del JSON público, las fichas, el orden por precio y el simulador hasta respaldar su correspondencia. No se incorporan remuneraciones internas ni datos de interfaz de origen.

Las fotografías, planos y recorridos se conservan. En ofertas comerciales o mixtas se aclara que representan el proyecto y no acreditan la superficie o equipamiento del local específico. Se retira el bloque de Verne Oficinas de la ficha residencial.

## Identidades y discrepancias

| Caso | Evidencia y decisión |
|---|---|
| Ecuador | [Ficha oficial](https://norte-verde.cl/proyecto/ecuador/) confirma Coronel Godoy 0157, esquina Ecuador, Estación Central. Se mantiene `edificio-ecuador`; no se confunde con Coronel Godoy de Ingevec. |
| Verne | [Memoria 2022](https://norte-verde.cl/wp-content/uploads/2026/01/ORG_NV_Memoria2022_2023-04-04-Digital-Pliego.pdf) identifica Verne en Videla 810, Coquimbo. Se conservan las ocho imágenes residenciales ya revisadas. |
| Irarrázaval | Se mantiene la identidad documental anterior de [Irarrázaval 1970](https://norte-verde.cl/wp-content/uploads/2026/01/IRARRAZAVAL_BROCHURE.pdf), Ñuñoa, y sus imágenes. |
| Parque Quinta | [Ficha](https://norte-verde.cl/proyecto/parque-quinta/) y [bases oficiales de 2026](https://norte-verde.cl/wp-content/uploads/2026/04/Descuento-20-precio-lista-1er-sem-2026.pdf) identifican Santo Domingo 3916, comuna de Santiago. El [brochure](https://norte-verde.cl/wp-content/uploads/2026/01/BROCHURE_PARQUE_QUINTA_BAJA.pdf), última página, indica 3898. Se publica 3916; la correspondencia de 3902 sigue pendiente y se señala en la ficha. |
| Quintavista | El [brochure](https://norte-verde.cl/wp-content/uploads/2026/01/12_01_2021_BROCHURE_QUINTAVISTA.pdf) identifica Santo Domingo 3810. Ficha y bases oficiales también lo identifican con 3816, comuna Santiago. Se usa 3810, Santiago, con nota sobre la numeración alternativa. |
| Playa Peñuelas | [Ficha oficial](https://norte-verde.cl/proyecto/playa-penuelas/) sitúa Av. Peñuelas 118 en Coquimbo; se corrige La Serena. La fecha y estado suministrados (junio 2028 / en blanco) se muestran como informados, con discrepancia respecto de segundo semestre 2028 / en verde. |
| Parque Panamá | La memoria oficial 2022 identifica Martínez de Rozas 2262; la [ficha actual](https://norte-verde.cl/proyecto/parque-panama/) usa Pasaje Delfina 890. Se conserva la identidad y se solicita confirmar acceso del local al cotizar. |
| Origen Atacama | [Ficha](https://norte-verde.cl/proyecto/origen-atacama/) y [bases](https://norte-verde.cl/wp-content/uploads/2026/04/Bases-Promocionales-desde-0-de-Pie_compressed.pdf) confirman Maipú 1196, Santiago. No se encontró respaldo oficial para «3008»; se mantiene la ruta histórica, pero el título usa el nombre oficial. Marzo 2028/en verde se etiqueta como informado y se explicita la diferencia con primer semestre 2029/en blanco. |
| Dual 390 LTO | [Ficha](https://norte-verde.cl/proyecto/dual-390-lto/) y [brochure](https://norte-verde.cl/wp-content/uploads/2026/01/BROCHURE_LTO_compressed-1.pdf) identifican departamentos de 1 y 2 dormitorios. No respaldan un estudio de UF 1.877,27. Se retiene ese dato hasta validación. Se explicita la diferencia entre noviembre 2027 informado y primer semestre 2028 oficial. |
| Plaza Nova y Lira 622 | Se conserva el estado suministrado como «informado», con nota sobre el estado diferente en la referencia oficial anterior; no se afirma avance de obra comprobado. |

Las bases y la memoria de gran tamaño se consultaron mediante resultados indexados oficiales; la descarga directa no estuvo disponible. No se inventan verificaciones de esos archivos completos. No se han obtenido nuevas cotizaciones ni permisos municipales.

## Publicación y recuperación

Copiar el paquete prebuilt de producción exacto y sustituir únicamente los archivos revisados. No reconstruir con el empaquetador histórico: sus perfiles de publicación no representan todas las mejoras manuales vigentes. El nuevo paquete conserva la configuración y guardas de las funciones; actualiza sus registros de proyectos y la procedencia del precio para que no acepten identificadores retirados ni valores anteriores. No se activan servicios, envíos ni reservas.

Crear candidato de producción con `--prebuilt --prod --skip-domain`, validar antes de promover y comprobar que `sollahms.cl` aún apunta a la base anterior. Mantener Vercel Authentication. Recuperación: promover de nuevo `dpl_31y1i14ip3X7n1bufX4YchkBawfJ`; no reconstruir para rollback. Los resultados concretos del despliegue se registran después de la validación.
