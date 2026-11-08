# Sollahms — fase 3: estado de consolidación de la medición real

**Fecha:** 8 de noviembre de 2026, America/Santiago. Las evidencias conservan hora UTC.
**Continuidad:** rama `codex/seo-medicion-20261108`, desde `e3cecabd30c58eccb6f388f810f304a26d758e76`.

**Conclusión ejecutiva:** no se encontraron nuevas exportaciones autorizadas, inspecciones de indexación, respuestas de IA ni confirmaciones comerciales. Por tanto, **la línea base real de posicionamiento sigue pendiente**. Esta fase registra la búsqueda de insumos, preserva lo validado en fase 2 y corrige un error geográfico en una propuesta editorial; no demuestra crecimiento orgánico ni ausencia de tráfico.

## Qué se recuperó y qué cambió

Se reutilizaron importadores, historial, requisitos de acceso, las ocho candidatas y el protocolo de 180 pruebas. El commit local y el de la rama recuperada coinciden con `e3cecab`. Las carpetas de recepción `library-files`, `shared/downloads` y `scratch` están vacías; no existe `docs/seo-measurement/.local`. La búsqueda de formatos CSV/TSV/XLSX/XLS/ODS/ZIP en el área de trabajo, excluyendo credenciales, dependencias y assets comerciales, encontró siete archivos: planes, plantillas y propuestas ya conocidos. Ninguno es una nueva exportación de Google/Bing. Los CSV de observaciones de IA solo contienen cabeceras.

No se consultaron cuentas externas indiscriminadamente ni se buscaron secretos. El resultado se limita a las rutas y herramientas disponibles; no afirma que el propietario carezca de datos en sus cuentas. [Inventario de insumos y clasificación](input-discovery.json).

El entorno conserva la lista de hosts restringida, sin secretos ni identidades salientes configuradas. No apareció una herramienta específica de Search Console/Bing ni un controlador de sesión de IA utilizable. **No se repitieron las solicitudes que habían fallado con 403 ni las consultas de Analytics que fallaron con 400**: no había evidencia de cambio en esas condiciones. [Estado de entorno](environment-status.json); antecedentes exactos: [accesos fase 2](../2026-11-08-phase2/evidence/access-probes.json) y [consultas conectadas fase 2](../2026-11-08-phase2/evidence/connected-access.json).

La consulta de metadata y alias de Vercel, que ya funcionaba, confirmó `sollahms.cl` asociado a `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ`. El proyecto mantiene `live=false`. No se desplegó ni cambió configuración. Las 141 URL y 131 proyectos son **el último inventario técnico verificado en fase 2**, conservado; no se volvió a rastrear el sitio ni se presenta como medición nueva de indexación. [Alias](production-aliases.json), [metadata](production-metadata.json).

## Indicadores verificables y límites

| Área | Evidencia disponible | Resultado de fase 3 |
|---|---|---|
| Avances técnicos | Importador y log de 13 pruebas sintéticas de fase 2; código intacto | Conservados; no se repitieron tests ni se atribuyen al tráfico |
| Google: páginas indexadas | Sin exportación/inspección de la propiedad | Desconocido (`null`) |
| Google: impresiones, clics, CTR, posición y consultas | Sin datos reales importables | Desconocidos (`null`) |
| Bing: indexación, sitemap procesado y rendimiento | Sin exportación/inspección de la cuenta | Desconocidos (`null`) |
| Comparación de 30 días contra 30 anteriores | Sin serie diaria real de 60 fechas completas | No calculada |
| Comparación de 90 días contra 90 anteriores | Sin serie diaria real de 180 fechas completas | No calculada |
| Crecimiento orgánico observado | Sin periodos reales comparables | No determinable; no equivale a 0% |
| Presencia en IA | 0 respuestas directas registradas; plan de 180 intacto | Frecuencias no medidas, no 0% |
| Referencias de IA y contactos cualificados atribuibles | Sin informe de atribución ni totales comerciales | Desconocidos (`null`) |
| Inventario comercial actual de las ocho candidatas | Solo antecedentes de catálogo de octubre, sin confirmación nueva de stock | No confirmado |

No se usan HTTP 200, sitemap o datos de catálogo como prueba de indexación. Tampoco se utilizan consultas públicas, posiciones supuestas, respuestas de API ni fixtures como sustitutos de GSC/Bing y de respuestas directas de plataformas. Un hash confirma integridad, **no autenticidad por sí solo**: el próximo export necesita procedencia autorizada y contexto verificable. [Registro estructurado](baseline.json).

## Decisión sobre las ocho candidatas

No hay evidencia para reordenarlas por búsquedas o resultados comerciales. Se conserva el orden editorial provisional de fase 2 **solo como referencia histórica**, sin asignar nuevas posiciones o puntuaciones. La comuna se coteja con la evidencia ya conservada:

| Referencia anterior | Página candidata | Comuna según evidencia existente | Decisión |
|---|---|---|---|
| 1 | B.Come | Concepción | Esperar datos de búsqueda y confirmación comercial |
| 2 | Gregorio de la Fuente | Macul | Igual |
| 3 | Jardines de Ramón Cruz | Macul | Igual |
| 4 | Condominio Uruguay | **La Florida** | Corregir propuesta anterior antes de reutilizarla |
| 5 | Parque Don Lautaro | Peñalolén | Esperar datos de búsqueda y confirmación comercial |
| 6 | Mirador La Florida | La Florida | Igual |
| 7 | Domeyko 2055 | Santiago | Igual |
| 8 | San Ignacio | Santiago | Igual |

Todas las columnas de indexación, impresiones, clics, posición, confirmación de stock y contactos quedan desconocidas en [candidate-decisions.json](candidate-decisions.json). No se afirma que ninguna de estas páginas genere hoy visitas o clientes.

Para una selección respaldada: primero validar inventario y posibilidad de atender consultas; después distinguir problemas de indexación de oportunidades editoriales; entre páginas con impresiones relevantes, valorar consultas, CTR con contexto de posición/dispositivo y contactos cualificados por URL. No existe un umbral de CTR ni una rentabilidad universal que pueda asignarse sin datos. Una página sin datos no se interpreta como una página sin demanda.

## Corrección editorial confirmada

La propuesta de fase 2 para Condominio Uruguay decía Ñuñoa, aunque su propia evidencia y el campo de comuna del CSV indican **La Florida, dirección Uruguay 8866**. Fue un error en la propuesta, no un fallo demostrado de la ficha pública. Se cotejaron los 11 títulos y descripciones con los hechos guardados: no se identificaron otras discrepancias materiales de comuna, dirección o tipologías en ese alcance; esto no certifica stock actual ni todas las afirmaciones del sitio.

**Sustituir para futuras revisiones, sin publicar:**

- Título: `Condominio Uruguay: departamentos en La Florida | Sollahms`.
- Descripción: `Revisa las tipologías, características y ubicación de Condominio Uruguay en La Florida. Consulta las condiciones vigentes con Sollahms.`

Los artefactos de fase 2 permanecen inalterados como historia; su propuesta geográfica de Uruguay queda **invalidada para reutilización**. La corrección está en [editorial-correction.json](editorial-correction.json), con referencia y hash de la evidencia anterior. No cambia ficha, URL, precio ni formulario.

Para AI Lab se preparó únicamente un [delta de la oportunidad existente](ai-lab-handoff-delta.json), `SEO-P2-condominio-uruguay`. Las otras siete siguen provisionales. No se crearon paquetes duplicados, no se escribió en el Lab ni se consumieron créditos de API. La evidencia de stock/demanda no se sustituye por aprobación editorial interna.

## Plan prioritario y recursos pendientes

| Orden | Acción siguiente | Recurso indispensable | Criterio para avanzar |
|---|---|---|---|
| 1 | Invalidar la propuesta geográfica errónea antes de reutilizarla | Ningún acceso nuevo: evidencia existente | Usar la corrección de esta fase en la oportunidad ya creada |
| 2 | Importar rendimiento de Google y Bing | CSV originales autorizados, manifiestos de propiedad/periodo/filtros/zona | Integridad y procedencia revisadas; sin datos de prueba |
| 3 | Confirmar indexación y sitemap procesado | Exportaciones de cobertura e inspecciones del motor | Estado y motivo por URL; distinguir muestras de totales |
| 4 | Confirmar inventario y capacidad comercial | Validación actual y fechada por proyecto | No inferir stock de precios o fichas históricas |
| 5 | Reordenar las ocho candidatas | Rendimiento por página/consulta más confirmación comercial | Decisión documentada; no una puntuación inventada |
| 6 | Ejecutar pruebas IA accesibles | Sesión legítima/interfaz habilitada y respuestas originales | Conservar condiciones, citas verificadas y evidencia por ejecución |
| 7 | Relacionar visibilidad con captación | Totales agregados atribuibles por origen, URL y periodo | Separar clics de WhatsApp, solicitudes aceptadas y contactos cualificados |

El procedimiento detallado de exportación de fase 2 sigue vigente; no se duplicó una integración. [Paquete mínimo y ejecución pendiente](NEXT-IMPORT.md). No hacen falta contraseñas, otra propiedad de búsqueda ni infraestructura pagada para la vía de exportaciones.

## Conservación y continuidad

- Código del importador, tests, log previo, evidencias y todos los archivos de `runs/2026-11-08-phase2/`: mismos bytes que `e3cecab`.
- Prompts, plan de 180 pruebas y protocolo IA: intactos. No se marcan pruebas como ejecutadas sin respuestas.
- Historial anterior: conservado como prefijo exacto, añadiendo esta fase. README: actualizado para que el siguiente trabajo empiece aquí y no copie la propuesta inválida.
- Solo documentación de medición nueva/actualizada. Ningún cambio a producción, `vercel.json`, HTML, scripts, formularios, funciones, fichas, precios o datos comerciales. Sin fusiones ni publicaciones del sitio.

La [validación de preservación](preservation-validation.json) permite revisar las diferencias contra `e3cecab`. La fase concluye con un estado honesto de bloqueo, no con una línea base real ficticia. Al llegar el primer paquete autorizado, continuar desde este informe e importar los datos con el sistema existente.
