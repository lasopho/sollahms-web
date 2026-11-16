# SOLLAHMS — revisión final del Centro de Orientación y eventual publicación

Continúa la intervención del 16/11/2026. La auditoría, las correcciones y la Preview privada están completadas. Revisa el resultado y atiende comentarios nuevos dentro del alcance. La publicación productiva requiere autorización expresa posterior; este prompt por sí solo no autoriza crear Production, promover, asignar dominios ni fusionar ramas.

## Estado y documentos que debes comprobar

- Repositorio: `https://github.com/lasopho/sollahms-web`.
- Checkout independiente: `/private/tmp/sollahms-centro-audit-20261116`.
- Rama: `codex/centro-auditoria-integral-20261116`.
- [PR #30 en Draft](https://github.com/lasopho/sollahms-web/pull/30), base `codex/contacto-baseline-productivo-20261116`.
- HEAD de partida: `dffbd310fe0cb34d952bda493140504ec4e1241c`.
- Implementación: `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`. Los commits posteriores sólo añaden informes y continuidad. Consulta el HEAD remoto real y consérvalos.
- Preview READY: `dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS`.
- [URL privada](https://project-wrapp-9uq44evdh-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html).
- Production al cierre: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`, source `534bf362b8960e275f5b8b42b5c786027906a4cb`.
- Ambos dominios siguen en B9HL; www conserva 308 hacia `sollahms.cl`.
- `main` remoto de partida: `86e200ec191b38af355061e21bc0fc1e549cce3b`; es histórico y no sirve como base de reconstrucción.
- Vercel: proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, scope `lsandoval2-8260s-projects`.

Lee `AGENTS.md`, `NEXT-PROMPT.md` y, bajo `docs/centro-auditoria-20261116/`, `INFORME-AUDITORIA.md`, `INFORME-CIERRE.md`, `candidate-manifest.json`, `stage-receipt.json`, `source-preservation.json`, `preview/results.json`, `accessibility/results.json`, `diagnostics.json` y `remote-verification/verification-summary.json`.

## Cambios aprobados para revisar

1. Panel «Tu punto de partida» claro, con acento dorado y textos, resultados y CTA legibles. Se corrige la colisión con el fondo oscuro `.result-panel` del tema, sin modificar el recurso compartido.
2. Anterior/Siguiente originales preservados. El Siguiente deshabilitado final tenía contraste 1,19:1; ahora ambos controles deshabilitados alcanzan 5,87:1. No existía un botón literal «Anteriores» en presupuesto, que tiene un solo formulario.
3. Reinicio de presupuesto, cotizaciones y beneficios: restaura valores aprobados/resultados iniciales. Chrome termina su reinicio nativo antes de restaurar la UF oficial mediante requestAnimationFrame; no recupera escenarios manuales anteriores.
4. Respuestas UF tardías respetan cualquier edición manual, incluso si vuelve al mismo número. No se cambian matemáticas ni servicio UF.
5. Foco de etapas sin salto, fuentes locales corporativas, campos agrupados, rutas iniciales 2×2 y adaptación a 320 px.
6. Desvanecimiento compartido sólo en texto editorial. Formularios, controles, enlaces, navegación y resultados siempre estáticos; tema, helper y script compartido intactos.

## Certificados: no repetir por rutina

- **78 comprobaciones Chrome** sobre respuestas reales autenticadas de la Preview en 1440/1024/768/390/320 px. Seis etapas adelante/atrás/directas, estados extremos, conservación de datos/resultados, cálculos/reinicios, validaciones, checklist/descarga, menú, consentimiento y foco ejecutados. Cero overflow, errores JavaScript, recursos propios fallidos o envíos comerciales.
- **53/53 pruebas** de motores, orientación y UF con fixtures. El suite de orientación volvió a aprobar 18/18 tras el ajuste final del reinicio.
- **80 contrastes** en cinco anchos; mínimo 5,68:1. Snapshots ARIA y teclado. Revisión específica, no certificación WCAG completa.
- **35 grupos editoriales** del fade, sin controles en ellos, movimiento reducido e impresión comprobados.
- **15 anclas activadas**, consola, fuentes y fallback sin JavaScript. Herramientas dinámicas y menú móvil requieren JS; se conservan información, navegación de secciones y Contacto alternativo.
- **23 destinos locales** válidos, diez referencias externas con 200. CMF redirige por su cuenta de HTTPS a HTTP: nota externa registrada, URL aprobada preservada.
- **26/26 controles remotos**: 1.660/1.660 rutas/SHA1, siete funciones, SSO/TLS, aliases y ajustes. Un GET UF real devolvió referencia oficial vigente del 16/11/2026. Los tests UF del navegador son fixtures independientes.
- Capturas antes/después, resultados y páginas completas de los cinco anchos en esa carpeta. `attempts/` conserva errores iniciales corregidos; el certificado final es `preview/results.json`.

Repite sólo pruebas afectadas por cambios nuevos, discrepancias o un artefacto/deployment diferente. No asumas vigente una cifra UF antigua. Los beneficios conservan próxima revisión 30/11/2026 y suspensión automática posterior.

## Artefacto y límites

- Stage: `.vercel/centro-auditoria-20261116/stage/.vercel/output`.
- Candidato SHA256: `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`.
- Baseline B9HL: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.
- Tres rutas públicas cambiadas: `static/centro-orientacion.html`, `static/assets/css/orientacion.css`, `static/assets/js/orientacion.mjs`.
- Otros **1.657 archivos idénticos**: siete funciones/57 archivos, Contacto publicado, 131 fichas, recorridos eliminados, CRM 360, Resend, integraciones, fuentes, motores y config v3.
- `vercel.json` sólo añade nuestra rama:false a autodeploy; no forma parte del overlay público.

No ejecutar builders ni empaquetador histórico. No modificar fichas ni Contacto. No tocar ni cambiar ramas en `/Users/luissandoval/Documents/sollahms-web`, `/Users/luissandoval/Projects/sollahms-publicacion` ni el checkout certificado de Contacto. Mantener los demás PR intactos.

Si faltan temporales, clonar la rama real y recuperar los mismos bytes autenticados desde Preview/B9HL, comprobando el manifiesto completo. El helper `prepare-preview.py` verifica/copia el baseline local; no sustituye una recuperación por una reconstrucción histórica. No volver a ejecutar `create-preview.py`: ya hay una Preview y su recibo evita duplicados.

## Cómo continuar

1. Consultar Production real, ambos aliases y HEAD remoto de base/PR. Conciliar cualquier cambio posterior antes de proponer publicación; nunca sobrescribirlo con este baseline.
2. Presentar el candidato concreto y resolver sólo comentarios nuevos. Preservar textos aprobados, cálculos, vigencias, fuentes, metadatos, identidad y seguridad. Regenerar manifiestos y ejecutar únicamente regresiones justificadas.
3. Mantener PR #30 en Draft y sin merge mientras no exista instrucción de cambiarlo. Sin autorización productiva nueva, concluir la revisión dejando pendiente la publicación.
4. Con autorización expresa para publicar este candidato, registrar el permiso, revalidar hashes/estado remoto y preparar Production aislado desde los mismos bytes, sin asignar todavía dominios. Verificar ese nuevo deployment y sus siete funciones; promover sólo el artefacto comprobado conforme al permiso. No promover una Preview provocando una reconstrucción distinta.
5. Mantener SSO `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas y reglas manuales. No crear sharelinks/bypasses, cambiar secretos ni ampliar accesos para QA; usar autenticación existente.
6. Nunca enviar leads, correos, reservas o datos comerciales reales. Simulaciones locales sin guardar/transmitir escenarios; checklist con opt-in sólo para IDs. Mantener origen, timing, consentimiento, idempotencia y bloqueos de Preview del endpoint.
7. Actualizar cierre, hashes, documentación y NEXT-PROMPT con el estado observado. No reutilizar permisos anteriores de Contacto.

Resultado esperado: revisión final del candidato certificado y, sólo tras autorización nueva y expresa, publicación controlada que preserve Contacto, recorridos eliminados y cualquier cambio productivo posterior.
