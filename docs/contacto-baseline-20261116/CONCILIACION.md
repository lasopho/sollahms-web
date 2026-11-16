# Contacto sobre el baseline publicado de Recorridos

Estado final: **overlay conciliado y verificado en la nueva Preview privada**. El QA y su aceptación se documentan en el [informe final](INFORME-CIERRE.md). Este documento no autoriza crear Production, promover, asignar dominios o fusionar PR. El encargo vigente comprende la Preview, QA en cinco anchos y documentación con un prompt de publicación separado.

## Identidades comprobadas

| Referencia | Identidad válida para esta tarea |
| --- | --- |
| Repositorio | `lasopho/sollahms-web` |
| Checkout independiente | `/private/tmp/sollahms-contacto-baseline-20261116` |
| Base Git de la conciliación | `98ba61d103059ab488cb85216c9bc95214aee82a` |
| Production publicado que se conserva | `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5` |
| Runtime declarado del Production | `c97bfa5aba80329f18e3db8058ec5c3fada80cc4` |
| Proyecto Vercel | `project-wrapp` / `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` |
| Overlay aprobado de Contacto | `967d556730e20ef86bae6ecee11ec6152434c8ae` |

El proceso principal verificó ByUhr en estado READY y los aliases de `sollahms.cl` y `www.sollahms.cl`; www conserva su 308 al dominio principal. Para resolver las referencias inexactas del mensaje inicial se utilizan estos identificadores comprobados, sin sustituirlos por un SHA documental o por el deployment histórico `9zz`.

## Ramas y PR comprobados

| PR | Rama / HEAD remoto | Estado y alcance |
| --- | --- | --- |
| [#26](https://github.com/lasopho/sollahms-web/pull/26) | `codex/contacto-pie-corporativo-20261115` / `055787d9a1dadf35217080e46dbdae1c4ccfe78a` | Abierto, Draft, sin merge. Un commit; únicamente `contacto.html`: pie corporativo. |
| [#28](https://github.com/lasopho/sollahms-web/pull/28) | `codex/contacto-selector-320-20261115` / `967d556730e20ef86bae6ecee11ec6152434c8ae` | Abierto, Draft, sin merge. Un commit sobre #26; únicamente `contacto.html`: selector a 320 px. |
| [#27](https://github.com/lasopho/sollahms-web/pull/27) | `codex/eliminar-recorridos-global-20261115` / `98ba61d103059ab488cb85216c9bc95214aee82a` | Recorridos publicado; el PR permanece abierto y Draft por instrucción del propietario. |
| [#25](https://github.com/lasopho/sollahms-web/pull/25) | `codex/contacto-cobertura-footer-20261115` / `f4249e9fb0b02a55552d17bcca1e03c4b3cffeb9` | Abierto, Draft, sin merge. Un commit; pie y cobertura territorial, fuera del overlay vigente. |

Las comprobaciones de metadatos y HEAD remotos no encontraron commits posteriores a esos puntos. #26, #27 y #25 parten de `codex/agenda-regions-responsive-20261115`, base `c2e1965ced736d46917a1bee286456cb937d58fe`; #28 parte de #26. No se utilizó `main` como sustituto del baseline desplegado. Los estados son evidencia de esta conciliación y deberán preservarse; no constituyen un bloqueo distribuido entre chats.

## Cambio autorizado y preservación

La comparación local de `contacto.html` entre `c2e1965ced736d46917a1bee286456cb937d58fe` y `98ba61d103059ab488cb85216c9bc95214aee82a` devuelve un diff vacío. Por tanto el cambio aprobado de #26/#28 se aplica al mismo Contacto de base sin conflicto textual con Recorridos.

El delta de contenido se limita al footer y dos bloques CSS inline: `contact-footer-style` y `contact-selector-responsive`. El segundo restaura el indicador nativo y ajusta fuente/padding por debajo de 360 px. No cambia opciones, textos del selector, endpoints ni JavaScript. El [contrato de fuente](contacto-source-contract.json) fija:

- Contacto base: 16.829 bytes, SHA256 `5c16a5cff747b87b64d3a4bba49d4d0a0c6fc0fbf578bdb3d730e0c6dc209a69`.
- Contacto candidato: 18.655 bytes, SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`.
- Encabezado, contenido principal, formulario, scripts, metadatos, links y opciones conservados fuera de esas regiones.

El runtime de partida debe ser el artefacto publicado de ByUhr. La base Git identifica el trabajo, pero no sustituye la recuperación de los bytes desplegados: se conservan las 1.660 entradas, las 147 páginas, las 131 fichas, los 64 HTML y dos CSS sin recorridos, las siete funciones y sus 57 archivos, la configuración y los recursos vigentes. También se preservan las tres versiones productivas ajenas a Contacto ya conciliadas: `assets/js/urban-works-model.mjs`, `comparador-hipotecario.html` y `data/urban-development.json`.

La rama de #25 es hermana de la cadena #26/#28; no es un commit posterior ni está incluida en `967d556`. Su único commit, del 15/11/2026 a las 16:14:53 UTC, añade diez regiones, 32 localidades y 18 comunas metropolitanas. No contiene el arreglo del selector de #28. Su QA visual histórico y su auditoría de integridad bloqueada se conservan como antecedentes; no se incorpora esa cobertura ni se reabre/modifica #25 en este encargo.

## Coordinación y límites operativos

La tarea **Preparar espacio de publicación Sollahms**, chat `01a1e1b2-deec-74b1-863d-9ffc70fea8d4`, terminó su último turno y no mostraba trabajo activo en la consulta. Se detuvo con `DENY/ALIASES` cuando el baseline cambió de `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN` a ByUhr. No creó un Production de Contacto, no realizó uploads y no consumió su reserva de creación. El checkout `/Users/luissandoval/Projects/sollahms-publicacion` permanecía limpio, con HEAD separado en `967d556`.

El informe y `estado-autorizacion.json` de `.vercel/production-contacto-20261116/` conservan esa negativa. La autorización histórica permitía un único Production sin dominio condicionado a `9zz` y prohibía publicar/promover. No se reutiliza sobre ByUhr. El paquete histórico `6bc7f0f3c046bba0bae8c3a8a79c45245417edfd88a7401d2fe39f9386fa763c` tampoco debe subirse como sitio íntegro: está basado en `9zz` y podría revertir Recorridos.

El objetivo actual autoriza únicamente una nueva Preview privada sobre ByUhr y su validación. Cualquier propuesta productiva se redactará separadamente; un prompt o recibo documental no equivale a autorización ejecutable. No se permiten Production, promoción, publicación, asignación de dominios ni merges en este encargo. No se alteran credenciales, SSO, variables, proveedores ni ajustes productivos. En `vercel.json` se añade únicamente `false` para el despliegue automático de la nueva rama de integración; los ajustes existentes de otras ramas permanecen idénticos y el config v3 desplegado no cambia. No se envían formularios, correos ni operaciones reales de CRM/reservas.

Se dejan intactos `/Users/luissandoval/Documents/sollahms-web` y `/Users/luissandoval/Projects/sollahms-publicacion`. No se cambia su rama ni se sobrescriben sus trabajos. El temporal anterior `/private/tmp/sollahms-recorridos-20261115-local` ya no existe; no se reutilizó ni recreó como checkout compartido. Se preservan los históricos y los cuatro PR en Draft. No se enviaron mensajes a otros chats para elaborar estos dos documentos.

Registro estructurado: [coordination.json](coordination.json). Se leyó `AGENTS.md`; la inspección que originó estos dos documentos no modificó aplicación ni índice de Git. El cierre posterior de QA, Preview y [PR #29 Draft](https://github.com/lasopho/sollahms-web/pull/29) queda registrado por separado en el informe final.
