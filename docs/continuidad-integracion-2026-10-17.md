# Continuidad e integración de Sollahms — 17/10/2026

## Resultado del lote

Rama de trabajo local: `codex/p3-continuidad-revision-20261017`, descendiente exacta de P2
`e3b66f806ebdbc032b704f9bf53ea0f33df7cb2a`. Se prepara una revisión en borrador sobre P2. Antes de publicar se comprobará
que el proyecto mantiene las Previews privadas y que esta rama no es Production;
la aceptación previa de una posible Preview privada continúa vigente. No se
autoriza ningún deployment público, merge a main o cambio remoto de Vercel.
Los 8 commits P1 y 20 commits P2 se conservan sin reescritura.

El cambio de producto se limita a seis clases de etiquetas de agenda, de 9 a
12 px. Usa la CSS local ya existente; todos los demás bytes de la página y su
lógica permanecen intactos. Las pruebas históricas retienen sus pins/assertions:
una proyección exclusiva de tests reconoce únicamente el sucesor completo y
revierte exactamente esas seis clases antes de las comprobaciones congeladas.
Los canarios rechazan cambios adicionales de identidad, horarios, enlaces o
operaciones del formulario. No se ha tocado ningún control real de publicación.

## Estados separados

| Capa | Estado verificable |
| --- | --- |
| P1/P2 publicados | PR #9 y #10 abiertos en borrador; checks públicos aprobados en sus SHA exactos. |
| Continuidad local | Etiquetas UX-003 implementadas; herramientas preparatorias de CSP y variantes añadidas. El runner exige 408 Node y 216 Python, manteniendo los 26 casos privados. Los resultados efectivos se conservan fuera del checkout. |
| Artefacto de release | No generado ni certificado. Referencia histórica, guardas, derechos, recursos y 26 casos privados siguen siendo requisitos independientes. |
| Production | Alias sigue en `dpl_9LvbrLDbZhho3Umm5Rmv6AMkauXE`, READY, declarado `f1e9bf1715cc99d095a367eba9028a9a1ad2b026`. Esto no prueba equivalencia de sus bytes con main ni con los 134 proyectos de P2. |
| Integraciones externas | Solo fixtures; no se prueban efectos reales, atomicidad distribuida ni políticas que no están disponibles. |

## Trabajo adicional preparado

- **UX-003:** seis labels de agenda corregidos; alcance y mutaciones cubiertos por tres nuevos casos. QA de reflow, teclado y tamaños se registra aparte, sin equiparar ampliación CSS con zoom nativo.
- **SEC-003:** `scripts/inventory-csp.py` inventaría HTML/CSS/JS locales, hashes inline y candidatos de orígenes. Distingue fuente de artefacto extraído y declara perfiles sin certificar. Sus políticas Report-Only permanecen inaplicadas: no cambia headers ni crea colectores. Ver [propuesta](proposals/p3-csp-report-only.md).
- **PERF-001:** `scripts/prepare-cover-variants.py` prepara candidatos reproducibles desde una shortlist revisada, fuera de todos los worktrees, con versiones fijadas de Pillow/libwebp y fuentes exactas. Hay 46 variantes para 23 portadas, conservando escena y original. No están integradas en runtime ni aprobadas para publicación. Ver [propuesta](proposals/catalogue-cover-variants.md).
- **Validación privada:** selección literal de los [26 casos pendientes y secuencia](proposals/private-validation-sequence.md), sin ejecutarlos ni rebajar el criterio de aprobación.

Las variantes candidatas seleccionadas todas a 480 px suman 740228 B frente a
6017816 B de originales (−87,699%); a 960 px, 2479950 B (−58,790%). Son cálculos
de archivos, no selección real currentSrc, LCP, CDN, DPR2 o aceptación visual.
La relación de aspecto de Vista Reloncaví exige revisar densidad/recorte antes
de elegir candidatos para tarjetas. No se alteran planos ni datos comerciales.

## Integridad y compatibilidad revisadas

main `3866095784367c23bbe33ff0d79e3ed111caade0` es ancestro de P1
`39006d3a6c96bd4154dd99eb6e914c5857393a3b`, y P1 es ancestro de P2. La lectura de
merge-tree produce exactamente los árboles P1 y P2, sin conflictos; no se hizo
merge a main. El catálogo, investigación, registro, sitemap, contextos de
formularios y rutas HTML conservan el mismo conjunto de 134 slugs, sin duplicados,
con 13 inmobiliarias. Esto verifica relaciones, no cotizaciones o stock actuales.

Antes del lote, la revisión dirigida aprobó 51 Node y 7 Python de relaciones,
catálogo e idempotencia; UX-003 aprobó 33 casos dirigidos (3 nuevos y 30 existentes).
No se presenta ninguno de esos conteos como sustituto del CI completo del SHA nuevo.

## Secuencia segura propuesta — NO ejecutada

La autorización de publicación de P2 no autoriza merge a main. Estos pasos quedan condicionados a autorización explícita de integración y a revalidar los SHA/estado remoto y las reglas aplicables. Production continúa requiriendo autorización separada y cierre de sus bloqueos.

1. Revalidar main = `3866095...`, P1 = `39006d3a...`, P2 = `e3b66f8...`, PR #9 base main y PR #10 base P1; ambas historias completas, los checks efectivos y el estado del sitio público. Si cualquier SHA cambia, detener el uso de esta conclusión y recalcular.
2. Con autorización de integración, retirar borrador de PR #9 y verificar sus checks. Integrar #9 mediante merge commit, sin squash/rebase y con condición de cabecera `39006d3a...`; conservar la rama P1 hasta retargetear #10. El árbol main resultante debe ser `8fe1cc5...`, y los 8 commits P1 deben seguir siendo ancestros.
3. Cambiar la base de PR #10 a main, sin reescribir P2. Mantenerlo en borrador hasta el cambio de base. Verificar que el diff sigue siendo exclusivamente P2 y que conserva exactamente los 20 commits. Comprobar merge-tree frente al main resultante; el árbol esperado sigue siendo `69c530b...` si no hay otros cambios.
4. Retirar el borrador de #10 DESPUÉS del cambio de base para generar `ready_for_review`. El workflow no escucha `edited`, por lo que sólo retargetear no garantiza una nueva ejecución. Esta secuencia permite nueva ejecución sobre la cabecera exacta sin commits vacíos ni cambios de workflow.
5. Verificar la ejecución real sobre `e3b66f8...`, su resultado completo, y cualquier Preview/estado de protección. Con aprobación de integración y checks válidos, integrar #10 mediante merge commit con condición de cabecera, conservando los 20 commits; no squash/rebase/cherry-pick. Confirmar árbol y ancestros después.
6. Volver a comprobar main, PRs, Production y dominios; no promover ni desplegar. La integración de fuentes no crea un artefacto publicable ni cierra los 26 casos privados/353 recursos y demás bloqueos externos.

## Bloqueos que requieren evidencia o decisión externa

| Área | Falta concreta | Siguiente paso verificable |
| --- | --- | --- |
| Recursos y derechos | 353 de 1039 recursos: Ingevec165, Ecasa130, Leben43, Sento6, León5, originales oficiales Ecasa4. El preflight verificó los otros686 por hash/estructura. | Paquete autorizado y manifiesto; no valen miniaturas reescaladas ni una URL pública como licencia. |
| Reservas FUN-001 | Apps Script original/contrato ausente, sin ledger durable ni operación atómica compartida entre instancias. | Backend versionado y entorno aislado; probar concurrencia y consulta de resultado. La mitigación web actual no certifica reserva única global. |
| Abuso SEC-001 | Proveedor distribuido, cuotas, cadena de proxy confiable, presupuesto, retención y responsable no definidos. | Decisiones de propietario + implementación atómica probada con mocks y proveedor seleccionado; no inventar límites ni contratar servicios. |
| Comercial CAT-002/003, FUN-003, SRC-003 | Fuentes actuales por campo/unidad/etapa, cuatro identidades residenciales sin oferta propia acreditada y escenario financiero comparable. | Mantener nulos/avisos/fechas retenidas hasta evidencia oficial exacta. La búsqueda de Drive no halló un paquete adicional utilizable. Los dominios oficiales no están permitidos por la política HTTP del entorno. |
| Planos, acceso y recorridos | Originales legibles y asignación por modelo/etapa; accesos/direcciones y escenas pendientes; tres baños y variante B.Come02 sin cierre. | Solicitudes precisas ya existentes en documentos P1/P2; no inferir escena por evento load ni geometría por iframe. |
| OPS-01 | Fuente Git declarada por un deployment CLI no demuestra bytes servidos ni paquete real. | Inventario del artefacto autorizado + lecturas estáticas y comparación. La API de archivos mostró archivos de transporte/lambdas, no un manifiesto de las páginas estáticas; no se descargaron archivos de origen privados ni se creó bypass. |
| OPS-02 | main sigue protected:false, sin rulesets aplicados. | Propuesta administrativa ya existente; aplicación requiere alcance del propietario. No se cambiaron reglas remotas. |
| CSP/variantes | Política y candidatos preparados, no integrados en perfiles reales. | Artefactos autorizados por perfil, QA de proveedores/tamaños/calidad y revisión específica; no habilitar una política incompleta ni cambiar guardas para obtener verde. |
| Release | Referencia histórica no certifica P1/P2; packager rechaza perfiles/rama no autorizados y conserva límites de derechos. | Autorizar y revisar la reconciliación de controles sobre el artefacto exacto, conservando restricciones y negativos. Después validación privada y Preview protegida aprobadas. |

## QA y límites de evidencia

Chromium se utiliza exclusivamente con archivos locales, requests externos
bloqueados y APIs sintéticas. El helper SUID nativo no funciona en este entorno
(propietario nobody; namespace UID map de solo lectura). El modo headless de CI
del proyecto puede ejecutarse dentro del aislamiento externo; no se afirma
haber validado la seguridad del sandbox propio de Chromium. Las capturas y el
reporte registran qué escenarios se ejecutaron realmente.

Los fixtures UF del harness solo contienen 12–14/10/2026. El día17 falla cerrado;
no se inventa una UF nueva ni se presenta la respuesta sintética como oficial.
La ampliación CSS no certifica zoom nativo ni tecnologías asistivas adicionales.

## Autorizaciones separadas

La integración de fuentes P1/P2, los controles administrativos y la publicación
Production siguen requiriendo autorizaciones separadas. La publicación de una
rama de revisión solo procede dentro del alcance vigente de Preview privada,
con la privacidad comprobada y sin cambios de configuración remota. Antes de pedir
una publicación definitiva deben completarse recursos/derechos, backend y abuso,
artefacto reproducible, 26 casos y QA obligatorio; CI fuente aprobado no los sustituye.
