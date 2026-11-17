# SOLLAHMS — FASE 14 PROPUESTA: REVISAR EL CIERRE DE LAS CORRECCIONES DEL PR #32

Repositorio: lasopho/sollahms-web. PR: https://github.com/lasopho/sollahms-web/pull/32, abierto en Draft.
Rama técnica: codex/filtros-comerciales-fase10-20261117.
Checkout: /private/tmp/sollahms-filtros-comerciales-fase10-20261117.
HEAD local/remoto de cierre F13: 165f918aba402a0eb3313c85e144af2b4a7e8651.
Base sin cambios: codex/footer-sin-frase-20261116, daf16e7dd560301029357ce79a7af0b0e9a7e67b.
Producción y merge-base: b761ddeaea2fa526870e6af25658046e31b571d7.

Objetivo propuesto: revisión independiente del cierre de F12-01 a F12-04 antes de solicitar aprobación. La fase13 terminó con cuatro defectos corregidos y probados, cero parciales y cero pendientes de ese alcance. No implica aprobación, merge o publicación.

Verificar referencias y Draft antes de una nueva revisión activa; si cambiaron, reconciliar. Leer docs/catalog-data-completeness-20261116/leben/fase13-correcciones-pr32-20261117/: INFORME-FASE13-CORRECCIONES.md, RESULTADO-F12-01-04.json, PRUEBAS-REGRESION-FASE13.json y MANIFIESTO-HASHES-FASE13.json. Consultar F12 como evidencia anterior.

Revisar únicamente el delta e090d33 → 165f918: cinco archivos. El PR completo tiene diecisiete. Comprobar alcance de amenities por referencia sin asumir uso residencial desconocido; etiquetas españolas sólo de hechos elegibles; resumen financiero oculto en preparado y restaurado en publicados; aviso visible/accesible al fallar la fuente, incluso con paneles cerrados y URL normalizada.

F13 ejecutó 57/57 pruebas del motor, 10/10 filtros y 6/6 controles Chrome nuevos, más consultas puntuales de etiquetas y revisión independiente de cinco grupos nuevos. No sumar esos subconjuntos dos veces. F10 84/16 y cinco anchos son historia, no una repetición F13. No repetir suites si los archivos siguen idénticos; ante un defecto nuevo, preparar sólo su reproducción aislada. Durante esta revisión propuesta no modificar código ni resolver comentarios o cambiar estados del PR.

Los 155 archivos protegidos y las 131 fichas permanecen intactos; no se modificó el JSON de evidencia, precios publicados, direcciones, funciones, finanzas, formularios, Contacto, Centro de Orientación, CRM360, AI Lab o Resend. Las 454 referencias no son stock. Veinte precios y dos adicionales Suecia separados; 313 pendientes históricos sin cambios. No incorporar seis registros históricos, restaurar Patio Brasil o iniciar Euro.

Mantener vercel.json con la rama excluida de deployments. No Ready for Review, merge, publicación, promoción, cambios de main, dominios, SSO o variables sin autorizaciones expresas independientes. No generar builds de producción.

Documentación: codex/auditoria-leben-20261116, checkout /private/tmp/sollahms-auditoria-leben-20261116. Registrar únicamente resultados reales, actualizar NEXT-PROMPT.md y entregar el siguiente prompt completo. Si sólo se solicita continuidad sin activar una revisión concreta ni aportar novedades, no repetir comprobaciones o informes.
