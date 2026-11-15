# Continuidad — Sollahms: eliminación global de recorridos virtuales

Continúa en `lasopho/sollahms-web`, rama `codex/eliminar-recorridos-global-20261115`. Lee `AGENTS.md` y `docs/recorridos-eliminacion-20261115/INFORME-CIERRE.md`. No ejecutes publicaciones por el solo hecho de recibir este prompt.

Estado técnico verificado el 15/11/2026, America/Santiago:
- Base reciente: `codex/agenda-regions-responsive-20261115`, commit `c2e1965ced736d46917a1bee286456cb937d58fe`. `main` está desactualizado respecto de las fichas productivas; no lo uses para reconstruirlas.
- Implementación: `49476ea5f45b6eb9778b9f780d82e2c86720e0c3`. Prevención adicional y evidencias definitivas: `a64cbfb762e7b2df157eedb1f1fdc136baf2031f`. Cierre documental inicial: `26a413367729debc40b88029663b8cbd68f9797f`. Verifica el HEAD remoto para actualizaciones documentales posteriores; conserva cambios ajenos.
- Las 131 fichas originales coincidieron byte por byte con producción. Se retiraron 49 secciones, 73 iframes y 74 enlaces de recorridos. Cambian 64 fichas, dos CSS y los controles de generación/migración. No repitas la eliminación ni importes generadores históricos sobre los archivos actuales.
- Fotografías, galerías, planos, videos promocionales, formularios, mapas, precios, metadatos, JSON-LD y enlaces sobrevivientes tienen comparación de preservación independiente. `#etapa-2` de Núcleo Costanera se conservó.
- Pasan cinco pruebas Python, tres Node y 393 comprobaciones Chromium en 131 fichas a 1440/768/390 px. Cero recorridos, errores JavaScript, overflow, secciones vacías e imágenes rotas. Hay 27 capturas. El entorno bloqueó Google Maps en 351 vistas; sus iframes se preservaron, pero no se certificó su carga externa. No se enviaron formularios.

Producción y paquete preparado:
- Proyecto Vercel `project-wrapp`, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`; equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`.
- Deployment productivo observado al cierre: `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. Su SHA Git no está expuesto. No atribuyas a producción el SHA de la rama.
- Manifiesto productivo fuente SHA-1 `e557204aa1ea36c5216ec5b8271393f037770bf0`. En `docs/recorridos-eliminacion-20261115/` están `production-manifest.json`, `candidate-manifest.json`, `runtime-changes.json` y `prepare-preview.mjs`.
- El paquete conserva 1.660 archivos runtime: 66 cambios permitidos y 1.594 archivos idénticos, incluidas las 57 entradas de funciones. El constructor exige `VERCEL_ENV=preview` y verifica rutas y hashes. No uses el packager histórico ni elimines sus guards.

Bloqueo real:
La revisión automática rechazó crear el deployment privado del sitio completo y crear el PR en GitHub, alegando falta de autorización explícita para esos payloads y destinos. No existe PR ni deployment de esta tarea; no hay URL de Preview. La rama sí se guardó en GitHub. Lee `bloqueos.json` y `solicitud-aprobacion.json` en el directorio del cierre. No eludas el rechazo mediante CLI, otra cuenta o una operación indirecta.

Próximos pasos ordenados:
1. Verifica rama, árbol de trabajo, HEAD remoto y deployment asociado a `sollahms.cl`. Reutiliza las evidencias si el contenido no cambió; conserva cualquier cambio productivo posterior.
2. Comprueba si el usuario otorgó después del rechazo autorización explícita para crear el PR en borrador en este repositorio y desplegar el paquete completo, funciones incluidas, exclusivamente como Preview privada en el proyecto/equipo indicados. Si falta, solicita esa autorización concreta y mantén bloqueadas esas acciones.
3. Sólo con esa autorización, crea el PR en borrador: head `codex/eliminar-recorridos-global-20261115`, base `codex/agenda-regions-responsive-20261115`. No fusionarlo. No sustituir la base por `main` sin revisar el delta histórico.
4. Sólo con esa autorización, crea la Preview privada desde el paquete congelado verificado. Conserva SSO `all_except_custom_domains`, funciones y datos idénticos fuera de los 66 cambios. No ampliar acceso ni divulgar secretos. Espera READY y comprueba manifiestos y entrega HTTP; registra ID y URL reales.
5. Completa el QA que dependa del deployment. Si es posible en el entorno autorizado, comprueba Google Maps. Valida contactos sin enviar leads reales ni activar proveedores.
6. Añade un cierre versionado con PR, deployment, SHA y limitaciones reales; actualiza `NEXT-PROMPT.md`, registra el commit documental y entrega enlaces y el prompt íntegro. No sobrescribas documentación histórica.

Autorizado: lecturas, verificaciones, correcciones acotadas para eliminar recorridos, cambios compartidos mínimos ya aprobados, pruebas sin efectos comerciales y documentación. Las dos acciones externas rechazadas necesitan la confirmación adicional descrita antes de reintentarse.

Requiere autorización separada: producción, promoción, merge a main, dominios, gastos, credenciales, cambios comerciales o ampliación de alcance. Protege CRM 360, AI Lab, Resend, atribución first-party, formularios, catálogo salvo accesos a recorridos, páginas corporativas/educativas, sitemap y SEO/GEO.

Aceptación: 131 fichas sin recorridos ni referencias funcionales; medios, planos, datos comerciales y contactos preservados; QA transparente; PR en borrador y Preview privada realmente existentes y verificados; producción intacta. No declares terminado el objetivo mientras falten PR o Preview.


## Estado actualizado — 15/11/2026

La autorización adicional fue recibida y las entregas externas se completaron. Esta actualización prevalece sobre las notas históricas de bloqueo anteriores:

- PR [#27](https://github.com/lasopho/sollahms-web/pull/27), abierto en estado Draft, head `codex/eliminar-recorridos-global-20261115`, base `codex/agenda-regions-responsive-20261115`, head runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. No fusionar.
- Preview Vercel READY: [https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/](https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/), deployment `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF`, target `staging`. Build log confirma descarga de 1.660 archivos; el árbol inspeccionado contiene 57 bundles de funciones y `config.json`.
- SSO del proyecto comprobado activo: `all_except_custom_domains`. La URL usa hostname `vercel.app`; la revisión HTTP autenticada no pudo completarse desde el conector web. El usuario debe realizar la inspección visual en la URL privada.
- Producción permanece en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; sin promoción, merge, dominio ni cambios productivos.

### Próximos pasos
1. Pedir al usuario revisar la Preview privada y reportar cualquier diferencia visual o funcional.
2. Si hay observaciones, inspeccionar sólo los elementos reportados, preservar el resto y preparar un nuevo candidato/Preview con trazabilidad. No publicar.
3. Mantener PR #27 en Draft hasta que el usuario revise y decida. Merge, producción y promoción requieren autorización separada.
4. Si no hay observaciones, entregar resumen final y esperar decisión del usuario; no fusionar automáticamente.
