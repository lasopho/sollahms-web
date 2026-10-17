# Correcciones P1 — fase 1, 17 de octubre de 2026

Base: `3866095784367c23bbe33ff0d79e3ed111caade0`. Alcance: exclusivamente los siete grupos P1 del informe maestro de la auditoría. Los cambios son una propuesta de código para revisión; no certifican cierre de los bloqueos externos ni autorizan integración/publicación.

## Resultado por identificador

| ID | Corrección verificable | Pendiente externo |
|---|---|---|
| FUN-001 | Contacto usa idempotencia nativa Resend; contacto e hipotecario conservan operación y tiempos ante respuesta incierta. Agenda comparte operaciones concurrentes dentro del proceso y bloquea reenviar desde la misma pestaña tras incertidumbre. | Código y entorno aislado Apps Script: ledger durable, consulta de resultado y lock compartido para demostrar una sola reserva entre instancias/reinicios. El JSON upstream mantiene su contrato original. |
| CAT-002 | Cuatro avisos explícitos en catálogo/fichas: Verne residencial y las tres etapas Euro con oferta/identidad pendiente. Se conservan los 134 objetos del catálogo, enlaces, filtros y datos financieros. | Fuente oficial vigente que vincule cada etapa/producto con identidad, acceso y oferta propia. No se transfieren datos del conjunto ni de oficinas al residencial. |
| MED-001 | Inventario revalidado y preflight offline del paquete requerido: SHA-256 y tamaño antes de decodificar; no importa ni descarga material. | 353 rutas faltantes: 338 derivados raster, 11 PDF y cuatro sidecars. Ningún recurso recuperado o derecho inferido. |
| OPS-01 | Herramienta de recibo reproducible y comparación de manifiestos Git, sin confundir SHA declarado con bytes servidos. | Artefacto original de producción y manifiesto del paquete efectivamente publicado. La igualdad con producción sigue sin acreditarse. |
| OPS-02 | Propuesta revisable de ruleset para main: revisión, check CI, resolución de conversaciones y restricción de force push/borrado. | Capacidad administrativa y aplicación del ruleset. Main continúa sin protección; la propuesta no cambia controles remotos. |
| SRC-001 | Verne Oficinas actualizado desde fuente oficial: Oficina 406, desde UF 1.705 y 21,00 m² útiles/totales, con condiciones. Registro de revisión del contexto al 17/10. | Sin bloqueo para esta corrección puntual. No acredita oferta residencial ni estado actual de Oficina 202. |
| SRC-002 | Estados de autorización preservados y solicitud documental concreta para Ecasa/Leben. | Evidencia contractual del uso público y autorización específica del material oficial pendiente. No se incorporan medios ni amplían permisos. |

## Comparación antes/después y evidencia

FUN-001 antes aceptaba contactos repetidos como operaciones distintas en proveedores simulados. Ahora handlers independientes reutilizan la misma clave nativa y el proveedor simulado acepta una sola operación. Se prueban concurrencia, respuesta perdida, conflicto de payload, caducidad, reloj adelantado, recarga y cambio de UF. La ventana preventiva nueva es 23 horas frente a las 24 horas de retención de [Resend](https://resend.com/docs/dashboard/emails/idempotency-keys). El ledger de reservas es deliberadamente local; no constituye garantía distribuida. La interfaz conserva sólo clave opaca, fingerprint y tiempos en sessionStorage, sin campos personales. Detalles y limitaciones: [FUN-001](correcciones-p1-fun001-2026-10-17.md).

SRC-001 antes mostraba Oficina 202, UF 1.550 y 23,19 m². La [fuente oficial Verne Oficinas](https://norte-verde.cl/proyecto/verne-oficinas/), consultada el 17/10, muestra Oficina 406, UF 1.705, 21,00 m² útiles y totales, terraza 0 m². Se actualizan conjuntamente los hechos y condiciones en el contexto relacionado, ficha y registro. El precio propio residencial continúa nulo. Las simulaciones rechazan usar cualquiera de los dos precios de oficina como oferta residencial antes de leer credenciales o llamar al proveedor.

CAT-002 antes explicaba incertidumbre en información secundaria. Los cuatro avisos ahora aparecen junto a la identidad del catálogo y antes del resumen de las fichas. Las cuatro identidades afectadas son `edificio-verne`, `mapocho-3521-edificio-a`, `froilan-roa-5731-torre-norte` y `froilan-roa-5731-torre-sur`. La landing Euro–Santander localizada refiere una promoción vencida el 29/08/2025 y no demuestra vigencia ni equivalencia actual. Los 130 HTML ajenos y todos los objetos del catálogo permanecen exactos.

MED-001 conserva antes/después las mismas 353 ausencias. El transporte seleccionado tiene 1.039 rutas: 686 verificadas, 353 ausentes y cero presentes inválidas. Es el universo del selector de transporte, no el total amplio de entradas de manifiestos históricos. Derechos y fuentes: [recursos](p1-recursos-derechos-2026-10-17.md).

OPS-01/02 no se presentan como resueltos remotamente. El recibo distingue checkout, fuente declarada y artefacto servido. La propuesta de ruleset no se aplica. Evidencia y contrato de ambos entregables: [operaciones](p1-operaciones.md).

## Validación y conservación del CI

La selección pública conserva los 330 casos Node y 137 Python originales, añade 38 Node y 17 Python y exige un total de **368 Node y 154 Python** más el validador hipotecario. Los 26 casos privados mantienen sus nombres, motivos y exclusión: permanecen pendientes hasta recuperar el paquete privado y disponer de la autorización de comprobación correspondiente. No se declaran aprobados.

Comando reproducible:

```sh
python -B scripts/run-git-ci.py --cloud-stdio --output /tmp/sollahms-p1-ci
```

La opción stdio sólo adapta subprocess al entorno restringido; el workflow público conserva su ejecución nativa. Se registran logs y resultados fuera del checkout. Las pruebas de formularios y agenda usan dobles de DOM y proveedores sintéticos. No se envían correos ni se crean reservas reales. No se acredita revisión visual de navegador en este entorno.

Las proyecciones históricas P1 viven sólo en tests y validan hashes completos o filas exactas antes/después; los casos nuevos ejercitan el código/datos actuales y canarios negativos. No se reescriben snapshots. `vercel.json`, workflow, packager y guardas reales de release conservan sus bytes. El gate real sigue rechazando el nuevo contexto Verne fuera de su alcance histórico autorizado: reconciliarlo queda pendiente de la autorización separada para cambiar controles de publicación. Los bytes de formularios FUN-001 cubiertos por esas guardas históricas también deben reconciliarse bajo la autorización posterior. El CI público no autoriza ni habilita ese release. No se genera un build publicable para superar esa restricción.

## Revisión y publicación de la propuesta

Los lotes se desarrollaron en ramas locales independientes. La rama de revisión remota prevista es `codex/leon-cartera-preview`: nombre histórico disponible con `git.deploymentEnabled` ya establecido en `false` en la base y conservado en la propuesta. No se añaden ni modifican reglas de Vercel. Según la [documentación oficial](https://vercel.com/docs/project-configuration/git-configuration), esa configuración impide deployments Git de la rama; se verifica su ausencia antes de crear la referencia y se comprueba el resultado después. No se publican las ramas locales `fix/*`, que carecen de esa regla previa.

Se mantiene main intacta y el PR en borrador para una única revisión al terminar. Nunca se hace merge ni se ejecutan Preview, Production, Calendar o comunicaciones reales. Tampoco se cambian dominios, DNS, credenciales ni diseño general.

## Inicio recomendado de P2

Tras revisar esta propuesta, comenzar por los P2 ejecutables con fixtures y fuentes verificables del informe maestro; conservar abiertos los P1 externos con sus criterios de aceptación. No agregar proyectos ni declarar la base lista para publicar mientras falten derechos, recursos privados, trazabilidad, protección administrativa o atomicidad de reservas. La revisión de P2 no autoriza integración ni despliegue.
