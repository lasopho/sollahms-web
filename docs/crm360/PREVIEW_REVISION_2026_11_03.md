# Continuidad de preview y PR #13 — 3 de noviembre de 2026

## Estado vigente

El PR borrador [#13](https://github.com/lasopho/sollahms-web/pull/13) corresponde a `codex/crm360-integracion-2026-11-02`. Apuntaba a fc160c6 y no incluía la preparación posterior. Se avanzó por fast-forward hasta 713a0a1, incorporando la rama snapshot `codex/crm360-preview-2026-11-02`; los nuevos commits continúan en la rama del PR. No hubo force-push ni merge a main. El PR CRM #3 se actualizó del mismo modo desde 586e8b5 a 5ea30b3 y continúa en `codex/sollahms-integracion-2026-11-02`. Usar las ramas de los PR para continuar; las ramas snapshot conservan el estado anterior.

Se verificó en la página pública de GitHub que [la ejecución 41570407498](https://github.com/lasopho/sollahms-web/actions/runs/41570407498), asociada a 713a0a1, terminó en **Success**, con el job real de regresión Git. La ejecución anterior 41569695627 fue cancelada por concurrencia al llegar una solicitud más reciente: no fue un startup_failure. Consultar [Checks del PR](https://github.com/lasopho/sollahms-web/pull/13/checks) para el SHA más reciente; no atribuir ese éxito a commits posteriores.

La API GitHub sigue denegada antes de llegar a GitHub y el repositorio privado CRM no se puede inspeccionar vía web sin la conexión correspondiente. La lectura pública anterior no demuestra acceso al repositorio privado ni permisos del token. No se cambiaron políticas, tokens o guardas.

## Materiales y casos protegidos

Se inspeccionaron historias existentes de Ecasa, Leben, León y la rama de publicación financiera. **85 recursos Ecasa** pudieron recuperarse desde Git con SHA-256 idéntico al manifiesto actual, evidencia privacySafe y ruta ignorada. No se modifican bytes, hashes ni manifiestos; los materiales no se agregan al commit. Las ramas Ecasa adicionales se revisaron sin aportar otros archivos faltantes. La recuperación es local, no una publicación ni aprobación de derechos.

Herramientas reproducibles, sin red ni despliegue:

```sh
node scripts/recover-preview-media.mjs --ref origin/recovery-ecasa
node scripts/recover-preview-media.mjs --ref origin/recovery-ecasa --write-ignored
node scripts/protected-release-inventory.mjs
npm run preview:readiness
```

El primer script requiere refs locales explícitas y restaura exclusivamente archivos ignorados, con hash revisado, sin sobrescribir existentes ni seguir symlinks. Las refs y commits usados están en `PROTECTED_MEDIA_GAPS_2026_11_03.json`. Un entorno nuevo debe obtener esas refs mediante Git autorizado y repetir la recuperación; los archivos ignorados no se transfieren mediante los commits.

El inventario anterior pasa de 394 a **309 referencias ausentes entre 735**. La nueva auditoría de archivos literales, que incluye AJ y Ecasa oficiales y la base histórica fijada para los casos anteriores a León, distingue **792 recursos: 502 con hash verificado, 28 presentes sin hash ligado en esos manifiestos y 262 ausentes**; cero discrepancias/symlinks inseguros. Los dos conteos tienen alcances distintos. No inferir derechos ni integridad completa de los 28 recursos no ligados.

Los **26 casos protegidos** se intentaron: **25 fallos, un skip nativo, cero aprobados**. Un intento agotó el límite local; se repitió hasta obtener su error real, sin cambiar las aserciones. No se redujo la selección ni se retiraron comprobaciones. La fixture histórica de calidad Ecasa se adapta para leer páginas retiradas desde el archivo validado y utilizar las proyecciones históricas existentes, conservando la ausencia de sus rutas públicas y todas las aserciones de recursos/derechos. Los materiales incompletos siguen impidiendo certificar publicación. No restaurar páginas retiradas en la raíz para resolver un error de una fixture.

El empaquetado real de esta rama sigue fuera de la lista autorizada. `vercel.json`, el packager, los derechos, hashes y workflow protegido permanecen intactos. Una instalación adicional que se propuso para CI se retiró al detectar la guarda byte a byte del workflow. El CI Git existente funciona con sus transportes sintéticos y no debe alterarse sin su revisión específica.

## Preparación operativa adicional

`scripts/preview-deliver-once.mjs` permite programar el POST autenticado existente `/api/crm-deliver` desde un supervisor de desarrollo. Rechaza producción, correo real, URL insegura, origen productivo y falta de token antes de enviar. Usa timeout y prohíbe redirects. Un HTTP 200 solo confirma aceptación del tick, no entrega CRM: revisar el recibo duradero de la outbox. No incorpora proveedores, credenciales de base ni lógica de entrega nueva.

`deploy/crm360/sollahms-preview-outbox.service` y `.timer` preparan el scheduler en el mismo host autorizado de la API/worker CRM, con usuario/archivo de secretos separado. No están instalados ni habilitados y no añaden cron a Vercel ni requieren contratar otro servicio. Revisar Node, rutas, permiso del usuario y acceso HTTPS privado antes de activarlos.

CRM añade un contrato auditable de variables y un preflight offline, separación de claves/logins/orígenes y un verificador readonly que contrasta los 137 IDs del mapa con filas reales de una base sintética. Leer `docs/REVISION_PREVIEW_2026_11_03.md` del CRM. Esto no certifica IDs de una base alojada que todavía no está conectada.

## Validación y recursos existentes

Validación local consolidada: **430 Node y 216 Python**, formada por la suite Git completa de esta etapa y la repetición de la suite afectada tras conservar el workflow original, más los dos casos nuevos de scheduler. No se presenta como una única ejecución completa de 430 casos. El CI remoto del nuevo commit debe comprobarse por su SHA. La integración compartida repitió seis recorridos, 137 contextos, persistencia CRM y restauración cifrada; no se enviaron mensajes reales.

`docs/release-reference.json` identifica un recurso Vercel previo: proyecto **project-wrapp**, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. Es evidencia versionada, no verificación actual de la cuenta o de su configuración. No hay credenciales/identidades cloud vinculadas en esta sesión para consultar Vercel, PostgreSQL o Auth. No asumir que el backend de reservas es una base reutilizable. No se crearon servicios o gastos.

**No hay preview CRM alojada ni validación 24/7.** Además del recurso/secretos, los handlers actuales rechazan solicitudes comerciales en VERCEL_ENV=preview. Se conserva esa guarda; no basta configurar PostgreSQL/HMAC para que los formularios envíen. El recorrido exclusivamente sintético requiere un diseño de preview aprobado por el procedimiento existente, manteniendo bloqueadas reservas y comunicaciones reales. No simular otra rama o producción para sortearlo.

## Intervención consolidada pendiente

Revisar/guardar/publicar el borrador del entorno Codex (api.github.com está en el borrador, no en la política aplicada); facilitar conexiones autorizadas al recurso Vercel existente y al host/PostgreSQL/Auth independientes de desarrollo, con secretos por gestor; aportar el paquete de recursos faltantes identificado por paths/hashes y tramitar autorización de rama/recorrido sintético por el flujo existente. Después comprobar formularios, login/revocación, reinicios y restore contra URLs alojadas. Producción, costos, datos reales, comunicaciones y merge no están autorizados.
