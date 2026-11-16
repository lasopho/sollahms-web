# Continuar Sollahms: Leben documental, sin pasar a otra inmobiliaria

Lee primero `master/ESTADO-GLOBAL.json`, `leben/INFORME-LEBEN.md`, `leben/CONTRADICCIONES.md` y los CSV de esta carpeta.

Estado al 16/11/2026: auditoría documental Leben entregada. Trece proyectos revisados (12 no vendidos según snapshot y Own vendido), once brochures completos / 82 páginas, doce hashes PDF coincidentes incluyendo el PDF ESEPE excluido. Cincuenta y cinco solicitudes agrupadas al propietario. Aún no se recibieron respuestas ni se concilió vigencia comercial.

Checkout de trabajo: `/private/tmp/sollahms-auditoria-leben-20261116`, rama `codex/auditoria-leben-20261116`. El checkout original `/Users/luissandoval/Documents/sollahms-web` tiene cambios previos ajenos: no descartarlos, reformatearlos, guardarlos en stash ni cambiarlos de rama. La base local recibida contiene 131 proyectos; el HEAD de origen137 y main remoto134. La fuente del maestro es exclusivamente `leben/evidencias/entrada/proyectos-131.json`, con hash en BASELINE.json. No equipares esas bases ni producción.

Antes de responder, verifica que los archivos y sus hashes de integridad no cambiaron. Los PDF originales permanecen en `/Users/luissandoval/Downloads/Leben`. No vuelvas a solicitar los once brochures Leben disponibles. Nórdico y Own no tienen brochure localizado. `INVENTARIO_13_PROYECTOS.csv` original no se encontró; no inventes su contenido ni validación histórica. La lista de archivos y las búsquedas están documentadas.

Procesa solo respuestas nuevas a IDs L-001–L-055 de `DATOS-PENDIENTES-PROPIETARIO.csv` o de la hoja Responder del Excel. Mantén celdas fuente y valores confirmados intactos. Para cada respuesta registra valor, unidad, archivo/URL, página/línea, fecha documental y vigencia. Una respuesta sin evidencia no se marca conciliada. Si llega un documento nuevo, calcula SHA-256 y registra versión/duplicado y vínculo al anterior.

Prioridad comercial: valores entregados directamente por Sollahms antes que campañas externas. La tabla antigua s/f conserva prioridad documental pero no prueba precio vigente. Pide ratificación de vigencia, no repitas una solicitud como si el valor anterior no existiera. Own sigue vendido en el snapshot: no pedir precios/stock salvo reapertura expresamente acreditada.

Conciliaciones pendientes Leben: direcciones/accesos Argomedo380/382 e IndiHipódromo1816/Vallenar2070; cubierta INN cuarzo/ultracompacto travertino por modelo/versión. Las divergencias Living580/590, Mood6608/6630, Suecia2307/2323 y Capitanes1445/1447 conservan criterio de la ficha oficial archivada y no generan otra pregunta. Parque Germania es ESEPE, nunca Leben, y queda pendiente para su bloque correspondiente sin modificar el catálogo.

Conserva seis métricas de superficie separadas: útil, interior, total, terraza, jardín/patio privado y terreno. No sumes ni restes para obtenerlas, no conviertas rangos generales en útil/total, ni jardines comunes en privados. Lavadora incluida no demuestra especificación de conexión; marco PVC no demuestra termopanel. Unidad101/204/311 no equivale a código de modelo. Nombres/códigos/etapas deben relacionarse solo con respaldo.

Los siete archivos avanzados del encargo no se localizaron ni en el checkout/historial ni mediante lecturas directas de main(404). Cobertura reportada corresponde a `proyectos.html` disponible: búsqueda, activo, región, comuna, estado y precio; no hay filtros específicos de dormitorios, baños, superficies, amenities o entrega. No crees fuentes o coverage faltantes para aparentar que ya existían. Si se aporta la versión avanzada, léela y contrástala sin modificarla.

Actualiza matrices y trazabilidad de manera acumulativa: Datos recibidos → Datos conciliados → Listo para incorporación, solo cuando cada condición se cumpla. Mantén los otros118 proyectos Pendiente de auditoría. No comenzar Euro u otra inmobiliaria automáticamente: debe cerrarse Leben conforme al encargo.

Protecciones: fase documental exclusivamente. No modificar HTML, data/proyectos.json, amenities/project-features/catalog-facets ni otras fuentes productivas; no ejecutar generadores/builds de aplicación, formularios, CRM360 o integraciones; no invocar/modificar funciones, crear deployments, publicar ni fusionar PR. No integrar filtros hasta completar inmobiliarias y recibir autorización explícita posterior. Verifica hashes antes/después y conserva branch/checkout independientes.
