# P2 — Reconciliación Ecasa y señales de diagnóstico

Lectura del 17 de octubre de 2026. Base propuesta P1:
`01b03931faefcd376023f3afdde99dad5a4f64c4`, cuyo árbol coincide con la propuesta
remota P1 revisada. Main observado continúa en
`3866095784367c23bbe33ff0d79e3ed111caade0`. Esta documentación no modifica PR,
configuración remota ni controles de publicación.

## OPS-03 — Delta real de PR #7

La nueva lectura de [PR #7](https://github.com/lasopho/sollahms-web/pull/7)
mantiene head `ed5b4cb2ad4d0a4b2887f8ba5522a379c0026841`, 11 commits y 221
archivos declarados, estado abierto y `mergeable:false`/`dirty`. Su base
histórica es `f66fbec15f1f4b30be3a70e94644a29212402a63`; no se cambió su rama,
descripción, estado ni historial. Se adquirió el commit sólo para leer objetos
Git inmutables, sin ejecutar código ni importar recursos de esa rama.

La comparación con P1 identifica **251 rutas distintas**. Esta cantidad compara
dos árboles completos actuales; los 221 archivos del PR comparan otra base y
no constituyen una contradicción. P1 tiene 134 proyectos (15 Ecasa y 119 de
otras inmobiliarias); el PR conserva 133 (15 y 118). No se reutilizan sus
conteos históricos para aceptar la propuesta actual.

| Alcance | Evidencia frente a P1 | Tratamiento |
| --- | --- | --- |
| Objetos Ecasa de catálogo, investigación y registro | 15/15 iguales en cada uno de los tres JSON | Ya presentes; ningún cambio comercial que recuperar |
| HTML Ecasa | 15/15 con los mismos bytes | Conservar las fichas actuales |
| Marco de tarjetas | Mismo 16:9, `object-fit:cover` y posición en main/P1/PR7 | Ya presente; no repetir la funcionalidad |
| Fichas de otras inmobiliarias | Las 119 de P1 conservan exactamente sus bytes en este lote | No sustituirlas por el árbol histórico |
| Owner covers, candidata pública y herramientas asociadas | Delta pendiente condicionado por recursos y autorización verificable | Inventariado; no trasladado a runtime |
| Recursos y controles de publicación de PR7 | Cambios históricos que requieren derechos, inputs privados o política propia | No importar, no cambiar guards ni simular autorización |

La candidata histórica declara una autorización del titular y referencias a
evidencia privada. El acceso a esos documentos y su alcance verificable sigue
pendiente en MED-001/SRC-002; su presencia como texto o digest en un commit no
permite recertificar derechos ni recuperar automáticamente sus 92 medios.
Tampoco se traslada el módulo que habilita una selección pública ni sus cambios
de packager/preparación. La lista de cambios técnicos autónomos pendientes
para integrar desde PR7 queda vacía: el resto requiere esos elementos externos.

**Resultado: reconciliación técnica completada; integración restante bloqueada
por recursos/derechos y alcance de publicación.** Los 117 paths relacionados
con Ecasa dentro del delta completo están clasificados en el comprobante
`ops03-reconciliation.json`, fuera del repositorio. No se generó un parche que
reintroduzca código o contenido ya integrado. Antes de cualquier continuación,
revalidar la base actual, seleccionar sólo el contenido pendiente autorizado,
conservar las 119 fichas ajenas y ejecutar CI en el SHA compuesto. Este informe
no cierra PR7 ni declara apto su merge.

## OPS-04 — Distinguir rechazo seguro de fallo funcional

La evidencia histórica de la auditoría corresponde al deployment
`dpl_A7dj5bbPZeHfXVdAyL1Wvsu9siqg`, origen Git, commit
`83a1fdc222d22cce251ddc91d83a10ec7a5343e5`, rama
`codex/cloud-development-diagnostics`. Su log devuelve
`Unexpected branch for this review build`. No se interpreta como una caída de
Production ni como un fallo del job independiente **Git checkout regression**.

La rama de diagnóstico no figura entre los valores `false` de
`git.deploymentEnabled` y tampoco está en la allowlist Preview del packager.
Por tanto un evento Git de esa rama puede iniciar un intento de build que el
packager rechaza. Desactivar un evento Git, aceptar un tipo de build y publicar
un artefacto son decisiones distintas; aprobar CI no las autoriza.

Se reprodujo localmente el rechazo con las mismas variables de rama/ambiente,
sin red ni servicios externos: exit code 1, mensaje esperado y ningún `dist`
creado. Se comprobaron por SHA-256 los bytes intactos de `vercel.json`,
packager, preparación de release, guarda León, referencia de release y workflow
público respecto de P1. La reproducción es una comprobación local; no es una
nueva observación ni ejecución de Vercel.

**Resultado: señal documentada y rechazo conservado.** Una política futura
puede proponer desactivar eventos Git de las ramas dedicadas exclusivamente a
diagnóstico, manteniendo su CI público; requiere revisión y autorización
separadas porque cambia controles de publicación. No se propone permitir todas
las ramas ni falsificar statuses exitosos. No se ejecutaron nuevos deployments,
Previews o promociones para comprobar este comportamiento.

## OPS-01 — Suplemento de trazabilidad

Continúa vigente [el procedimiento P1](p1-operaciones.md). El recibo offline
compara objetos Git y registra guards; mantiene `artifactBytesVerified:false`.
No confundir el SHA declarado por un deployment CLI con una comprobación del
contenido servido. La entrega P2 conserva observaciones remotas y recibos
fuera del repositorio, con su hora de lectura; un recibo generado hoy a partir
de metadatos anteriores no convierte esa observación en actual.

El cierre de OPS-01 sigue necesitando el paquete privado autorizado y evidencia
de bytes/headers del artefacto servido por rutas de sólo lectura. No se prueba
una API con efectos comerciales para obtener esa evidencia. OPS-02 permanece
pendiente de aplicación administrativa; este lote tampoco cambia protecciones.
