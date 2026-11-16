# SOLLAHMS — Contacto preparado y verificado en Preview privada

La conciliación de Contacto queda completada el **16/11/2026, America/Santiago**, con una Preview nueva sobre los bytes de producción ByUhr. La publicación productiva de Contacto es una etapa separada pendiente de autorización expresa; la autorización de Recorridos no se extiende a ella.

- [Contacto en Preview privada](https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app/contacto.html), deployment `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`, READY, creado a las 09:43:39 Santiago.
- [PR #29](https://github.com/lasopho/sollahms-web/pull/29), abierto en Draft. Rama `codex/contacto-baseline-productivo-20261116`, base documental de Recorridos `98ba61d103059ab488cb85216c9bc95214aee82a`.
- Commit del HTML integrado: `e95357fffa031dce3ac29a254b49c02e240a997f`; source commit declarado por la Preview: `a1f2930475e23ebb87bac1f8443877b06883fe60`. El HEAD documental final se obtiene con `git log -1 --format=%H -- NEXT-PROMPT.md`; comprobar también el HEAD remoto real y conservar avances posteriores.
- Producción se mantiene en `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`, con ambos aliases productivos. SHA declarado verificado en GitHub/Vercel: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. Los SHA discrepantes de prompts históricos no se utilizaron.

Leer `AGENTS.md`, [informe final](docs/contacto-baseline-20261116/INFORME-CIERRE.md), [conciliación](docs/contacto-baseline-20261116/CONCILIACION.md), [preservación](docs/contacto-baseline-20261116/PRESERVACION.md), [QA](docs/contacto-baseline-20261116/qa/README.md), [API/HTTP](docs/contacto-baseline-20261116/verification/README.md) y [gate](docs/contacto-baseline-20261116/preview-approval.json).

## Bytes y alcance preservados

El candidato conserva 1.660 archivos: **un único cambio en `static/contacto.html` y 1.659 idénticos** a ByUhr. Permanecen las 147 páginas, 131 fichas, 66 rutas de eliminación de recorridos, siete bundles/57 archivos y config v3. No se repitió la eliminación ni se ejecutaron builders o generadores. La recuperación reutilizó archivos existentes con tamaño/SHA1/SHA256 exactos, vinculados al árbol actual de ByUhr; cero cuerpos de fuentes descargados.

- Inventario base: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.
- Inventario candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.
- Contacto aprobado de `967d556730e20ef86bae6ecee11ec6152434c8ae`: 18.655 bytes, SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`.

Los cambios son el pie homologado de #26 y CSS del selector bajo 360 px de #28. Encabezado, cuerpo, formulario, cuatro campos comerciales, RUT, consentimiento, scripts, CRM 360/Resend, antiabuso, idempotencia, metadatos, JSON-LD/canonical, correo, WhatsApp y legales se conservan. La preservación de código no acredita una entrega real de proveedores: no hubo POST ni operaciones comerciales.

PR #26 (`055787d`), #28 (`967d556`) y #27 (`98ba61d`) siguen abiertos en Draft, sin merge. No modificarlos ni fusionar #27 como requisito de publicación. La rama `codex/contacto-cobertura-footer-20261115`, PR #25 (`f4249e9`), es hermana y propone cobertura territorial; no se integró ni modificó. El paquete histórico de Contacto basado en 9zz/6bc está obsoleto y podría restaurar recorridos.

`vercel.json` añade únicamente `false` para el despliegue automático de la nueva rama de integración; conserva los ajustes de las otras ramas. No altera el config efectivo ni los ajustes productivos del proyecto. [Manifiesto de archivos modificados](docs/contacto-baseline-20261116/modified-files.json).

## QA y límites

Contacto completó los cinco anchos **1440/1024/768/390/320**, con 15 capturas y revisión visual: pie, encabezado, selector completo/flecha a 320, navegación, campos, validaciones vacías, RUT inválido/válido, consentimiento y WhatsApp; sin overflow ni errores JavaScript de aplicación. Selección por teclado mediante letra y recorrido Tab/Shift+Tab real; no se afirma aprobación de ArrowDown/Home.

Las correcciones fueron del harness: suposición de teclas de selector y limpieza anticipada de RUT que movía el consentimiento durante el clic. Se conservaron los intentos. Un diagnóstico Enter produjo un evento DOM vacío rechazado por el cliente; hubo cero solicitudes comerciales. Las fases finales aceptadas no producen submit y limpian los datos sintéticos.

La preservación estática aprobó 20 controles. La Preview aprobó sus 1.660 rutas/SHA1, siete lambdas y 32/32 casos HTTP acotados. No repetir las matrices históricas de 524 controles/1.485 rutas ni las 202 pruebas funcionales por rutina: las otras 1.659 entradas siguen idénticas.

Los HTML medidos añaden solamente un sufijo de toolbar de Vercel de 163 bytes, firma exacta observada `8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc`, conservando íntegra la fuente. No aceptar ni eliminar del cotejo HTML arbitrario. Se distinguieron los bloqueos intencionales de toolbar de los errores de aplicación; no declarar cero avisos globales.

SSO continúa `all_except_custom_domains`; el GET anónimo confirma 302 a `vercel.com` y TLS válido. Node 24.22.3, CLI 65.16.0 e identidad autenticada comprobados. No se cambiaron credenciales, variables, proveedores, dominios o protecciones, ni se crearon bypasses/sharelinks. Una opción inválida de CLI se corrigió antes de crear la única Preview; no se creó Production.

## Trabajo local y próxima etapa

Trabajar exclusivamente en `/private/tmp/sollahms-contacto-baseline-20261116`. No tocar ni cambiar de rama `/Users/luissandoval/Documents/sollahms-web` o `/Users/luissandoval/Projects/sollahms-publicacion`. El checkout temporal anterior de Recorridos desapareció y no se usó como workspace compartido.

El output certificado está en `.vercel/contacto-baseline-20261116/preview/.vercel/output`; el baseline f98, en `.vercel/contacto-baseline-20261116/baseline/output`. Si desaparecen estos temporales, clonar la rama remota en otro checkout y recuperar los mismos bytes por la API autenticada de fuentes del deployment Preview, verificando el manifiesto completo. No reconstruir desde main ni reutilizar el antiguo preparador. No volver a ejecutar `create-preview.py` o crear otra Preview si no existe una necesidad nueva.

La próxima etapa está descrita en el [prompt completo de publicación](docs/contacto-baseline-20261116/SIGUIENTE-PROMPT-PUBLICACION.md). Requiere autorización expresa aplicable a Contacto y una nueva comprobación de aliases/concurrencia. Si producción ya cambió de ByUhr, conciliar de nuevo antes de usar este paquete para evitar reversiones. Una futura publicación debe preparar un Production separado sin aliases y promover únicamente ese mismo ID después de verificarlo, sin reconstruir.

La [continuidad anterior de Recorridos](docs/contacto-baseline-20261116/NEXT-PROMPT-recorridos-anterior.txt) y sus evidencias permanecen preservadas. Si se retoma sin un encargo nuevo, informar que Contacto está preparado en Preview y mantener este estado; no publicar automáticamente.
