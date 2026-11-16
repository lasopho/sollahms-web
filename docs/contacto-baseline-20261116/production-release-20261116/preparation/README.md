# Verificación nueva y stage idéntico para publicar Contacto

**PASS — 16/11/2026.** Se verificó de nuevo el output local aprobado y, después del go-ahead del agente principal respaldado por el baseline vivo, se copiaron los mismos bytes a un stage aislado. Este subtask no creó ni promovió deployments.

- Verificación local: 10:32:57 America/Santiago.
- Preflight vivo del agente principal: 10:32:49, baseline `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.
- Stage copiado y verificado: 10:36:03.

Stage listo: `.vercel/contacto-production-release-20261116/stage/.vercel/output`.

## Integridad comprobada

Se leyeron los 1.660 archivos del output Preview existente y se compararon todas sus rutas, tamaños, SHA1 y SHA256 con el candidato aprobado. El inventario canónico se volvió a calcular sobre los bytes locales; después se repitió el cotejo sobre los bytes copiados al stage.

| Control | Resultado |
| --- | --- |
| Archivos / bytes | 1.660 / 219.244.937 |
| Inventario candidato y stage | `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0` |
| Contacto | 18.655 bytes; SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1` |
| Delta frente a ByUhr | Sólo `static/contacto.html`; 1.659 rutas idénticas |
| Funciones | 57 archivos idénticos, siete bundles y handlers válidos sin ejecutarlos |
| Config efectivo | v3, 3.916 bytes, mismo hash y `crons: []` |
| Páginas / fichas | 147 HTML; 131 fichas idénticas a ByUhr |
| Retiro de recorridos | Las 66 rutas conservan los hashes posteriores a la eliminación: 64 HTML y dos CSS |
| Versiones productivas conciliadas | Urban works model, comparador y urban-development JSON idénticos a ByUhr |

El stage conserva exactamente esos 1.660 archivos. No se agregó `builds.json` ni se regeneró ninguna página. Su `.vercel/project.json` sólo vincula `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` con `team_A9VNIW2f2K1IJpd2pGdvDmEN`, proyecto `project-wrapp`; no contiene secretos ni modifica settings remotos.

## Conteos con diferentes baselines

Los **1.594 archivos idénticos** corresponden a la intervención de Recorridos frente al Production histórico `9zz`: 66 cambios y 1.594 preservados de 1.660.

El candidato actual de Contacto se compara con **ByUhr**, que ya incorpora esos cambios: un archivo de Contacto cambia y los otros **1.659 permanecen idénticos**. Las 66 rutas de Recorridos forman parte de esa preservación. `numerical-context.json` conserva ambos conteos y su referencia; no se cambió ningún byte para forzar el número histórico.

## Autorización y secuencia

Se leyó `AGENTS.md` y todo el expediente exigido: NEXT-PROMPT, informe, conciliación, preservación, prompt de publicación, manifiesto, QA, API/HTTP y gate Preview. Sus banderas de Preview documentan la autorización anterior. El usuario aportó posteriormente una autorización expresa para la secuencia completa de publicación de Contacto, transmitida en el nuevo encargo del agente principal; los históricos permanecen intactos.

La primera fase de este subtask fue únicamente local. El recibo `local-artifact-summary.json` registra que entonces faltaba el preflight vivo. El agente principal lo completó y autorizó expresamente la copia después; `stage-receipt.json` fija el SHA256 de ese preflight y del recibo local, cerrando aquella precondición. `preparation-summary.json` resume ambas fases.

La creación productiva pertenece al guard del agente principal: debe utilizar el stage certificado y posteriormente verificar el nuevo Production aislado antes de promover ese mismo ID. Este paquete no ejecuta esas acciones ni afirma que el candidato esté publicado.

## Archivos y límites

`local-artifact-verification.json` conserva las comparaciones de las 1.660 rutas, funciones, 131 fichas, 66 cambios de Recorridos, tres versiones conciliadas y hashes de documentos leídos. `stage-inventory.json` fija el inventario copiado y `stage-receipt.json` su contexto y vinculación. Los dos scripts archivados son los utilizados en esta operación y no realizan red, builds, env pulls o despliegues.

No fue necesaria recuperación: todos los bytes existían y coincidían. No se repitieron las suites históricas, matrices responsive o pruebas de proveedores. No se modificó el output Preview original, el HTML raíz, otros checkouts, credenciales, protecciones o ajustes remotos. La única copia del artefacto fue el stage solicitado después de la confirmación del baseline vivo.

`manifest-sha256.json` cubre los archivos de este paquete salvo el propio manifiesto. No se incluyen cuerpos web, headers crudos, perfiles, credenciales o cachés de navegador. No se realizaron commits desde este subtask.
