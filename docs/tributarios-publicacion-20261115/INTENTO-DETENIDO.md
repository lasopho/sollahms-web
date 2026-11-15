# Publicación tributaria etapa 1 — detenida

No publicada. Se respetó la condición de parada ante fallo de comprobación del paquete.

## Referencias
- Producción comprobada antes y después: dpl_MnEt1RLpezr7atjVvYrehaGcE69D.
- SHA de producción: 941051c69d23c1069b68200b019fb020dbf2c722.
- Candidato aprobado: ac93d006d3a676d3ac6ace74c0e0936135de0ccb; dpl_4XSMADVJg6iE752tEKZkGWhSgEzG.
- Nuevo commit independiente: 19f1901f1b23342643924edcfe41e9eb8ddd70fd.
- Rama: codex/tributarios-release-20261115.
- Intento de build: dpl_5ZYYr4CJShFLAMm4VgcQad5c8Twx, ERROR, sin asignación de sollahms.cl.

## Preservación y alcance
Se creó el commit sobre la producción vigente, con cuatro adiciones: beneficios-tributarios-inmobiliarios.html, assets/css/beneficios-tributarios.css, assets/js/beneficios-tributarios.mjs y assets/js/beneficios-tributarios-engine.mjs. Única diferencia del HTML frente al aprobado: meta robots de noindex, nofollow a index, follow. Los tres recursos permanecen idénticos. No se modificaron archivos existentes. El manifiesto base de 1.653 archivos se corroboró mediante SHA-1 57d94ca7ec2096aef562023881ba823462e4e4dc del archivo fuente candidate-manifest.json de producción.

Se comprobó en la interfaz de Vercel que Auto-assign Custom Production Domains estaba Disabled. No se cambiaron ajustes globales.

## Incidencia bloqueante
El manifiesto enviado al build contiene un tamaño incorrecto para el nuevo HTML: 43.025 bytes frente a 43.024 reales. El error fue del cálculo del tamaño en la preparación: reemplazar noindex, nofollow por index, follow reduce cuatro bytes, no tres. La guarda de hash pasó para ese archivo (6808be8c8dcdc7def23527402fc66779dfafd06e), y la guarda de tamaño detuvo el build con ERR_ASSERTION, BUILD_UTILS_SPAWN_1. No se completó la certificación integral del paquete ni se aprobó su publicación.

Error del build registrado en 1794707358848 ms Unix. Se conserva el intento fallido como evidencia. Corrección pendiente: regenerar el manifiesto desde los bytes efectivos, reconstruir un candidato y repetir las comprobaciones previas antes de cualquier asignación. No se reintentó tras el fallo, conforme a la condición de parada.

## Estado final
- Dominio productivo intacto, confirmado por API después del fallo.
- No se fusionaron PR, no se asignaron dominios, no se solicitó indexación ni se cambió sitemap/robots.
- No hubo publicación; no existe SHA nuevo publicado ni T0 editorial público de esta intervención.
- QA público posterior y capturas de publicación: no corresponden, al no haberse publicado.
