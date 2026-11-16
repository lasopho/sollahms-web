# Verificación pública de Contacto, preparada para después de la promoción

Estado final: **PASS, 648/648 controles públicos**, sobre `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`. Véanse el [resumen final](verification-summary.json), los [resultados completos](public-verification-results.json), el [recibo de promoción](promotion-confirmed.json), el [cierre del proceso](process-closed.json) y el [manifiesto final](manifest-sha256.json). El [script](verify_public.py) adapta el verificador de Recorridos al inventario certificado de Contacto `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. La [preparación local](preparation.json) conserva el estado anterior de preparación y la validación de sintaxis mediante AST; sus campos PREPARED_NOT_EXECUTED y newProductionIdKnown=false son históricos, anteriores a la promoción. El inventario histórico conserva sus campos de autorización de Preview: se usa como referencia de bytes, mientras la autorización y el Production nuevo se vinculan por el proceso principal.

El plan contiene **648 casos HTTP**, no una repetición de 524 pruebas responsive:

| Casos | Número |
| --- | ---: |
| Portada y Contacto, HTTP/HTTPS de apex/www | 8 |
| 131 fichas preservadas, en esos cuatro orígenes | 524 |
| 35 recursos representativos, HTTPS de ambos dominios | 70 |
| Siete funciones, métodos seguros en ambos dominios | 14 |
| Fuentes internas denegadas y rewrite de fuente API sin exponer código | 16 |
| Cuatro variantes retiradas de Patio Brasil en los cuatro orígenes | 16 |

Los recursos incluyen estilos, identidad, scripts de Contacto/RUT/consentimiento/idempotencia, galería, planos y funciones de navegación de fichas, además de una imagen y un plano de las seis fichas prioritarias cuando existen. Cada cuerpo estático se coteja con los bytes certificados. En fichas se conserva además el control de indicadores de UI de recorridos ya auditado. Se permite únicamente la coincidencia exacta del HTML o su extensión con el script conocido de toolbar que declare el mismo ID Production; no se elimina HTML arbitrario del cotejo.

No se enviaron formularios en esta preparación ni en la verificación pública. El verificador admite exclusivamente GET/HEAD: seis funciones con GET y UF con HEAD. Las reservas deben conservar `booking_not_certified` y modo `request-only`; UF no solicita la cotización al proveedor. No genera leads, correos, reservas ni escrituras CRM. No abre navegador ni prueba entrega real a CRM/Resend.

La ejecución usa curl del sistema con validación TLS, entorno mínimo, sin configuración personal de curl, autenticación, cookies, proxies ni excepciones CA. Sigue redirects de forma explícita entre `sollahms.cl` y `www.sollahms.cl`, sin queries/fragments, y rechaza un descenso desde HTTPS. Concurrencia predeterminada 3, permitida 2–4; timeout curl 40 segundos y watchdog del proceso completo 45 segundos. Ante parada, termina únicamente sus propios grupos de procesos. Guarda estado por caso y un recibo de cierre; no persiste cuerpos ni cabeceras completas.

## Señal requerida antes de cualquier red

El proceso principal debe confirmar por API que ambos aliases apuntan al nuevo Production ya probado y promovido. Después escribirá `.vercel/contacto-production-release-20261116/public/promotion-confirmed.json`, con estos campos:

- `deploymentId`: ID nuevo exacto, distinto de ByUhr, 9zz y la Preview.
- `target`: `production`; `promoted`, `aliasesApiVerified`, `productionQaPassed` y `sameTestedDeploymentPromoted`: `true`.
- `domains`: `sollahms.cl` y `www.sollahms.cl`.
- `confirmedAtUtc`: fecha con offset, de los últimos 30 minutos.
- `candidateInventorySha256`: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.
- `projectId`: `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`.
- `sourcePreviewDeploymentId`: `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`.
- `baselineDeploymentId`: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.

El guard se evalúa antes de crear subprocesos o acceder a la red. El proceso principal aportó la señal real tras verificar ambos aliases; se copió al runtime y se conserva en este expediente. La ejecución aprobada utilizó el ID exacto mostrado abajo. Este comando es de reproducción documental: no volver a ejecutarlo por rutina después de aprobar los 648 casos.

```sh
python3 docs/contacto-baseline-20261116/production-release-20261116/public/verify_public.py \
  --expected-production-id dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w \
  --concurrency 3
```

Por defecto lee el output certificado existente en `.vercel/contacto-baseline-20261116/preview/.vercel/output` y el manifiesto de Contacto. `--certified-output` permite señalar el stage productivo separado si conserva exactamente ese inventario. Los resultados quedan en `.vercel/contacto-production-release-20261116/public/public-verification-results.json` y `process-closed.json`, para empaquetarlos después de terminar. No se deduce la identidad del deployment de una respuesta HTTP: la comprobación de aliases por API pertenece al proceso principal.

La [instantánea de coordinación](coordination-snapshot.json) registra únicamente la inspección de lectura de los otros chats. No equivale a una reserva distribuida; se deben volver a comprobar aliases y concurrencia antes de promover.

## Resultado y límite del primer intento

La pasada pública terminó con exit 0, 648 controles aprobados y cero fallos. Los 632 cuerpos estáticos cotejados coinciden exactamente con la fuente; no se observó toolbar en los dominios públicos. Las 524 comprobaciones de fichas conservan los 131 slugs y cero indicadores de UI de recorridos. Patio Brasil conserva 410 en sus 16 combinaciones. Se validaron 1246 transacciones HTTP, incluidas 972 HTTPS con TLS válido y 598 redirects. Todos los casos finalizaron en https://sollahms.cl. No hay grupos de procesos propios pendientes.

El primer intento dentro del sandbox no pudo resolver DNS: sus 648 invocaciones curl devolvieron exit 6, status 0 y **cero respuestas HTTP**. Sus [resultados crudos](attempts/sandbox-dns-unavailable/public-verification-results.json), [clasificación](attempts/sandbox-dns-unavailable/classification.json) y [cierre](attempts/sandbox-dns-unavailable/process-closed.json) se conservan como limitación del harness. Se volvió a ejecutar el mismo código con acceso de red autorizado, sin repetir controles aprobados ni modificar el producto. No se interpreta ese intento DNS como un defecto de la aplicación ni como una validación TLS.
