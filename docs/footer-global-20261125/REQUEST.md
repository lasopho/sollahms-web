# SOLLAHMS — HOMOLOGACIÓN GLOBAL DE FOOTERS Y PUBLICACIÓN AUTOMÁTICA EN PRODUCCIÓN

**Repositorio:** `lasopho/sollahms-web`
**Dominio de producción:** https://sollahms.cl
**Alcance:** Todas las páginas públicas del sitio.

## OBJETIVO

Auditar, homologar, corregir, verificar y publicar inmediatamente los pies de página de todas las páginas de Sollahms.

Ejecutar el trabajo de principio a fin en forma completamente autónoma, sin detenerse por fases ni solicitar autorizaciones intermedias.

La producción debe quedar actualizada una vez completadas satisfactoriamente las comprobaciones de integridad y calidad.

## 1. IDENTIFICAR LA REFERENCIA OFICIAL

Antes de modificar cualquier archivo:

1. Inspeccionar la página principal de Sollahms.
2. Identificar el footer corporativo que actualmente utiliza la portada.
3. Revisar si el repositorio contiene una página, componente, documentación o referencia previamente definida como estándar corporativo.
4. Consultar el historial Git y los trabajos anteriores de homologación de pies de página.
5. Determinar cuál es la versión oficial más reciente y aprobada.

**Regla de precedencia:**

- Utilizar como referencia principal la versión corporativa definida previamente en el proyecto.
- Si no existe una referencia explícita, utilizar el footer de la página principal de Sollahms.
- Si existen diferencias entre ambos, analizar el historial de cambios y adoptar la versión corporativa aprobada más reciente, conservando los elementos válidos de la portada.

No diseñar un footer nuevo ni sustituir arbitrariamente la identidad visual existente.

## 2. AUDITORÍA COMPLETA

Inspeccionar el 100% de las páginas públicas:

- Portada.
- Páginas corporativas.
- Servicios y asesorías.
- Centro de Orientación.
- Guías y contenidos educativos.
- Comparadores y herramientas.
- Contacto.
- Páginas legales.
- Todas las fichas de proyectos inmobiliarios.
- Páginas de categorías y navegación.
- Cualquier otra página HTML pública.

Identificar todas las diferencias respecto de la referencia oficial.

Crear una matriz de auditoría con el estado individual de cada página.

No limitarse a una muestra.

## 3. HOMOLOGACIÓN GLOBAL

Aplicar el footer oficial a todas las páginas que deban compartirlo.

Uniformar:

- Estructura HTML.
- Logotipo.
- Colores corporativos.
- Fondos y degradados.
- Tipografías.
- Espaciados.
- Columnas.
- Jerarquía visual.
- Textos corporativos.
- Enlaces internos.
- Enlaces externos.
- Información de contacto.
- Redes sociales, cuando correspondan.
- Información legal.
- Derechos reservados.
- Comportamiento responsive.

Verificar especialmente:

**Teléfono oficial:** +56 9 4850 2440.

**WhatsApp:** https://wa.me/56948502440

Mantener el teléfono visible y utilizar enlaces de WhatsApp donde corresponda.

No introducir textos antiguos ni recuperar frases corporativas que fueron eliminadas anteriormente.

### Excepciones

Si determinadas páginas requieren información específica en su footer por motivos legales, funcionales o de arquitectura, conservarla sin alterar la identidad visual común.

Las fichas inmobiliarias deben mantener intactos sus datos particulares, información comercial y contenido SEO/GEO.

## 4. IMPLEMENTACIÓN TÉCNICA

- Priorizar componentes compartidos y reutilizables.
- Evitar duplicaciones innecesarias.
- Respetar la arquitectura existente.
- Mantener compatibilidad con todas las páginas.
- No modificar contenido ajeno al footer.
- No alterar formularios, integraciones CRM, funciones serverless ni servicios externos.
- No eliminar rutas, recursos o redirecciones.
- No alterar sitemap ni canonical salvo que sea estrictamente necesario y esté justificado.

## 5. CONTROL VISUAL RESPONSIVE

Realizar pruebas en:

- 1440 px.
- 1280 px.
- 768 px.
- 390 px.
- 320 px.

Verificar alineación, legibilidad, espaciados, columnas, enlaces, logotipo, ausencia de desbordamientos y comportamiento móvil.

Revisar visualmente la portada y páginas representativas de cada categoría, además de ejecutar comprobaciones automatizadas sobre el 100% del inventario.

## 6. PRESERVACIÓN SEO/GEO Y FUNCIONALIDADES

Antes y después de los cambios, comprobar:

- Títulos y metadescripciones.
- Canonical.
- Datos estructurados.
- Enlaces internos.
- Sitemap.
- Indexabilidad.
- Contenido SEO/GEO.
- Formularios.
- Funciones serverless.
- Comparadores y herramientas.
- Navegación global.

El alcance es exclusivamente la homologación de los pies de página.

No modificar la página de proyectos ni sus contenidos, salvo los elementos del footer.

## 7. PUBLICACIÓN INMEDIATA Y AUTÓNOMA

**AUTORIZACIÓN EXPRESA: AUTORIZO LA PUBLICACIÓN EN PRODUCCIÓN DE LOS CAMBIOS DESCRITOS EN ESTE PROMPT.**

No detenerse en una Preview esperando mi aprobación.

Ejecutar autónomamente:

1. Revisar el deployment que sirve actualmente `sollahms.cl`.
2. Sincronizar el trabajo con la versión productiva vigente.
3. Crear una rama de trabajo independiente.
4. Implementar la homologación.
5. Ejecutar pruebas de integridad, funcionalidad y diseño.
6. Generar un build reproducible.
7. Verificar que el paquete de producción conserve todas las páginas, recursos y funciones existentes.
8. Comparar el candidato con producción.
9. Resolver cualquier regresión atribuible a los cambios.
10. Publicar inmediatamente el candidato validado.
11. Asignar el dominio de producción mediante el procedimiento seguro del proyecto.
12. Verificar que `sollahms.cl` esté sirviendo efectivamente el nuevo deployment.

### Condiciones obligatorias de publicación

- No sobrescribir cambios posteriores de producción.
- No utilizar un deployment antiguo como base si existe uno más reciente.
- No publicar un build incompleto.
- No eliminar variables de entorno ni integraciones.
- No desactivar SSO ni modificar configuraciones de seguridad.
- No modificar funcionalidades ajenas al alcance.
- No omitir páginas del inventario.
- Si existe un bloqueo técnico real, diagnosticarlo y resolverlo autónomamente cuando sea posible.

Si una comprobación crítica falla y no puede resolverse de forma segura, no forzar la publicación: preservar producción y entregar el diagnóstico preciso.

## 8. VERIFICACIÓN POSTERIOR A LA PUBLICACIÓN

Una vez publicado:

- Confirmar deployment READY.
- Confirmar que el dominio apunta al deployment nuevo.
- Inspeccionar la portada.
- Inspeccionar páginas corporativas.
- Inspeccionar páginas educativas.
- Inspeccionar contacto.
- Inspeccionar fichas inmobiliarias.
- Verificar footer en escritorio y móvil.
- Comprobar enlaces de WhatsApp.
- Comprobar enlaces internos.
- Revisar errores HTTP y JavaScript.
- Comparar la versión productiva con el candidato aprobado.

No declarar éxito basándose únicamente en que Vercel indique READY.

## 9. INFORME FINAL

Entregar un informe de cierre con:

1. Página utilizada como referencia oficial y justificación.
2. Total de páginas inspeccionadas.
3. Total de páginas homologadas.
4. Excepciones justificadas.
5. Cambios realizados.
6. Archivos modificados.
7. Resultados de pruebas responsive.
8. Resultados de pruebas funcionales.
9. Confirmación de preservación SEO/GEO.
10. SHA del commit publicado.
11. Deployment anterior y nuevo.
12. Fecha y hora de publicación.
13. Confirmación del dominio en producción.
14. Evidencias de verificación post-publicación.
15. Cualquier incidencia pendiente.

## INSTRUCCIÓN FINAL

Trabaja de manera autónoma, continua y resolutiva hasta completar la auditoría, homologación, QA y publicación.

No solicitar aprobación por fases.

No entregar solamente un diagnóstico o una Preview.

**El resultado esperado es que Sollahms quede publicado con todos sus pies de página homologados respecto de la referencia corporativa oficial, sin regresiones y con producción verificada.**
