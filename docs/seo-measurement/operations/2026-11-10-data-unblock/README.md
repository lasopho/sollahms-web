# Desbloqueo operativo SEO/GEO — acciones del propietario

**10/11/2026 · America/Santiago.** Continuidad del commit `5282c2ea248a4d14da1ca692031560d9af0f4818`; `corporate-education-v2`, 11 URL. Esta entrega convierte los pendientes en operaciones de recepción. La auditoría anterior, producción y protocolo permanecen intactos. No hay nuevos datos de buscadores o respuestas IA.

Puedes devolver evidencia por pasos; no hace falta terminar todo para comenzar a importar. Usa los archivos originales permitidos y revisados, sin credenciales o personas. No publiques los exports de cuentas en Git.

## 1. Google

En [Search Console](https://search.google.com/search-console/), abre el selector y confirma la propiedad **ya existente** `sc-domain:sollahms.cl` o `https://sollahms.cl/`; devuelve la captura recortada y su nombre literal. Si no aparece, revisa tus otras cuentas propias o consulta al administrador anterior; no añadas otra propiedad.

Después: **Rendimiento → Resultados de búsqueda → Fecha más amplia disponible → granularidad diaria**; conserva tipo de búsqueda, periodo real y última fecha completa. Exporta las cinco dimensiones **Fechas/Páginas/Consultas/Países/Dispositivos**: primero contexto **general no filtrada**, luego el filtro positivo exacto de 11 páginas para **ALL** y **Chile**. Un ZIP/libro que ya contenga las cinco tablas se descarga una sola vez por conjunto de filtros.

Lee **Indexación → Páginas**, **Sitemaps** ya existentes y la versión indexada en **Inspección de URL**, una vez por cada URL de [included-urls.csv](included-urls.csv). No solicitar indexación, probar URL publicada ni reenviar sitemap. La [guía Google](google-steps.md) incluye regex, rótulos exactos, nombres de entrega y límites. Atención: la ayuda oficial advierte que algunos `~`/`-` no disponibles se exportan como `0`; acompaña esas celdas con captura y nota, para no importarlas como ceros medidos.

## 2. Bing

En [Bing Webmaster Tools](https://www.bing.com/webmasters/) selecciona el **sitio existente**; devuelve URL literal y captura del panel. No añadir ni importar otro sitio. En **Search Performance**, elige el máximo periodo realmente ofrecido y descarga gráfica, **Pages** y **Keywords** cuando haya control de descarga. Conserva fuente/vertical literal y límites; Bing permanece separado de Google.

Para el segmento, abre únicamente las 11 páginas incluidas y exporta consultas/series que la interfaz permita; sin un filtro exacto no se inventa un total corporativo. Lee sitemap, **Site Explorer/URL Inspection** del índice e **IndexNow** existente. Si aparece **AI Performance**, conserva **Citations & Pages** y **Topics Portfolio** cuando se ofrezca. Un panel/pestaña ausente es disponibilidad desconocida/no ofrecida, nunca cero citas. La [guía Bing](bing-steps.md) detalla pasos, descargas y capturas.

## 3. IA

Ahora no hay interfaz de producto controlable en Codex; **ninguna ejecución realizada**. Puedes comenzar fuera de Codex con cualquier plataforma accesible: el [CSV de 60 operaciones](ai-wave-1-operations.csv) contiene los prompts exactos v2. El estado `blocked` de esa copia corresponde a la sesión histórica, no a tu prueba manual; no lo sobrescribas.

Una conversación/sesión limpia por pregunta, búsqueda acreditada, primera respuesta y fuentes de esa misma respuesta. Por `plan_id`, devuelve carpeta `ia/<plan_id>/` con condiciones, respuesta permitida/revisada, capturas y lista de fuentes. La [guía IA](ai-owner-operation.md) especifica cada plataforma, cuenta/personalización/modalidad/ubicación, mención/enlace/cita/recomendación y qué guardar. Las [condiciones](templates/ai-conditions-template.json) y [fuentes](templates/ai-sources-template.csv) están listas para completar. No necesitas calcular hashes: se calculan al recibir la evidencia. Si un indicador es ambiguo, queda pendiente de clasificación, sin forzarlo a cero ni declararlo validado.

## 4. Negocio

La única lectura nueva de configuración comercial encontró **`CONTACT_DELIVERY_MODE=resend`** en el proyecto de producción. Esto identifica el canal configurado; no certifica entrega del deployment, operación de un CRM ni atribución. [Evidencia acotada](sources/commercial-mode-current.json). Sigue sin acreditarse una fuente operativa que entregue landing/source-medium/UTM unidos a etapas comerciales.

Propietario o administrador: identifica el receptor real actual; aporta estado/última recepción agregada ya existente, sin abrir personas ni enviar pruebas. Desde su informe actual, exporta **agregados en origen**, por fecha/página/adquisición/etapa, con definiciones, deduplicación y atribución. [CSV de recepción](templates/business-aggregate-template.csv) y [procedencia](templates/business-provenance-template.json); no son mediciones ni formatos nativos presumidos. **Landing inicial ≠ página de envío; aceptación ≠ persistencia ≠ cualificación ≠ reserva.**

La pieza mínima es el vínculo ya almacenado entre adquisición/página y etapa, más un informe agregado. Si solo falta el informe, lo obtiene el administrador en lectura. Si el vínculo nunca se guardó, no hay unión histórica acreditada: se documenta para una tarea futura, sin implementar tracking. [Pasos negocio](business-assets-steps.md).

## 5. Activos externos

No hay control corporativo externo confirmado. Completa [corporate-assets-confirmation.csv](templates/corporate-assets-confirmation.csv) para **LinkedIn corporativo, Instagram, Facebook, Google Business Profile y Bing Places**, desde los paneles que ya administras. Las URL están vacías porque no se conocen; no se inventan perfiles. El LinkedIn personal previo es solo referencia, y comentarios/directorios no son nuevos activos corporativos.

Por perfil existente: URL, nombre mostrado, dominio enlazado, teléfono comercial público, descripción, estado y prueba recortada de control sobre ese activo. Oculta identidad de cuenta y otros administradores. Declaración sin prueba = control pendiente; si tu inventario indica que no existe, `none_declared`; desconocido = `unknown`. No crear perfiles, editar campos ni añadir `sameAs`. [Instrucciones de control](business-assets-steps.md).

## 6. Bloqueos y evidencia que los resuelve

| Recurso exacto | Acción mínima | Quién | Evidencia de retorno |
|---|---|---|---|
| Propiedad real GSC | Elegir propiedad existente y abrir su panel | Titular/usuario autorizado | `gsc-property.png` + nombre/tipo en [confirmación](templates/property-confirmation.json) |
| Historial Google | Exportar periodo máximo, cinco dimensiones y filtros ALL/CL | Usuario GSC | ZIP/XLSX/CSV originales + captura filtro/periodo + [índice de archivos](templates/received-files.csv) |
| Indexación Google | Leer Páginas/sitemap e inspeccionar 11 URL | Usuario GSC | Capturas/exports + [tabla de inspección](templates/url-inspection-intake.csv) |
| Sitio e informes Bing | Seleccionar sitio previo; descargar rendimiento y leer estados | Usuario BWT | Captura de sitio, CSV/capturas/11 inspecciones; IndexNow/AI/Topics si se ofrecen |
| Producto IA accesible | Ejecutar una fila exacta en contexto limpio con búsqueda | Propietario/operador | Carpeta de esa operación: condiciones + respuesta + capturas + fuentes |
| Receptor comercial operativo | Identificar sistema e integración actual | Operaciones/técnico | Estado recortado sin contactos; sin formulario de prueba |
| Unión adquisición→negocio | Exportar agregado existente, o señalar campo/vínculo no guardado | Administrador CRM/negocio | Agregado + procedencia/definiciones; sin registros de personas |
| Control de perfiles existentes | Completar inventario y aportar rol administrativo recortado | Administrador del activo | CSV de activos + prueba por URL; sin crear perfiles |

**Primera devolución útil:** nombre de propiedad Google y sitio Bing con sus capturas. Después puedes entregar un solo export válido o una sola operación IA; cada pieza se recibe separadamente. No hacen falta contraseñas.

**Recepción:** devuelve una carpeta/ZIP revisado con `google/`, `bing/`, `ia/`, `business/` y `assets/` solo donde haya evidencia real. Completa el [índice](templates/received-files.csv) con archivo, propiedad, periodo/zona nativa, dimensiones/filtros, última fecha completa y límites. Los originales permitidos se conservan en almacenamiento privado; se calculan hashes, se separan motores y se reutilizan importadores/guardas existentes. No convertir fechas diarias GSC a Santiago, reconstruir cruces desde tablas marginales ni usar 09/11 como día completo antes/después. Recibir un archivo no equivale a aceptar su procedencia, cobertura o clasificación.

**Vía opcional:** el catálogo ofrece OpenSEO para GSC conectado, pero no está instalado ni conectado en esta sesión. Si prefieres esa vía, primero debes instalarlo y conectar la cuenta autorizada; todavía habría que verificar la propiedad y permisos reales. Los pasos manuales funcionan sin ello. No se activó ningún servicio. [Disponibilidad comprobada](sources/current-access.json).

No se repitieron DNS, Web Analytics, Observability, búsquedas de marca, auditorías técnicas ni pruebas históricas. No se cambió producción, contenido, fichas, formularios, sitemap/robots, IndexNow, perfiles, Lab o automatizaciones.
