# Sollahms — corrección permanente del alcance SEO/GEO

**Fecha:** 8 de noviembre de 2026, America/Santiago.
**Continuidad:** rama `codex/seo-medicion-20261108`, desde `d654f0c`.
**Política activa:** `corporate-education-v2`.

**Resultado:** todas las fichas individuales de proyectos quedan excluidas del trabajo estratégico y de los resultados exclusivos SEO/GEO. El trabajo se concentra en identidad, asesoría, educación, financiamiento, decisiones de compra/inversión, herramientas, entorno urbano, catálogo general y contenidos corporativos. La exclusión no cambia el sitio ni la indexabilidad de ninguna ficha.

## Nuevo alcance incluido

La lectura de los inventarios publicados conservados permite identificar estas 11 páginas:

| Página | Función |
|---|---|
| `/` | Identidad corporativa y servicios de asesoría, incluidas sus secciones |
| `/centro-orientacion.html` | Orientación para elegir y planificar vivienda |
| `/guia-hipotecaria.html` | Financiamiento, costos, subsidios, FOGAES y tasas |
| `/comparador-hipotecario.html` | Herramienta educativa de comparación |
| `/cuando-comprar-propiedad.html` | Decisiones de compra, inversión, etapas y riesgos |
| `/entorno-desarrollo-urbano.html` | Conectividad, infraestructura y desarrollo urbano |
| `/proyectos.html` | Catálogo general y navegación |
| `/contacto.html` | Contacto corporativo |
| `/agenda-asesoria.html` | Solicitud de asesoría |
| `/trabaja-con-nosotros.html` | Colaboración corporativa |
| `/privacidad.html` | Información corporativa y consentimiento |

El [registro versionado](../../scope-v2.json) contiene las URL exactas bajo `https://sollahms.cl`, sus categorías y fuentes. Diez están en el sitemap histórico de 141 URL; Entorno también figura en el manifiesto publicado congelado. El inventario completo conservado registra 144 HTML: 131 fichas, 11 páginas de contenido y dos páginas técnicas de error. No se ha repetido el rastreo ni se infiere indexación actual de esos archivos. [Evidencia de clasificación](scope-evidence.json).

El listado describe las páginas públicas conocidas con esa evidencia; una URL nueva o ambigua queda pendiente de clasificación. Toda futura ficha continúa excluida aunque aún no esté en la lista de 131. Las anclas no crean páginas nuevas. Las páginas de error `404.html` y `410.html` se conservan y no se tratan como objetivos estratégicos de contenido.

## Exclusiones y corrección del trabajo anterior

- Las ocho candidatas de fases 2/3 pasan a **excluidas del alcance estratégico**, no a pendientes de optimización. El [registro de disposición](previous-candidates-disposition.json) conserva su identidad y nueva condición.
- Se descarta la confirmación de inventario como requisito para priorizar SEO/GEO. El estado comercial de proyectos no bloquea el trabajo corporativo/educativo.
- Quedan revocados para uso futuro todos los contratos de traspaso de fichas al AI Lab, incluida la corrección de Uruguay de fase 3. Se conservan como historia sin transferirlas, regenerarlas ni aplicarlas.
- No se evalúan rankings, consultas, CTR, citas o recomendaciones de proyectos individuales. Que una página incluida enlace fichas no amplía el alcance.
- No se elimina, desindexa, modifica ni perjudica una ficha. Precios, formularios, funcionalidades, robots, sitemap, canonical y configuración pública permanecen intactos.

`AGENTS.md` y los documentos activos de continuidad incorporan esta instrucción para trabajos futuros. Los informes y evidencias completos de fases 1/2/3 mantienen los mismos bytes; sus recomendaciones antiguas sobre fichas/inventario no son tareas vigentes.

## Medición separada del dominio

Se establece una lista positiva y guardas offline en `scripts/seo_scope.py`, reutilizando el importador histórico sin modificarlo:

1. **Detalle por página/indexación:** seleccionar solo las URL incluidas. No calcular métricas o prioridades de las fichas apartadas; las URL desconocidas quedan retenidas. Una tabla parcial no demuestra totales nativos del segmento.
2. **Series diarias exclusivas:** requieren evidencia revisada del filtro nativo exacto de las 11 URL, propiedad, fuente y archivo/hash. La declaración de filtro no sustituye la autenticidad del export; debe contrastarse con su procedencia.
3. **Comparaciones:** rechazan series globales sin vinculación al alcance y listas/hashes incompatibles. Se mantienen los requisitos de 60 días completos para 30 contra 30 y 180 para 90 contra 90, sin ceros para datos faltantes.
4. **Globales:** cualquier estadística de dominio que incluya fichas se etiqueta **general no filtrada** y se mantiene separada. No se presenta como logro corporativo exclusivo ni se obtiene un segmento restando valores supuestos de fichas.

Si el motor no permite filtrar el grupo o faltan datos suficientes, el resultado exclusivo se declara no disponible y se conserva análisis parcial por URL cuando sea legítimo. La guía [SEGMENTATION-v2.md](../../SEGMENTATION-v2.md) deja preparado el procedimiento para Google y Bing sin duplicar propiedades/configuraciones.

**Estado de indicadores:** no se añadieron exportaciones reales ni mediciones nuevas con esta corrección. Google/Bing del segmento, métricas generales del dominio, crecimiento orgánico y contactos atribuibles siguen desconocidos. No se convierten los antiguos informes técnicos o pruebas sintéticas en resultados de posicionamiento. [Línea base del nuevo alcance](baseline.json).

## Nueva versión de pruebas de IA

El [protocolo v2](../../AI-PROTOCOL-v2.md) contiene 12 consultas sin marca ni proyectos individuales: empresas de asesoría, asesoría independiente y conflictos de interés, primera vivienda, inversión y riesgos, educación hipotecaria, subsidios/FOGAES, elección de vivienda y conectividad. No afirma que Sollahms tenga una cualidad corporativa sin evidencia; esas consultas son pruebas de intención.

Se preparan **180 espacios nuevos**: 12 consultas × ChatGPT Search/Gemini/Perplexity/Google AI Overviews/Google AI Mode × tres días distintos. No se ejecutaron ni programaron automáticamente. El plan v1 de 180 permanece intacto como versión anterior y no se mezcla con v2.

Las respuestas originales se conservan. El resumen derivado solo acredita enlaces/citas a URL incluidas y menciones/recomendaciones de contexto corporativo. Una referencia exclusivamente a ficha no recibe crédito del segmento ni genera análisis del proyecto. Ambigüedades y URL no clasificadas permanecen desconocidas para el indicador correspondiente, en lugar de transformarse en ceros. Una prueba no ejecutada no puntúa. Se exige evidencia y revisión humana de las citas; no se usan llamadas API como sustituto de plataformas de consumo.

## Oportunidades y siguientes acciones

Estas prioridades son editoriales/comerciales provisionales, no un ranking basado en volúmenes o resultados no disponibles:

| Orden | Área incluida | Próxima intervención propuesta |
|---|---|---|
| P1 | Portada y servicios | Revisar claridad de identidad, proceso de asesoría, respaldo de afirmaciones y siguiente paso |
| P1 | Orientación, guía y comparador | Revisar recorrido educativo, fuentes y actualidad de financiamiento/beneficios sin alterar herramientas |
| P2 | Compra e inversión | Reutilizar comparación de etapas y riesgos; evitar duplicar el paquete del Lab sobre compra en verde |
| P2 | Entorno urbano | Revisar procedencia/fechas de información de conectividad e infraestructura |
| P2 | Catálogo, contacto y agenda | Evaluar navegación corporativa y captación atribuible a esas páginas, conservando funciones y destinos |
| P3 | Colaboración y privacidad | Mantener intención y métricas separadas de captación de compradores |

El [registro por página](included-page-priorities.json) indica las mejoras por revisar y sus límites. La siguiente acción de medición es obtener un export con filtro acreditado; la siguiente acción editorial es revisar un conjunto pequeño de páginas ya incluidas mediante el flujo existente del Lab. Ninguna depende de confirmar stock de proyectos.

El [nuevo contrato de coordinación](../../AI-LAB-HANDOFF.md) permite solo oportunidades del alcance incluido. No se escribieron datos en AI Lab, no se crearon paquetes ni páginas, no se consumieron créditos y no se envió ninguna notificación externa. Toda publicación futura requiere autorización.

## Validación y conservación

**Validación: 25 pruebas offline aprobadas (12 nuevas de alcance y 13 de compatibilidad con el importador histórico).** Las pruebas nuevas son fixtures offline de segmentación: exclusión positiva/negativa, URL desconocidas, bloqueo de series globales, comprobación de filtro, compatibilidad de alcance y resúmenes IA corporativos. No son otra auditoría técnica del sitio ni resultados reales de plataformas. El log y la [validación de conservación](validation.json) documentan la comprobación final.

No se desplegó, fusionó ni cambió el sitio público. La rama conserva desactivado su despliegue automático. El nuevo alcance y su historial quedan versionados para que la próxima intervención empiece en este punto.
