# Operación de la integración Sollahms → CRM

Preparación de desarrollo, 2 de noviembre de 2026. No activa servicios, no contrata recursos y no constituye autorización de producción. El informe completo está en CRM: `docs/INTEGRACION_SOLLAHMS_PERSISTENTE_2026_11_02.md`.

## Código y precondiciones

- Outbox: `lib/crm-outbox-postgres.mjs` y `sql/crm-outbox.sql`.
- Worker: `createDeliveryWorker` para proceso supervisado, o POST a `api/crm-deliver.mjs` desde scheduler autenticado. No depende de una pestaña del navegador ni del Mac.
- Runtime: `lib/crm-runtime.mjs`, conexión perezosa, pool acotado, TLS remoto verificado y receptor HTTPS sin redirects. `pg` está fijado en package.json y package-lock.json.
- Formularios: contacto, asesoría hipotecaria y reserva/llamada reutilizan sus handlers. Los tres formularios de cálculo/búsqueda no transmiten leads. Inventario y links: `FORMULARIOS_2026_11_02.json`.
- Receptor CRM: `createSollahmsGateway` admite configuración explícita, manifest confiable, actor activo y mapa de proyectos. Conserva la verificación de esquema y la guarda del ejecutable CRM general; no ejecuta migraciones ni crea usuarios al arrancar.

No activar hasta que existan un PostgreSQL aislado y un receptor alojado autorizados. Aplicar los SQL como migrador, con backup, usando una identidad separada del runtime. `crm-outbox-access.example.sql` es un template revisable: concede acceso solo al outbox mediante un rol sin login; la asignación al login real corresponde al administrador autorizado. No ejecutar el template contra cuentas reales desde esta entrega.

## Configuración segura

Todos los valores sensibles deben configurarse en el gestor de secretos del alojamiento, nunca en Git ni en chat. La falta de configuración no se solventa usando una base SQLite efímera.

| Nombre                            | Uso                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CRM_INTEGRATION_MODE`            | Ausente o `disabled`: comportamiento anterior. `postgres`: habilitación explícita del adaptador |
| `CRM_PG_HOST`                     | Host del PostgreSQL autorizado para la outbox                                                   |
| `CRM_PG_PORT`                     | Puerto explícito; por defecto 5432; admite pooler si el proveedor lo requiere                   |
| `CRM_PG_DATABASE`                 | Base aislada de pruebas o la que se autorice posteriormente                                     |
| `CRM_PG_USER` / `CRM_PG_PASSWORD` | Login del servidor con permisos exclusivos de outbox                                            |
| `CRM_PG_CA`                       | CA cuando se necesite; nunca se desactiva la validación TLS                                     |
| `CRM_RECEIVER_URL`                | URL HTTPS exacta con path `/api/inbound/sollahms`, sin usuario, query ni fragment               |
| `CRM_SIGNING_KEY`                 | Clave aleatoria de al menos 256 bits codificada Base64; misma clave en el receptor              |
| `CRM_WORKER_TOKEN`                | Token aleatorio de al menos 32 caracteres, exclusivo del scheduler; nunca en el frontend        |
| `CRM_MAX_ATTEMPTS`                | Opcional; runtime por defecto 12, acotado por el adaptador                                      |
| `CRM_RETRY_SECONDS`               | Opcional; runtime por defecto 60 segundos, backoff con máximo de una hora                       |

En el receptor, organización y usuario del servicio son configuración del servidor; el body nunca decide el tenant. Los slugs públicos se enlazan a UUID del CRM mediante un mapa explícito revisado dentro de esa organización. No se fusionan proyectos por similitud de nombre. Una correspondencia ausente produce un caso para revisión, sin inventar datos. Las pruebas usan mapeos sintéticos: no han configurado los proyectos reales.

La rotación de claves debe coordinar emisor/receptor y vigilar solicitudes pendientes. Los relojes deben estar sincronizados. Antes de producción se deben revisar claves, retención, residencia, cifrado del proveedor, backups/PITR y monitoreo. No se promete disponibilidad ni un RPO/RTO operativo con esta configuración de desarrollo.

## Recepción y recuperación

Una recepción duradera es distinta de una entrega CRM. Los estados de la tabla son pending, leased, recorded y failed. El worker confirma recorded únicamente con respuesta coincidente y con lease vigente. Los reintentos conservan ID/fingerprint; no borrar una fila para enviar otra solicitud. Los conflictos de contenido exigen revisión.

Los límites de reintentos son finitos. Ante estados failed o atraso persistente, revisar conectividad, credenciales, reloj, mapeos y respuesta del receptor. Conservar payload e identidad; una recuperación manual debe autorizarse, auditarse y mantener el mismo request ID. No se automatizó el borrado ni el reenviado con una identidad nueva para ocultar errores.

El worker permanente necesita supervisor y backoff de reinicios. El scheduler HTTP debe realizar POST con `Authorization: Bearer <token>` desde servidor; GET no procesa datos. No se añadió cron a vercel.json ni se modificaron despliegues automáticos. Los estados failed deben alimentar un monitor autorizado; todavía no hay alertas externas ni correos nuevos activados.

Si la outbox no confirma persistencia, el formulario no confirma éxito y no llama a Resend. Si el lead ya se recibió duraderamente y falla el aviso de correo, la respuesta indica recepción y aviso no confirmado. Si una reserva no se confirma, no se anuncia una cita; la consulta comercial puede estar recibida por separado. La idempotencia CRM no resuelve la atomicidad del backend privado de reservas, que permanece sin conexión real.

## Verificación reproducible

En Sollahms, usar Node 24 y las dependencias exactas:

```sh
npm ci --ignore-scripts --no-audit --no-fund
python -m venv /tmp/sollahms-qa
/tmp/sollahms-qa/bin/pip install --require-hashes --only-binary=:all: -r requirements-ci.txt
PATH=/tmp/sollahms-qa/bin:$PATH npm test
```

`npm test` ejecuta el runner Git oficial con streams de archivos, necesario en el sandbox. Este alcance clasifica los nuevos casos expresamente y mantiene los 26 casos de publicación separados, pendientes del paquete privado/Preview protegida. `npm run test:release` es el intento sin filtro; no debe declararse aprobado sobre un checkout sin esos materiales.

Con ambos repositorios vecinos y en las ramas de integración, desde CRM:

Instalar previamente con pnpm 11.19.0 y `pnpm install --frozen-lockfile`, conservando `pnpm-workspace.yaml` y `patches/`. El CRM incorpora una adaptación comprobada para la cadena de archivos de ExcelJS; npm install no aplica esa adaptación. Sollahms mantiene su instalación independiente con npm ci.

```sh
npm run check
npm run format:check
npm run test:postgres
npm run test:browser
npm run test:sollahms
```

El último comando crea PostgreSQL Docker local sin red ni puertos, con imagen oficial fijada por digest. Usa únicamente sockets temporales y fixtures propios; no acepta DATABASE_URL ni bases remotas. Verifica los tres handlers/páginas, los contextos de proyecto, concurrencia, reintentos y fencing, reinicio real, worker automático, navegador escritorio/móvil y backup cifrado restaurado en una base nueva. Destruye solo sus recursos al finalizar.

No se debe desactivar el rate limit para acelerar el ensayo: la prueba de catálogo espera y reintenta cuando consume la ventana HTTP. Resend, UF y reservas se sustituyen por transportes sintéticos; el navegador bloquea orígenes ajenos al servidor local. No hay envíos reales.

## Preview y publicación

El ensayo aislado funciona como entorno de integración reproducible, pero no es una Preview alojada. Para esta última faltan accesos autorizados, recursos y las condiciones de publicación del repositorio. No simular una rama autorizada ni retirar el rechazo de builds incompletos. Vercel y su lista de despliegues desactivados se conservan intactos.

GitHub API no es alcanzable: el proxy rechaza CONNECT con 403 antes de GitHub. Esto no prueba un fallo del token o de la GitHub App. Git HTTPS permite publicar trabajo; PRs y resultados Actions necesitan una vía API autorizada. No cambiar políticas para eludir la denegación ni solicitar tokens por chat.

Producción, importación de datos privados, cuentas reales y comunicaciones requieren aprobación separada. La siguiente validación dependiente de acceso debe repetir el flujo sintético en un entorno alojado aislado, con guardas y mapeos reales del ambiente de prueba revisados.
