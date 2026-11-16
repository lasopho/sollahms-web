# SOLLAHMS — etapa separada de publicación de Contacto conciliado

Continuar desde el candidato privado de Contacto conciliado con la producción del 16/11/2026. **Este documento no concede autorización productiva.** Ejecutar creación de Production o promoción únicamente si el propietario aporta autorización expresa aplicable a Contacto. La autorización de Recorridos no la sustituye. Sin esa autorización, conservar la Preview y presentar el estado preparado.

Repositorio: `lasopho/sollahms-web`.
Rama de integración: `codex/contacto-baseline-productivo-20261116`.
[PR #29 de integración](https://github.com/lasopho/sollahms-web/pull/29), abierto en Draft sobre la rama de #27, sin requerir su fusión.
Checkout independiente actual: `/private/tmp/sollahms-contacto-baseline-20261116`.
No tocar ni cambiar de rama los checkouts de Documents o `/Users/luissandoval/Projects/sollahms-publicacion`. Si desaparece el temporal, clonar la rama remota en otra copia independiente y conservar todos los commits posteriores.

Leer `AGENTS.md`, `NEXT-PROMPT.md` y el expediente `docs/contacto-baseline-20261116/`: `INFORME-CIERRE.md`, `CONCILIACION.md`, `PRESERVACION.md`, `candidate-manifest.json`, `preview-approval.json`, `qa/README.md` y `verification/README.md`.

## Identificadores que se deben volver a comprobar

- Baseline productivo conciliado: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.
- SHA de runtime declarado por ese deployment y verificado en GitHub/Vercel: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
- Aprobación QA histórica de Recorridos: `7ebad405d403f62306039b08193a58b35bef8bfc`; cierre documental: `98ba61d103059ab488cb85216c9bc95214aee82a`.
- Contacto aprobado: PR #26, `055787d9a1dadf35217080e46dbdae1c4ccfe78a`; PR #28, `967d556730e20ef86bae6ecee11ec6152434c8ae`.
- Commit de integración del HTML: `e95357fffa031dce3ac29a254b49c02e240a997f`; control de despliegue manual: `a1f2930475e23ebb87bac1f8443877b06883fe60`.
- Preview nueva: `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`, [Contacto privado](https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app/contacto.html).
- Inventario del candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.
- `static/contacto.html`: 18.655 bytes, SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`.

Consultar el HEAD remoto real y los PR antes de actuar. No confiar en los SHA erróneos de prompts históricos. Comprobar ambos aliases productivos: si ya no apuntan a ByUhr, detener el uso de este paquete y conciliar Contacto con el nuevo baseline sin revertir avances. Revisar otras tareas y evitar publicaciones simultáneas.

## Preservación y preparación

El paquete tiene 1.660 archivos: un cambio en Contacto y 1.659 idénticos a ByUhr, incluidas 147 páginas, siete bundles/57 archivos y config v3. Conserva las 131 fichas y los 66 cambios de eliminación de recorridos. No repetir generadores, eliminación, preparación histórica, 524 controles responsive ni suites certificadas sin una causa nueva.

Mantener el HTML aprobado, encabezado, cuerpo, cuatro campos, RUT, consentimiento, scripts, antiabuso, idempotencia, CRM 360, Resend, WhatsApp, SEO/GEO y enlaces legales. No incorporar la cobertura territorial de PR #25: es una rama hermana separada. No reutilizar el paquete antiguo de Contacto basado en `9zz`/`6bc`.

El output privado está en `.vercel/contacto-baseline-20261116/preview/.vercel/output`. Si falta, recuperar los mismos bytes por API autenticada del deployment Preview y verificar las 1.660 rutas, tamaños y SHA contra el manifiesto; el mecanismo documentado permite reutilizar archivos locales únicamente si sus hashes coinciden. No reconstruir desde `main` ni ejecutar el preparador antiguo.

Confirmar Node 24.22.3, Vercel CLI 65.16.0, `vercel whoami`, equipo `lsandoval2-8260s-projects`, proyecto `project-wrapp` (`prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`) y SSO existente. No cambiar dominios, credenciales, proveedores ni protecciones; no crear bypasses ni sharelinks.

## Secuencia posterior, solo con autorización expresa

1. Revisar el QA aprobado de esta Preview en 1440/1024/768/390/320 px y el cotejo remoto de fuentes. No usar una Preview histórica como evidencia del candidato.
2. Transferir idéntico el output certificado a un stage productivo separado. Verificar inventario y que sólo Contacto difiera de ByUhr.
3. Crear un único Production nativo **sin aliases**, con `vercel deploy --prebuilt --environment=production --skip-domain`, equipo/proyecto explícitos y metadatos del commit e inventario. No ejecutar un build para promover una Preview.
4. Verificar READY, target Production, fuentes, siete lambdas, configuración productiva, acceso SSO y HTTP/browser sobre ese nuevo ID. Usar métodos seguros y reservas request-only. No enviar formularios ni generar leads, correos o reservas; no afirmar entrega real de proveedores sin probarla.
5. Reconfirmar autorización, aliases, concurrencia y QA. Sólo entonces promover **ese mismo Production ya verificado**, sin reconstrucción. No promover directamente la Preview ni el paquete histórico obsoleto.
6. Comprobar públicamente Contacto, recursos, navegación, siete funciones con métodos seguros, integridad ajena a Contacto, TLS, redirects y Patio Brasil 410. Ante un fallo material, no dejar publicada una versión defectuosa y usar únicamente el mecanismo de recuperación autorizado.
7. Actualizar informe, hashes, evidencias, ID productivo, hora de asignación de dominios y `NEXT-PROMPT.md`.

No modificar PR #25. Mantener PR #26, #28 y #27 abiertos en Draft, sin fusiones automáticas. No fusionar #27 como requisito de publicación. Conservar su rama, historial y evidencias. El nuevo PR de integración también debe permanecer Draft mientras no exista una instrucción distinta del propietario.
