# Reintento preflight — etapa 1 tributaria

**Resultado: candidato READY, privado, sin publicación.**
Revisión: 15/11/2026 UTC; build finalizado 15/11/2026 01:54:04.775 UTC (14/11/2026 22:54:04.775 America/Santiago). No constituye T0 editorial público.

## Causa y corrección
El intento dpl_5ZYYr4CJShFLAMm4VgcQad5c8Twx falló porque el manifiesto declaraba 43.025 bytes para un HTML de 43.024. La sustitución de noindex, nofollow por index, follow reduce cuatro bytes. El hash coincidía y la guarda de tamaño detuvo correctamente el build.

Se regeneraron las cuatro entradas mediante lectura binaria del archivo final (Path.read_bytes), len(bytes) y hashlib.sha1(bytes). No se corrigió manualmente un valor ni se estimaron tamaños. Una segunda lectura independiente comprobó tamaño y hash contra el manifiesto generado. Los tres recursos coinciden íntegramente con el candidato aprobado; el HTML solo difiere en meta robots.

| Ruta | Bytes reales | SHA-1 |
|---|---:|---|
| beneficios-tributarios-inmobiliarios.html | 43024 | `6808be8c8dcdc7def23527402fc66779dfafd06e` |
| assets/css/beneficios-tributarios.css | 8532 | `4f9cbb249ff49dc3476fabf660c5e7722432a320` |
| assets/js/beneficios-tributarios.mjs | 1569 | `9c836cea0c924bdfb6c319e411654615ab2ab5e8` |
| assets/js/beneficios-tributarios-engine.mjs | 1738 | `36cf2a497a877fc7f3cad868114894da8beb27cc` |

## Producción y preservación
El alias sollahms.cl se consultó antes y después: dpl_MnEt1RLpezr7atjVvYrehaGcE69D, SHA 941051c69d23c1069b68200b019fb020dbf2c722, updatedAt 1794705789853 sin cambio. No aparecieron cambios posteriores que incorporar. Se conserva el manifiesto de producción corroborado previamente con el archivo fuente de Vercel, SHA-1 57d94ca7ec2096aef562023881ba823462e4e4dc.

El build verificó el árbol completo, sin archivos adicionales ni faltantes, los hashes de 1.657 archivos y los tamaños disponibles en el manifiesto. Los 1.653 registros productivos se compararon íntegramente y permanecen iguales. Son exactamente cuatro adiciones; cero modificaciones o eliminaciones de archivos productivos. Los documentos de auditoría y el helper son fuentes de preparación, no archivos publicados del runtime.

Precisión de tamaños: el manifiesto histórico incluye tamaño explícito de 1.652 archivos; para release/functions/api/booking-create.func/api/booking-create.mjs solo registra SHA-1 6d7db117ea672122dee21b662cb8b505944245f1. Este archivo se preservó por referencia al mismo objeto y su hash se validó durante el build, pero no se afirma una comparación numérica independiente de su tamaño. El conector devuelve su contenido truncado. Esta limitación histórica no afecta la comprobación de integridad por hash ni las cuatro entradas regeneradas, cuyos tamaños sí se verificaron completamente.

## Candidato y build
- SHA del candidato: 2b9a49338ce090e8d4d3cac71107eb4b4efe2b80.
- Rama independiente: codex/tributarios-release-20261115.
- Deployment nuevo: dpl_4wFhnHbb3zsQGjzM7T8nop6g1uYY.
- URL: https://project-wrapp-b7wwptrqw-lsandoval2-8260s-projects.vercel.app/beneficios-tributarios-inmobiliarios.html
- Entorno de construcción: production, preparado sin dominio público; no se promovió el deployment fallido.
- Estado final: READY; aliasError null; alias [] en consulta final.
- Build completo: Build Completed in /vercel/output [2s]; Deployment completed.
- Guarda del build: productionStage1 true, preserved 1653, total 1657; lista de cuatro adiciones exacta.

## Dominio, configuración y acceso
Se comprobó en Vercel antes de crear el candidato: Auto-assign Custom Production Domains Disabled, checkbox desmarcado. No se ejecutaron escrituras de configuración global, asignaciones de dominio ni promociones. El updatedAt del proyecto permanece 1794524378045. Protección SSO all_except_custom_domains continúa habilitada.

Petición no autenticada al candidato redirige al login de Vercel; el 200 final corresponde al login y no se presenta como HTTP 200 de la guía. La sesión autenticada de Chrome abrió la página y confirmó URL del candidato, title y H1 correctos, robots index, follow y ausencia de IDs iva2026, dfl2027 y mayores2027. La URL pública de la guía sigue HTTP 404.

## Restricciones e incidencias
Sin cambios en las once páginas baseline, sitemap, robots, formularios, integraciones, ni PR 18/19/20. Ningún PR fusionado. Sin solicitudes de indexación ni T0 público. Las tres materias pendientes permanecen excluidas. No se repitió QA visual/funcional ya aprobado porque los recursos son idénticos y solo cambia robots en el HTML.

No quedan incidencias del manifiesto de los cuatro archivos nuevos. Se declara la limitación del tamaño histórico de un archivo descrita arriba. El candidato está listo para revisión del siguiente paso; cualquier publicación requiere autorización posterior conforme a esta fase. Antes de asignar un dominio deberá comprobarse nuevamente la producción y ejecutar las verificaciones de publicación que correspondan.
