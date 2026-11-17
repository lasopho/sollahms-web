# SOLLAHMS — FASE 13 PROPUESTA: CORREGIR LOS CUATRO HALLAZGOS DEL PR #32

Objetivo: corregir únicamente F12-01 a F12-04 y comprobar sus regresiones locales. La revisión F12 terminó con dictamen Requiere cambios y no modificó código. Este prompt propone la siguiente etapa; durante F12 no se ejecutaron estas correcciones.

Repositorio: lasopho/sollahms-web. PR existente: https://github.com/lasopho/sollahms-web/pull/32, abierto en Draft.
Rama técnica: codex/filtros-comerciales-fase10-20261117.
Checkout: /private/tmp/sollahms-filtros-comerciales-fase10-20261117.
HEAD revisado: e090d33d71cd98a6919e589f7ec66168216c94ba.
Base del PR: codex/footer-sin-frase-20261116, daf16e7dd560301029357ce79a7af0b0e9a7e67b.
Producción y merge-base: b761ddeaea2fa526870e6af25658046e31b571d7.

Antes de cambios reales verificar PR, HEAD local/remoto, base, árboles limpios, producción y ausencia de deployments nuevos. Si cambiaron referencias, reconciliar antes de continuar. Mantener la exclusión de deployments de la rama en vercel.json.

Leer docs/catalog-data-completeness-20261116/leben/fase12-revision-pr32-20261117/: DICTAMEN-FASE12-PR32.md, RESULTADO-REVISION.json, manifiesto y reproducciones. Consultar F10/F11 como historia; no rehacer la auditoría documental ni regenerar datos.

Correcciones delimitadas:
1. F12-01, commercial-filter-engine.mjs:142: comprobar amenities según tipo/alcance de la referencia coincidente. Indi UF8560 + gimnasio no debe aceptar el local OWN4-P011 aunque no se seleccione tipo. Conservar AND/OR y desconocidos.
2. F12-02, commercial-filter-engine.mjs:151: buscar etiquetas públicas españolas de hechos confirmados y con alcance válido. Living Town debe encontrarse con piscina, sin exigir la clave técnica pool.
3. F12-03, catalog.mjs:85: impedir que el resumen financiero de publicados permanezca visible en preparado. Conservar el funcionamiento correcto al volver a publicados, sin tocar fórmulas o módulos financieros.
4. F12-04, catalog.mjs:109 y catalog-filter-controls.mjs:86: al fallar la fuente preparada solicitada, mostrar un aviso visible/accesible y no ocultar la sustitución mediante el panel cerrado o la reescritura de URL.

Reutilizar las reproducciones puntuales para verificar los cuatro casos y ejecutar sólo las regresiones afectadas por cambios reales. F10 certificó 84/84 Node y 16/16 Chrome; F12 no repitió esas suites. No declarar un defecto corregido sin evidencia nueva de su resultado.

Preservar los 155 archivos protegidos, las 131 fichas, datos y precios publicados, direcciones, módulos financieros, Contacto, Centro de Orientación, formularios, funciones serverless, CRM360, AI Lab y Resend. No editar el JSON de evidencia para forzar resultados. Los 454 registros no son stock; los veinte precios y dos adicionales Suecia permanecen separados. Los 313 pendientes siguen intactos. Own publicado ya está etiquetado Vendido y sin precio; no modificar ese caso descartado como defecto. No incorporar los seis registros históricos, restaurar Patio Brasil ni iniciar Euro.

Trabajar sólo en el checkout técnico; no usar el checkout original con cambios ajenos. Tras validar correcciones, actualizar la misma rama y el PR #32 sin recrearlo, sin force push y manteniéndolo en Draft. La documentación permanece en codex/auditoria-leben-20261116, checkout /private/tmp/sollahms-auditoria-leben-20261116. Registrar únicamente cambios y resultados reales, actualizar NEXT-PROMPT.md y entregar el siguiente prompt completo.

No marcar Ready for Review, fusionar, crear deployments, publicar, promover ni modificar main, dominios, SSO o variables. Esos pasos requieren autorizaciones expresas independientes. Si sólo se solicita continuidad sin activar la etapa de corrección o aportar una acción nueva, no iniciar otro ciclo de comprobaciones o informes.
