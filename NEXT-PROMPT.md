# SOLLAHMS — pie corporativo global publicado y verificado

El encargo de unificar el pie de todas las páginas está publicado y verificado. Asignación productiva: **2026-11-19T17:58:29.425000-03:00**. Cierre del QA: **2026-11-19T18:04:27.261402-03:00**, America/Santiago. No repetir publicación ni reconstrucción al retomar este chat.

- Production actual certificado: `dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be`, READY/prebuilt; [sitio público](https://sollahms.cl/).
- Source de implementación: `e866ce7ac0d7b6df968ecd011fa78d6aec335828`; rama `codex/footer-global-home-20261119`; [PR #40](https://github.com/lasopho/sollahms-web/pull/40) abierto en Draft, sin merge.
- Pin de 1.729 archivos: `fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79`. Se verificaron 168 HTML y 152 fichas; contenido fuera del pie y del enlace CSS nuevo idéntico, 1.560 archivos existentes no HTML idénticos, siete funciones/57 archivos conservados.
- Tres matrices Chrome de 840 casos (1440/1024/768/390/320), dos pruebas HTTP de los 168 HTML y comprobación nativa de los 1.729 archivos, cinco aliases, SSO/configuración y un solo Production nuevo.
- El mismo ID aislado fue promovido sin rebuild. Rollback conservado: `dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn`. La base de este encargo fue GCS publicado el 19/11 a las 16:56:11.782 y su HEAD documental `9f43dc0a20dbd8711609ea4e5461eb0aaab8c142`; no el deployment histórico del 16/11 ni main.

Leer `AGENTS.md`, [informe de cierre](docs/footer-global-home-20261119/INFORME-CIERRE.md), [cierre verificable](docs/footer-global-home-20261119/release/publication-closure.json), [manifiesto](docs/footer-global-home-20261119/release/closure-manifest.json) y [prompt completo](docs/footer-global-home-20261119/SIGUIENTE-PROMPT.md). El NEXT anterior está preservado exactamente en `docs/footer-global-home-20261119/history/NEXT-PROMPT-before-global-footer-20261119.md` como historia.

La plantilla `templates/corporate-footer.html`, `scripts/corporate_footer.py`, CSS aislado y cuatro hooks mantienen un único pie. Las 152 fichas no son byte-idénticas completas: se conservó lo exterior al pie y al enlace CSS añadido. En móvil/tablet hay 48 px adicionales de área inferior para evitar superposición del control de privacidad; consentimiento y scripts de medición permanecen iguales.

QA usó fixtures explícitas para mapas y respuestas API503/UF; no verificó el proveedor de mapas ni consultó UF real. Pie estático/sin desvanecimiento ancestral: 840 casos por fase; motion principal: muestra de Inicio en cinco anchos, preservación por hashes en las demás páginas. Se rechazaron opcionales en las doce páginas medidas sin SDK/POST; cero envíos comerciales. No se atribuyen posiciones, indexación, citas IA o resultados de negocio.

Para cualquier trabajo SEO/GEO o nueva publicación, partir de `docs/seo-measurement/STRATEGY-v3.md`, estudios del 25/29 de octubre y `active-policy.json`; mantener separado Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot. La política y sus doce URL siguen intactas. Este cambio de presentación tiene su registro actual aquí; los registros estratégicos previos son antecedentes.

Antes de actuar otra vez, reconsultar producción, cinco aliases, HEAD y PR remotos, conciliar cualquier avance posterior y preservar el artefacto completo. Los commits de cierre posteriores al source publicado son documentales y no requieren otro deployment. No reutilizar esta autorización para nuevas publicaciones o fusiones. Sin encargo nuevo, informar el cierre y mantener el sitio intacto.
