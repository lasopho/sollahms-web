# SOLLAHMS — cierre del pie corporativo global publicado

Las 168 páginas públicas comparten el pie de la portada: contenido corporativo, logotipo, contacto, WhatsApp, navegación y enlaces legales. Se unificaron diez implementaciones anteriores. Las 152 fichas conservan su contenido fuera del pie y del enlace CSS añadido; sus archivos HTML completos cambiaron.

La asignación de dominios quedó registrada el **2026-11-19T17:58:29.425000-03:00**, America/Santiago. El QA público y el cierre documental se completaron el **2026-11-19T18:04:27.261402-03:00**. Son momentos distintos.

- Production definitivo: `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`, READY/prebuilt.
- Source de implementación publicado: `e866ce7ac0d7b6df968ecd011fa78d6aec335828`; rama `codex/footer-global-home-20261119`.
- Base productiva preservada para rollback: `dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn`, source `d7ad0795a561a9b69999b421fd9eef519adfee26`; continuidad Git `9f43dc0a20dbd8711609ea4e5461eb0aaab8c142`. La base se publicó el 19/11 a las 16:56:11.782, America/Santiago.
- Inventario: `fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79`; base `f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e`.
- [PR #40](https://github.com/lasopho/sollahms-web/pull/40) abierto en Draft, sin merge. Los commits posteriores de documentación no requieren otro deployment.

## Cambio y preservación

El artefacto contiene 1.729 archivos: 168 HTML modificados, una hoja `corporate-footer.css` nueva y 1.560 archivos existentes no HTML idénticos. Se conservan siete funciones/57 archivos, datos de los 152 proyectos, recursos previos, configuración v3, robots, sitemap, medición consentida y preferencias de entrenamiento. El manifiesto compara SHA1/SHA256, tamaños y todos los paths; la fuente publicada y el paquete productivo anterior quedan recuperables.

La comparación de los 168 documentos acredita igualdad de los bytes exteriores al pie, permitiendo únicamente el enlace a la nueva hoja CSS. No acredita igualdad de los HTML completos de las fichas. Se utiliza una plantilla compartida y un helper final; cuatro hooks de autoría impiden que una regeneración posterior restaure pies distintos. Se añade únicamente el guard de despliegue automático de esta rama. No se ejecutaron builds generales, generadores históricos ni reconstrucciones desde main.

Se mantiene la composición, la fuente local, la identidad y los once destinos del pie de Inicio. En anchos inferiores a 1.024 px se reservan 48 px adicionales de espacio inferior (80 px en total) para que el launcher de privacidad no cubra los enlaces; el ajuste se aplica a todas las páginas y no cambia el widget de consentimiento. El escritorio conserva 32 px. El resto de la geometría se contrasta con la referencia de Inicio y con el pie común.

## Validación

Anchos: 1440, 1024, 768, 390 y 320 px. Se verificaron componente único, textos, logotipo, fuentes, colores, alineación, enlaces, activación de WhatsApp sin navegación externa ni mensajes, ausencia de overflow del pie/contenedores vacíos e interacción con consentimiento. El pie estático y sin desvanecimiento ancestral se prueba en los 840 casos de cada fase. Motion/reduced motion del contenido principal se comprueba únicamente en una muestra de Inicio en los cinco anchos; para las demás páginas se acredita preservación por los bytes exteriores al pie y scripts/CSS intactos, sin afirmar una nueva prueba global de motion.

| Fase Chrome | Casos aprobados | Páginas | Capturas verificadas | Rechazar opcionales |
|---|---:|---:|---:|---:|
| local | 840/840 | 168 | 840 | 12 |
| isolated | 840/840 | 168 | 840 | 0 |
| public | 840/840 | 168 | 840 | 12 |

Las tres matrices totalizan 2.520 casos y 2.520 capturas con SHA256. El hostname protegido no activa la lógica de consentimiento reservada al origen canónico. Local y público comprueban rechazo en las doce páginas incluidas, sin SDK opcionales ni POST.

- isolated: 172 GET aprobados; 168 HTML y 168 comparaciones exteriores al pie; 11 destinos/anclas.
- public: 174 GET aprobados; 168 HTML y 168 comparaciones exteriores al pie; 11 destinos/anclas.

La comprobación nativa final aprobó 29 controles y los 1.729 archivos remotos; conserva cinco aliases, fechas de creación, redirects, SSO, flags de automatización y metadatos de variables. La autorización produjo exactamente un Production nuevo: se creó sin dominios, se verificó y se promovió el mismo ID, sin reconstruir.

Los iframes de mapas usan fixtures explícitas para la prueba de geometría; se conservaron markup y destinos originales, pero no se verificó el proveedor externo de mapas. Las API usan indisponibilidad 503 de prueba, incluida UF: no se realizaron lookups reales ni se certificó una nueva cifra UF. No hubo formularios, solicitudes comerciales, mensajes, correos, reservas o escrituras CRM. Los hallazgos preexistentes fuera del pie permanecen diferenciados en los resultados de navegador.

## Dominios y recuperación

- `sollahms.cl` → `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`.
- `www.sollahms.cl` → `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`; 308 hacia `sollahms.cl`.
- `sollhams.cl` → `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`; 308 hacia `sollahms.cl`.
- `project-wrapp.vercel.app` → `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`.
- `project-wrapp-lsandoval2-8260s-projects.vercel.app` → `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`.

SSO `all_except_custom_domains`, `live=false`, autoasignación false y previews automáticas deshabilitadas permanecen intactos. `dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn` conserva READY/Production y elegibilidad de rollback; no se ejecutó rollback. La configuración productiva v3, los ajustes del proyecto, los metadatos de variables y las siete funciones permanecen iguales; la fuente `vercel.json` incorpora solo el guard false de esta rama.

## Continuidad SEO/GEO y límites

El trabajo sigue el estudio del 25/29 de octubre y `STRATEGY-v3.md`: corrige identidad visible y vías de consulta inconsistentes. La política `corporate-education-v3` y sus doce URL, GA4/Clarity y su consentimiento se conservan. Catálogo/fichas reciben únicamente el cambio visual solicitado expresamente; siguen fuera de optimización SEO/GEO.

Para Google se comprueban HTML y enlaces, sin acreditar rastreo, indexación o posiciones. Para OpenAI/ChatGPT Search no se ejecutaron observaciones ni se acreditan menciones, citas o recomendaciones. Para Bing/Microsoft Copilot no se midió un efecto. Publicar este pie no demuestra mejoras de búsqueda ni resultados comerciales. Los registros SEO anteriores se conservan como antecedentes y no sustituyen el estado productivo documentado aquí.

## Evidencia y siguiente paso

`candidate-manifest.json`, `html-preservation.json`, `implementation-proof.json`, `release/source-preservation.json`, `release/closure-manifest.json`, los recibos de autorización/creación/promoción, las verificaciones nativas y las matrices HTTP/Chrome sustentan el cierre. El NEXT del 16/11 se conserva sin cambios en `history/NEXT-PROMPT-before-global-footer-20261119.md`; `NEXT-PROMPT.md` y `SIGUIENTE-PROMPT.md` describen el estado actual.

El helper no hace push, merge, build, deployment ni cambios Git. El agente raíz genera los checksums finales después de cerrar los documentos y registra el commit documental. Sin un encargo nuevo, no hay otra publicación pendiente.
