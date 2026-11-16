# QA suplementario final — eliminación de recorridos

Preview: `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`. **131/131 fichas y 524/524 parejas de composición aprobadas**. Sin cambios de aplicación ni deployments durante estas pruebas.

No se enviaron formularios. No hay vídeos publicados. Las siete referencias internas de YouTube siguen conservadas; no se incorporaron al sitio ni se atribuyó una reproducción inexistente.

## Resultados

- [Interacciones finales](reports/supplement-results.json) y [resumen](reports/supplement-summary.json): a 1440 px, 730 clics de navegación, 262 modalidades, 262 rechazos de formularios vacíos y 262 acciones de intención. Se abrieron/decodificaron 395 planos originales y 155 originales de galería. Siete comparadores abrieron dos láminas y se cerraron/restauraron; Plaza de Lourdes conserva correctamente su comparación deshabilitada con una sola lámina.
- [Encabezado, pie y consola](reports/header-footer-results.json), con [resumen](reports/header-footer-summary.json): 524 parejas `(slug,width)` a 1440/768/390/320 px y 18 pruebas de menú móvil. Incluyen límites, solapamientos, enlaces frente al HTML certificado, destinos internos y logotipos.
- [Inventario certificado](reports/source-media-inventory.json): 131 HTML, 119 mapas, 131 formularios, cero recorridos y cero vídeos publicados. El renderizado de mapas y responsive principal pertenecen a core; esta composición los aísla. El suplemento de interacciones permitió mapas normales para observar consola.

Sin errores de aplicación ni consola desconocida. Cada pasada final conserva 116 advertencias conocidas `allow`/`allowfullscreen`, documentadas en [W3C §6.3.1](https://www.w3.org/TR/permissions-policy/#iframe-allowfullscreen-attribute) y en la [justificación](reports/fullscreen-warning-primary-source.json). No se afirma «cero advertencias». Los 131 errores del toolbar bloqueado se clasifican por separado. La telemetría permanece bloqueada; cualquier solicitud comercial inesperada sigue siendo un fallo. La [captura sanitizada](reports/privacy-validation.json) omite credenciales, queries, fragments, cuerpos, cabeceras y argumentos serializados.

## Evidencia y reproducción

[Historial clasificado](history/attempt-classification.json), [raw anterior al triage](history/header-footer-raw-before-console-triage.json), [captura centrada](evidence/comparison-centered.png) y [clics reales](evidence/comparison-debug.json) conservan los problemas de harness resueltos. Las filas posteriores al cierre del navegador no cuentan como controles. Se repitieron únicamente pendientes; no se forzó `checked` mediante JavaScript.

Los [scripts](scripts/) son snapshots exactos con las rutas absolutas del Mac y el ID de esta Preview. Requieren Node 24.22.3, Chrome, Playwright Core instalado y la sesión CLI autorizada/vinculada a `project-wrapp`. Para reproducir, recuperar la salida certificada por el mecanismo del informe principal, sin regenerar las 1.660 entradas. Restituir o adaptar copias aisladas de `/private/tmp/sollahms-recorridos-{qa,recovery,supplement}` con los helpers de `scripts/`, [inputs](inputs/) y el inventario de `reports/`. No reutilizar este ID/caché para certificar Production.

```sh
QA_RESUME=1 QA_WORKERS=1 node scripts/qa-supplement.mjs
QA_RESUME=1 node scripts/qa-header-footer.mjs
```

Ambos runners guardan checkpoints y cierran navegador/transporte; `STOP` o `SIGINT`/`SIGTERM` permiten detenerlos. No se archivaron cachés, perfiles, `node_modules`, sesiones ni cabeceras privadas. No se ejecutó QA al empaquetar.

[Copias exactas](copied-artifacts.json) y [manifest SHA256](manifest-sha256.json) permiten revisar el paquete. Los dos manifiestos se excluyen de sus propios hashes.

```sh
shasum -a 256 -c SHA256SUMS
```
