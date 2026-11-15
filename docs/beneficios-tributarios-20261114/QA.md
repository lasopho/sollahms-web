# Auditoría del candidato privado

Corte normativo: 14/11/2026, America/Santiago. Cierre técnico: 15/11/2026 UTC. Estado: listo para revisión privada; no constituye autorización de publicación ni dictamen tributario profesional.

## Identificación

- PR en borrador: https://github.com/lasopho/sollahms-web/pull/19
- Rama: codex/beneficios-tributarios-20261114.
- Base independiente del PR: codex/base-tributarios-20261114. No se modifica PR #18.
- SHA del código desplegado: bc50a76176cea7005135e864f27a06204a2803c4.
- Deployment final READY: dpl_8jcFzUhUVk1ZcjCWwJQtjfJ2FW7B.
- Vista: https://project-wrapp-aq2tnjo6k-lsandoval2-8260s-projects.vercel.app/beneficios-tributarios-inmobiliarios.html
- Protección: SSO de Vercel; noindex,nofollow. No se cambió la configuración de protección.
- Producción comprobada al inicio y al cierre: dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy, SHA 0e750eb3afe7424726ea770a3963e324bd1d8339.
- T0 editorial público: pendiente. No se solicitó indexación.

## Alcance y regresiones

Los logs del build final acreditan 1.657 archivos runtime: 1.653 preservados mediante hashes y exactamente cuatro añadidos. Sin modificaciones de las 11 páginas históricas, sitemap, robots, formularios, funciones o integraciones. La prueba de conservación es de contenido del artefacto; no se repiten transacciones de CRM ni envíos comerciales. El preparador rechaza entornos distintos de preview. Los documentos y capturas se incorporan después mediante un commit de evidencia, sin cambiar el código desplegado.

## Resultados

| Revisión | Resultado |
|---|---|
| Motor educativo | 6 pruebas Node; incluye 1.080 combinaciones de respuestas |
| HTML y SEO | Un H1, 52 ID únicos, 6 FAQ coincidentes con contenido visible, canonical y OG propios |
| Enlaces internos | Destinos y anclas existentes; sin enlaces internos rotos en comprobación estática |
| Datos | Sin formulario, RUT, renta, persistencia, llamadas API o dependencias nuevas |
| Reflow Chrome | 320, 390, 768 y 1440 px, sin desbordamiento horizontal observado |
| Interacción | Persona/empresa, objetivo y condición actualizan temas; advertencia de uso personal; mostrar todos; apertura de tarjeta por ancla |
| Navegación móvil | Apertura/cierre, Escape y devolución de foco comprobados |
| Accesibilidad manual | Etiquetas, grupos, aria-live, foco visible, teclado y contraste revisados |
| Contraste | Pares de texto evaluados superan 4,5:1; evidencia contrast.json |
| Consola | Sin errores ni advertencias en revisión final |
| Rendimiento | 59.161 bytes añadidos sin comprimir, cuatro recursos propios; no se ejecutó Lighthouse ni se certifican Core Web Vitals |
| Fuentes | Normativa BCN e instrucciones SII contrastadas; matriz detallada con fuente y fecha |

Compatibilidad verificada en Chrome conectado. No se certifica cumplimiento integral WCAG, lector de pantalla ni comportamiento en Safari/Firefox. La disponibilidad de enlaces oficiales se comprobó mediante recuperación documental; no es una garantía futura de disponibilidad. El calendario SII tuvo extracción limitada y se corroboró con normativa y anuncios oficiales.

## Hallazgos por severidad

| Severidad | Hallazgo | Resolución / estado |
|---|---|---|
| Crítica | No se identificaron afirmaciones tributarias críticas sin respaldo en la revisión documental | Si aparecen antes de publicar, bloquean recomendación de publicación |
| Media | Circulares de aplicación de Ley 21.850 en consulta al corte | Se identifican como consulta, no norma definitiva. Revalidación obligatoria antes de publicación |
| Media | ID duplicado entre ficha y selector DFL2 en candidato intermedio | Corregido; 52 ID únicos en candidato final |
| Media | Enlace SII anterior de artículo 55 bis devolvía error de recuperación | Sustituido por página oficial Operación Renta 2026 verificada |
| Media | Cobertura de accesibilidad y navegadores limitada a revisión manual Chrome | Pendiente auditoría integral si se exige certificación WCAG; no se declara certificación |
| Baja | Primer build rechazado por tamaño ausente en algunas entradas del manifiesto heredado | Validación de tamaño solo si informado, hash obligatorio siempre; build final aprobado |
| Baja | Sin medición de campo ni Lighthouse | Sin afirmaciones de puntuación o velocidad garantizada |

La revisión jurídica es documental y educativa, no asesoría tributaria para una operación concreta. No se presenta la compra como gasto inmediato, el IVA como recuperable automáticamente, las 8.000 UF como cupo anual, ni las dos viviendas DFL2 como libre elección. Se diferencia la ventana transitoria de adquisición de la duración del régimen opcional. Ley 21.631 se muestra como cerrada a nuevas adquisiciones dentro de su ventana original, con posibles efectos para beneficiarios anteriores.

## Entrega y futura publicación

MATRIZ.md resume los 16 temas. matriz-beneficios.json contiene requisitos, limitaciones, vigencia, ejemplos y fuentes. preview-320.jpg, preview-390.jpg, preview-768.jpg y preview-1440.jpg corresponden al deployment final. Se conserva README.md con estrategia SEO/GEO y propuesta de enlaces.

Antes de una publicación expresamente autorizada: revalidar instrucciones tributarias finales; comparar nuevamente producción; preparar candidato publicable independiente; revisar noindex solo de esta página; decidir por separado sitemap/enlaces entrantes; registrar T0 propio. No promover automáticamente esta preview ni fusionar este PR.
