# Guía de modalidades de compra · 29/10/2026

Página: https://sollahms.cl/cuando-comprar-propiedad.html

Incluye tres modalidades equilibradas, ocho factores comparativos, orientación de cuatro preguntas, ocho FAQ, ejemplos cotidianos, riesgos visibles y fuentes oficiales centralizadas al final. No añade enlaces al menú principal. Conserva la identidad, iconos SVG de trazo uniforme y movimiento reducido.

## Archivos centrales

- `data/purchase-stage-content.json`: textos originales, FAQ, comparaciones y registro de fuentes.
- `scripts/build-purchase-stage-guide.py`: página estática y componente de referencias.
- `assets/css/purchase-stage.css`: diseño responsive aislado; tema corporativo compartido al final.
- `assets/js/purchase-stage-engine.mjs`: reglas explícitas, resultados múltiples y condiciones pendientes; sin puntuaciones, probabilidades ni rentabilidades.
- `assets/js/purchase-stage-guide.mjs`: controles accesibles y resultado en memoria; no hay almacenamiento, envío ni datos personales.
- `scripts/purchase_stage.py`: clasificación a partir del catálogo y su auditoría existente, sin duplicar inventario ni precios.
- `data/purchase-stage-verifications.json`: evidencia comercial complementaria para las ofertas inmediatas revisadas; no es un inventario de unidades ni una certificación legal.
- `scripts/build-catalog-facets.py` y `data/catalog-facets.json`: una nueva faceta compartida por Tarjetas, Listado y Mapa.
- `assets/js/catalog-filter-engine.mjs` y `catalog-filter-controls.mjs`: parámetro repetible `modalidad`, controles visibles, etiquetas removibles y combinación con filtros existentes.
- `scripts/purchase_stage_links.py`: tarjeta de Guía hipotecaria, enlaces contextuales y footer idempotentes; conectado a los generadores habituales.

## Integración y verificación comercial

Revisados los 131 proyectos. Se incorporó un enlace contextual a cada ficha y un enlace de footer en las 142 páginas públicas. La guía hipotecaria conserva su bloque CMF al final; la nueva tarjeta aparece antes. El catálogo enlaza la guía sin crear otro inventario.

Resultados con evidencia suficiente: 4 en blanco, 17 en verde y 4 con oferta comercial inmediata revisada (San Ignacio, Domeyko 2055, Angamos 205 y Centenario 1). Los restantes 106 no entran en el filtro guiado; siguen en el catálogo general. Ver `stage-audit.json` para la razón por proyecto. No se cambian sus estados originales ni precios.

La revisión comercial de entrega inmediata contrasta la denominación del proyecto y una oferta activa en su web oficial el 29/10/2026. No certifica títulos ni garantiza stock en tiempo real. Las páginas explican que la unidad, la recepción u otra habilitación legal y la entrega efectiva se deben confirmar al cotizar. Se excluyen recepciones pendientes, vendidos, datos contradictorios y disponibilidad no revisada. No se importan precios promocionales de las fuentes.

## Mantenimiento

Actualizar los estados en las fuentes habituales del catálogo y volver a ejecutar `python scripts/build-catalog-facets.py`. Para habilitar entrega inmediata, revisar la oferta exacta, disponibilidad publicada, estado, fuente y fecha en `purchase-stage-verifications.json`; el `referenceStage` debe coincidir con el catálogo. Si deja de estar confirmada, retirar la verificación. Una fecha futura, una torre hermana o «En recepción final» nunca justifican una asignación automática.

Modificar los textos en `purchase-stage-content.json` y ejecutar `python scripts/build-purchase-stage-guide.py`. El generador de Guía hipotecaria usa la tarjeta común. Los generadores de fichas y marca aplican los enlaces compartidos. Se deben revisar las fuentes normativas al cambiar la legislación y revalidar periódicamente las ofertas comerciales.

## Pruebas

- 18 pruebas de orientador y filtros: 72 combinaciones, respuestas inválidas, conflicto entre plazo y pie, resultados múltiples, URL, datos faltantes y conservación del precio.
- 21 regresiones de simulador hipotecario y formularios comerciales/cotización.
- 131 fichas: encabezados, formularios, scripts, figuras y datos comerciales idénticos antes y después de la inserción puntual.
- Navegación local y anclas, un H1 por guía, IDs únicos, fuentes al final, 8 FAQ y 8 filas comparativas.
- Publicación mediante paquete congelado: funciones, datos comerciales, ruta retirada Patio Brasil410 y sincronización de nueve registros de servidor conservados. Despliegues automáticos desactivados.

Interfaz revisada en 1440×1000, 768×1024 y 390×844: sin desbordamiento general; navegación móvil, tabla desplazable por teclado, FAQ, orientador, URL con múltiples modalidades, cuatro resultados inmediatos en las tres vistas, 21 resultados blanco/verde, enlaces a fichas y a la guía, y simulador existente. Se ajustaron legibilidad en tablet, contraste y área de activación de enlaces contextuales. No se enviaron leads reales. Ver `ui-verification.json` y constancia de producción.

## Fuentes y límites

SERNAC (contratos preparatorios, compromisos de entrega, desistimiento y derechos financieros); BCN (LGUC y Ley 21.718); Diario Oficial (reglamentación de 23/02/2026); CMF Educa (evaluación hipotecaria). Enlaces identificables en la sección final. Investigación en `research.json`.

El régimen de anticipos del art. 138 bis tiene alternativas y exclusiones; no se promete restitución automática ante cualquier desistimiento. La recepción municipal pendiente no equivale a entrega inmediata; la norma contempla regímenes específicos de habilitación. El rechazo de crédito requiere revisar causas, contrato y derechos del consumidor.

Las fuentes fueron contrastadas en resultados y documentos oficiales. El acceso automatizado directo de algunas páginas SERNAC agotó el tiempo de respuesta; los enlaces están indexados oficialmente, pero no se afirma comprobación HTTP completa de esos servidores externos.

## Publicación

Producción autorizada tras la verificación. Commit de implementación: `1369697b2dbd1c9d614ec1ad8a62c7cd715c32a7`, rama `codex/purchase-stage-guide-20261029`. Despliegue: `dpl_CwKecmoAPWkxhdbheFWEWfx3nntF`. El paquete de producción debe coincidir con el preview final `dpl_et4bufFsTsv3wmWPp2SC5XhkwKQt`; huella esperada `4471f98caeb988815818d36eb6052fa5baa3059eaab0cc75137ade2eee15244b`. Constancia y comprobaciones públicas en `production.json`. Main permanece sin modificar.
