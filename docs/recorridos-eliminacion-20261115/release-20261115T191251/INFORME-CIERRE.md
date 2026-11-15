# Corrección prebuilt y continuidad de publicación — Sollahms

Fecha: **15/11/2026, America/Santiago**. Preview creada a las **19:03:04**, READY a las **19:03:11**. Cierre de evidencias: 19:20.

**Resultado parcial: nueva Preview prebuilt creada y siete funciones registradas. QA remoto bloqueado por la red del ejecutor. No hay aprobación técnica final ni publicación productiva.** La autorización integral del propietario permanece vigente y se conserva en [AUTORIZACION-ALCANCE.md](AUTORIZACION-ALCANCE.md).

1. **Objetivo y alcance ejecutado.** Continuar corrección, QA y publicación condicionada de la eliminación de recorridos en 131 fichas. Se incorporó el HEAD remoto `75ffecc4d324874f151114ce9eb808aa4367f7fa` y se preservaron diagnóstico y preparación previos. Se completaron preparación y creación de la nueva Preview; los controles remotos y las etapas productivas siguen pendientes.

2. **Actividades completadas.**
   - La salida aislada documentada no existía en este ejecutor. Se ensambló nuevamente mediante `prepare-isolated.py`, sin generadores históricos, `main`, `vercel build` ni cambios de HTML/CSS.
   - Se verificaron 1.660 archivos y tamaños, inventario SHA-256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`, 66 cambios autorizados y 1.594 archivos preservados. Config v3, 1.602 estáticos y siete bundles con 57 archivos.
   - CLI oficial **65.14.0** instalada en caché de trabajo; ayuda y flags comprobados. El marcador de credencial del proxy era rechazado por la validación local de la CLI. Se estableció una sesión CLI normal mediante el acceso por dispositivo completado por el usuario, sin extraer secretos ni cambiar credenciales de proveedores. Se comprobaron cuenta, equipo y proyecto aislado.
   - Se ejecutó `vercel deploy --prebuilt --environment=preview` desde `/workspace/work/tour-release/preview`, con `VERCEL_ENV=preview`, proyecto/equipo confirmados y manifiesto verificado. No se usó `--prod`, `--temporary`, deploy ordinario de fuentes ni asignación de dominio productivo.
   - La API confirma **prebuilt=true**, fuentes bajo `src/.vercel/output/...` y siete entradas `type=lambda` bajo `out/api/...`. Las 1.660 fuentes coinciden por SHA-1 con el candidato. La CLI confirma destino **preview**; el campo `target` nulo de la API resumida no se interpreta como un entorno personalizado.
   - PR #27 actualizado con la Preview correctiva y los límites reales, manteniendo Draft. El runner de QA contempla cuatro anchos, controles de campos y navegación y bloquea mutaciones hacia el origen probado; no se ejecutó como si hubiera acceso remoto.

3. **Pendientes.** Completar HTTP en `/`, las 131 rutas originales, recursos, siete endpoints con métodos de rechazo y ausencia de fuentes internas expuestas. Completar **524 combinaciones** de ficha/ancho a 1440/768/390/320 px: galerías, planos, medios, mapas, navegación, formularios sin envío, WhatsApp, consola, huecos y superposiciones. Sólo después preparar Production sin dominios, verificar el mismo runtime, promover ese deployment Production y comprobar HTTP/HTTPS de ambos dominios. No promover la Preview como sustituto.

4. **Incidencias y bloqueos.** El acceso autenticado normal de `vercel curl` falla antes de llegar a la nueva URL: **CONNECT 403, HTTP 000**. El entorno observado permanece en revisión 1 y su allowlist efectiva no incluye el nuevo hostname ni `www.google.com`, pese a las confirmaciones del propietario sobre la aplicación de cambios. No se atribuye el fallo a SSO ni a las fichas. El control de permisos disponible no concedió un nuevo permiso de red; no hay herramienta de modificación de la configuración del entorno expuesta. Los metadatos de diagnóstico no contienen capturas retenidas; no se leyeron logs crudos.

   La revisión automática rechazó `vercel_web_fetch_vercel_url` porque crearía o reutilizaría un enlace temporal de hasta 23 horas que amplía acceso. No se creó ese enlace ni se eludió el rechazo. La vía segura pendiente es aplicar realmente el acceso del entorno a la Preview y usar la sesión CLI autenticada existente. No se guardaron tokens, cookies o códigos de login en Git.

5. **Archivos modificados.** `tests/qa-project-tour-removal.mjs` y documentación de esta etapa, el informe principal y `NEXT-PROMPT.md`. El runner incorpora 320 px, exige ruta real en modo remoto, permite estado autenticado privado y comprueba campos, controles y recursos sin envíos comerciales. No se modificó runtime, catálogo, precios, formularios del sitio, CRM 360, AI Lab, Resend, sitemap ni seguridad del proyecto. El prompt previo y las evidencias anteriores se conservan.

6. **Rama y commits.** Rama `codex/eliminar-recorridos-global-20261115`; PR base `codex/agenda-regions-responsive-20261115`, SHA `c2e1965ced736d46917a1bee286456cb937d58fe`. Runtime: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. Preparación documental previa: `7170f30aa56abef2001df2f74359a79f39e31dd2`; HEAD recibido: `75ffecc4d324874f151114ce9eb808aa4367f7fa`. Hito, pruebas y runner: `23de970853a2d2e1235cd9cf71addecefc7caa70`. El commit documental final se identifica en la entrega y el historial de este archivo.

7. **Pruebas y preservación.**

   | Control nuevo | Resultado |
   | --- | --- |
   | Hashes y tamaños de salida aislada | 1.660/1.660 correctos |
   | Delta runtime contra producción congelada | 66 cambios; 1.594 idénticos |
   | GET locales desde la salida recién ensamblada | 1.603 correctos; incluyen 131 fichas |
   | Protección local de rutas internas | 3 rutas no servidas |
   | Pruebas negativas de integridad | Byte alterado, archivo extra y config faltante rechazados |
   | Imports y rechazo temprano de handlers | 7 correctos; cero llamadas externas y envíos |
   | Registro efectivo en Vercel | 7 lambdas, destinos `/api/...`, READY |
   | Fuentes subidas del nuevo deployment | 1.660 hashes coincidentes |
   | Nuevos GET y QA responsive remotos | Bloqueados por proxy; 0/131 y 0/524 completados |

   Los siete endpoints registrados son advisory, booking-availability, booking-create, collaboration, contact, orientation-contact y uf. **Registro no equivale a ejecución remota verificada.** Las reservas conservan request-only. No se enviaron formularios, leads, reservas ni correos ni se hicieron operaciones CRM/Resend.

   La repetición de comprobaciones locales se justificó por tener que ensamblar la salida en un ejecutor donde no existía. El inventario resultante coincide con el ya certificado. No se repitieron las 393 comprobaciones responsive históricas ni se presentaron como QA remoto de la nueva Preview. No hay capturas remotas nuevas. La preservación de fotografías, planos, datos comerciales y SEO/GEO se mantiene por identidad de bytes; su funcionamiento remoto debe comprobarse todavía.

8. **PR y deployments.** [PR #27](https://github.com/lasopho/sollahms-web/pull/27) abierto y Draft, sin merge. Nueva Preview `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`, READY, prebuilt, sin dominios productivos asignados. SSO sigue `all_except_custom_domains`. La Preview defectuosa `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF` permanece como referencia histórica **NO APROBADA**.

   Producción y ambos aliases permanecen en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. **No se creó Production ni se promovió o publicó. Fecha/hora de publicación final: no corresponde.** No se atribuye a los dominios una verificación HTTP/HTTPS productiva nueva que no se ha ejecutado.

9. **URL.** [Nueva Preview privada prebuilt](https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/). El enlace normal conserva SSO; no contiene un token de compartición.

10. **Próxima acción.** Corregir la aplicación efectiva del acceso de red al ejecutor `ccarenv_b64_Y2NhcmVudl8yYWI2NTUyMWZlN2M4MTkxOWQ3MWI5OGExYmI0ZDQ3ZA`. Verificar una conexión nueva al hostname antes de reanudar QA. Reutilizar esta Preview y salida; no crear otra ni repetir preparación por el solo hecho de reanudar. La autorización integral de corrección y publicación condicionada sigue vigente, sin nuevas confirmaciones por etapa. Los controles pendientes impiden publicar ahora.

Evidencias: [recibo CLI](cli-preview-receipt.json), [registro y fuentes](registration-proof.json), [inventario local](verification.json), [preupload](preupload.json), [HTTP local](local-http.json), [handlers locales](functions-check.json), [protecciones](estado-protecciones.json), [bloqueo](BLOQUEO-ACCESO.json), [horas de Preview](preview-timing.json).
