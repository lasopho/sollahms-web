# Recuperación del baseline ByUhr para Contacto

**Recuperado el 16/11/2026 a las 09:39:16, America/Santiago, sin descargar cuerpos ni ejecutar un build.** Esta etapa prepara exclusivamente los bytes base para una futura Preview privada. No crea ni modifica Production.

Baseline: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`, runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. La API autenticada actual confirma READY, target Production, prebuilt, proyecto/equipo esperados, 1.660 direcciones de contenido y siete lambdas. No se utilizó una Preview histórica como fuente.

Salida local recuperada: `.vercel/contacto-baseline-20261116/baseline/output`.

- 1.660 archivos, 219.243.111 bytes; 1.602 estáticos, 57 archivos en siete bundles y `config.json` v3.
- Inventario canónico SHA256: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.
- 1.594 archivos se reutilizaron de `Projects/sollahms-publicacion/.vercel/recuperacion-originales-20261115/originales/production-source`; cada ruta se comprobó por tamaño, SHA1 y SHA256.
- Los otros 66 se recuperaron de las fuentes del checkout indicadas en el source-map ya versionado. También coinciden por tamaño, SHA1 y SHA256. Son bytes existentes, no páginas regeneradas.
- Cero blobs descargados, cero generadores/builds/env pulls/deployments y cero suites históricas repetidas. La copia final se cotejó de nuevo contra los 1.660 registros y el hash canónico.

La API del árbol no expone tamaños en sus registros actuales. Sus SHA1 y rutas coinciden íntegramente con el certificado. Los tamaños y SHA256 se comprobaron sobre cada secuencia de bytes local recuperada; no se afirman como tamaños obtenidos independientemente de la API.

## Contacto y funciones preservados

`static/contacto.html`: 16.829 bytes, SHA1 `69c2519a92d9a67e826bcbd580f3e67570eeb359`, SHA256 `5c16a5cff747b87b64d3a4bba49d4d0a0c6fc0fbf578bdb3d730e0c6dc209a69`.

Las siete funciones mantienen sus 57 archivos, handlers, runtime `nodejs24.x` y `environment: {}` de cada configuración. No se importaron ni ejecutaron handlers. `config.json` conserva las rutas y `crons: []`. No se tocó `contacto.html` de la raíz del checkout ni las páginas que ya retiraron los recorridos.

El SHA escrito en el encargo (`c97bfa5aba80329f9778b9f780d82e2c86720e0c3`) tiene 41 caracteres y no es un SHA-1 Git válido. El runtime de 40 caracteres indicado arriba está confirmado por la API de ByUhr y coincide con la documentación previa; [sha-identity.json](sha-identity.json) conserva la comprobación.

## Overlay mínimo posterior

1. Mantener este baseline intacto y copiarlo a la salida aislada de Preview que prepare el agente principal.
2. Tras conciliar el HTML aprobado de Contacto y sus dependencias, sustituir sólo `static/contacto.html` en esa copia.
3. Exigir exactamente 1.660 rutas y exactamente un delta permitido: Contacto, con sus hashes antes/después. Las otras 1.659 rutas deben seguir idénticas, incluidos config, los 57 archivos de funciones y todas las fichas/CSS que ya eliminaron recorridos.
4. Registrar el nuevo inventario del candidato y ejecutar únicamente el QA dependiente del cambio y del nuevo deployment privado. No reconstruir las fichas ni repetir por rutina los controles ya certificados.
5. El alcance actual no incluye Production, promoción, merge, cambios de secretos ni protecciones.

## Mecanismo y evidencia

`recover-by-uhr.py` es el script exacto usado. Lee el [certificado versionado](../../recorridos-eliminacion-20261115/local-qa-20261115/production/verification/expected.json) y el [mapa de fuentes documentado](../../recorridos-eliminacion-20261115/packaging-20261115/source-map.json). Consulta únicamente metadatos y árbol del deployment ByUhr mediante API GET autenticada; sólo si faltaran bytes locales válidos usaría GET `/v8/deployments/<ByUhr>/files/<SHA1>`. No lee archivos de credenciales ni imprime tokens. Cada proceso CLI tiene watchdog de 55 segundos y limpieza de su propio grupo mediante SIGTERM/SIGKILL, también si se interrumpe el runner.

Los JSON adjuntos contienen metadata permitida, rutas/hashes, inventario recuperado y procedencia de cada archivo. No contienen cuerpos de fuentes, variables de entorno, cookies, headers crudos, perfiles ni secretos. El script y sus reportes se conservan además en `.vercel/contacto-baseline-20261116/recovery`; la caché sólo se usa para blobs faltantes, y esta ejecución no necesitó ninguno.

`manifest-sha256.json` fija tamaño y SHA256 de los archivos de este paquete, salvo el propio manifiesto. No se ejecutaron nuevas pruebas ni se realizaron commits al archivarlo.
