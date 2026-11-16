# Reanudación local — QA de Preview aprobado; Production pendiente

Fecha: 15/11/2026, America/Santiago. Este hito todavía no aprueba la publicación.

Se recuperaron directamente del deployment correctivo `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi` los 1.660 archivos certificados: 1.602 estáticos, 57 archivos en siete bundles y config v3. La API autenticada de fuentes entregó los bytes existentes; no se ejecutaron builders, preparadores ni generadores. Se verificaron tamaño, SHA1 y SHA256 por archivo, y el inventario canónico conserva `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Siguen siendo 66 cambios autorizados y 1.594 archivos preservados. [Recuperación y hashes](recovery-report.json).

El checkout de trabajo independiente es `/private/tmp/sollahms-recorridos-20261115-local`, rama `codex/eliminar-recorridos-global-20261115`, HEAD recibido `16480969f0647c0e6df97053d49199b979e17c83`. El checkout original de Documents y el de Contacto en Projects no se modificaron. El PR #27 permanece abierto y Draft. La copia selectiva auxiliar terminada en `/private/tmp/sollahms-recorridos-20261115-work` no se utiliza para publicar.

La CLI 65.16.0 confirma la identidad existente `lsandoval2-8260`; Node es v24.22.3. La portada HTTPS de la Preview responde 200 con contenido Sollahms. Chrome también abrió esa misma Preview con la sesión SSO existente. SSO sigue habilitado `all_except_custom_domains`. No se crearon bypasses ni enlaces temporales, ni se cambiaron credenciales. Las solicitudes nativas usan un directorio sin vinculación, deployment explícito y la autenticación existente manejada internamente por la CLI. [Acceso](access-root.json), [Chrome](chrome-access.json).

Las siete funciones respondieron a métodos seguros: advisory/contact/collaboration/orientation-contact GET405, ambas reservas GET503 con `booking_not_certified`/`request-only`, y UF HEAD405 antes de consultar su proveedor. Las rutas internas comprobadas no entregan código fuente. `/api/contact.mjs` responde JSON405 porque config reescribe el sufijo `.mjs` al handler, por lo que no corresponde exigir 404 en esa ruta. No hubo envíos de formularios, leads, reservas, correos ni operaciones CRM/Resend. [Resultados remotos](endpoints-results.json), [config y métodos](function-structure-notes.json).

El smoke remoto de INN Puerto Chico a 390 px pasó sin recorridos, errores JS, recursos fallidos ni overflow. Su mapa se renderizó con dos widgets y 37 mosaicos decodificados. La matriz de 131 fichas × cuatro anchos (1440/768/390/320) = 524 controles está en curso; ese smoke no sustituye la matriz. Se están revisando también navegación, galerías, planos y validación de formularios sin envío. Las correcciones iniciales afectan exclusivamente al harness: esperas de descarga/pintura, API FrameLocator, exclusión del honeypot y RPC de lectura de Google Maps. No son modificaciones de la aplicación ni aprobación anticipada del QA.

Contacto conserva SHA `967d556730e20ef86bae6ecee11ec6152434c8ae`, PR #28 Draft. PR #26 también sigue Draft. Ambos cambian únicamente `contacto.html`; ninguno de los 194 archivos del PR #27 lo modifica. El ancestro común es `c2e1965ced736d46917a1bee286456cb937d58fe`, base real del PR #27. Se informó a la otra tarea de la coordinación solicitada. No se sustituyen los bundles certificados por los nuevos de su alternativa B, ni se integran automáticamente los PR. Dos deployments completos independientes podrían revertirse; se requiere conciliación final antes de operar Production.

Los aliases apex y www siguen asociados a `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. No se creó Production ni se promovió. La autorización integral permanece vigente; Production solo se preparará después de aprobar todos los controles pendientes, manteniendo coordinación con Contacto y el mismo artefacto certificado.

La salida recuperada está en `/private/tmp/sollahms-recorridos-recovery/output`. El script archivado recupera únicamente las fuentes existentes mediante API GET; requiere el inventario certificado `verification-certified.json`, copia de `release-20261115T191251/verification.json`. No sirve para generar otra versión ni autoriza a repetir pruebas ya certificadas.

## Actualización del 16/11/2026 — QA en ejecución

Las 131 rutas HTML ya tienen respuesta HTTP verificada contra la salida certificada. Vercel añade a los HTML un sufijo de feedback de 163 bytes, SHA256 `1ec749d6c1840dd80e5f178a7ebea403951fa9e3bb90e80a4b1be83b311e85cb`. El documento fuente completo permanece como prefijo exacto. El verificador permite exclusivamente ese sufijo observado y conserva intactos tanto el cuerpo HTTP como el artefacto recuperado. [Verificador de evidencia HTTP](verify-http-cache.py).

El inventario de las 131 fuentes exactas confirma 119 mapas, 131 formularios y cero videos publicados. Las siete referencias YouTube internas de Sento ya estaban ausentes del HTML antes de esta intervención y siguen conservadas en investigación no desplegada; no se incorporaron ni se afirma una prueba de reproducción inexistente. [Inventario de medios y comparación anterior](source-media-inventory.json).

La presión de recursos del Mac y los procesos CLI huérfanos de intentos de QA anteriores provocaron timeouts del harness. Se cerraron exclusivamente diez pares Node/Vercel huérfanos tras comprobar su directorio de trabajo, sin tocar procesos ajenos. Se añadió un watchdog de proceso completo y cierre de su grupo; una prueba local nueva confirmó la terminación del padre y un hijo que ignoraba SIGTERM. Se conservaron checkpoints y caché. Estas correcciones pertenecen al harness; el runtime sigue intacto. [Recuperación de recursos](qa-resource-recovery.json).

La composición de las galerías se revisa después de decodificar y pintar las imágenes, evitando aceptar fondos vacíos por una captura prematura. Las consultas de lectura necesarias de Google Maps se distinguen de envíos comerciales; la telemetría opcional bloqueada se registra separadamente de fallos de la aplicación. Continúan la matriz de cuatro anchos y las interacciones de navegación, planos y formularios sin envío.

El PR #27 se actualizó para reflejar acceso efectivo, recuperación y QA pendiente, manteniendo Draft. La comparación remota del hito `864d6bb` confirma un commit exclusivamente documental y Contacto sin cambios posteriores ni archivos compartidos. [Comparación de ramas](github-coordination-864d6bb.json).

La auditoría de CLI confirma que el output certificado no necesita `builds.json` adicional para `--prebuilt`; `--environment=production --skip-domain` permite la etapa aislada posterior al QA. No se usará `--verify`, que puede crear un bypass. No se preparó ni ejecutó Production. [Auditoría de compatibilidad](production-cli-readonly-audit.json).

## Aprobación técnica de Preview — 16/11/2026, 00:59:57 Santiago

El gate independiente aprobó todas las condiciones para preparar Production: cero fallos y el mismo inventario SHA256 certificado. Se comprobó que los 1.660 archivos continúan intactos después del QA; no se reconstruyó el paquete. [Gate y hashes de evidencias](qa/gate/qa-gate.json).

| Control | Resultado final |
| --- | --- |
| Fichas y anchos | 131 × 1440/768/390/320 = 524 parejas únicas; sin faltantes ni duplicados |
| Aplicación, imágenes y composición | Cero excepciones JS, recorridos, imágenes rotas, huecos visibles o overflow |
| Mapas | 476 mediciones de los 119 mapas existentes; cuatro casos completados mediante reprobe dirigido |
| Encabezados, pies y menú | 524 mediciones aprobadas y 18 interacciones de menú móvil correctas |
| Navegación | 730 clics verificados en las 131 fichas |
| Formularios | 262 cambios de modalidad, 262 validaciones vacías y 262 CTA; cero envíos y campos sin modificar |
| Galerías y planos | 709 imágenes de galería verificadas; 155 originales de galería y 395 planos abiertos y decodificados |
| Comparación de planos | Siete comparadores con dos imágenes, cierre y restauración; la ficha con una sola lámina conserva correctamente el botón deshabilitado |
| Consola | Sin errores o advertencias de aplicación desconocidos; 116 avisos conocidos del parser y bloqueos deliberados del toolbar documentados |
| Recursos HTTP | 1.485 rutas previstas aprobadas; snapshot de 1.506 GET200 vinculado al artefacto, sin divergencias |
| Funciones | Siete endpoints comprobados con métodos seguros; reservas permanecen request-only |

En Ferroparque se abrió mediante clic la sección cerrada `Etapa 2` antes de comprobar su iframe. Sus dos mapas permanecen separados, con las direcciones Av. y Pasaje Bascuñán Santa María originales. La espera de mosaicos, metadatos y pintura resolvió los otros casos sin modificar HTML. Se conservaron capturas anteriores y posteriores. [Core final](qa/core/acceptance-summary.json), [suplementos](qa/supplement/README.md), [HTTP](qa/http/warm-http-summary.json).

Los avisos `allow`/`allowfullscreen` corresponden a precedencia documentada por W3C y ya existían en las fuentes. Se conservaron por identidad de bytes; no se declara cero advertencias de navegador. Los fallos de los primeros intentos se atribuyeron mediante evidencia a selectores, posicionamiento, disclosures cerrados, esperas y procesos huérfanos del harness; ningún archivo runtime necesitó corrección adicional.

Contacto terminó su Preview y permanece sin autorización productiva propia. Antes de esta etapa se confirmó que apex y www siguen en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN` y se informó la preparación aislada de Recorridos. Esta publicación conserva `contacto.html` productivo y sus ramas intactas. Una futura publicación de Contacto deberá conciliar su overlay con el nuevo baseline sin reintroducir los 64 HTML y dos CSS retirados de recorridos.

El QA de Preview está aprobado. Aún no existe un nuevo deployment Production ni promoción: la siguiente etapa es crear el mismo artefacto mediante `--prebuilt --environment=production --skip-domain`, verificar fuentes, rutas, funciones y entorno aislado, y promover exclusivamente ese Production aprobado. La autorización integral sigue vigente sin nuevas confirmaciones.
