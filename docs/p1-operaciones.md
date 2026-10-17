# Correcciones P1: trazabilidad y protección de integración

Lote OPS-01/OPS-02 de la auditoría integral del 16 de octubre de 2026. Referencia
Git auditada: `3866095784367c23bbe33ff0d79e3ed111caade0`. Este lote prepara evidencia
y una propuesta de configuración; ambos hallazgos conservan dependencias externas.
No cambia el sitio, el catálogo, Vercel, workflows ni controles de publicación.

## OPS-01 — Trazabilidad del artefacto público

La lectura de alias/deployment de Vercel del **17 de octubre de 2026,
03:17:34 UTC** conserva estos valores:

| Dato observado | Valor |
| --- | --- |
| Alias | `sollahms.cl` |
| Proyecto | `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` |
| Deployment | `dpl_9LvbrLDbZhho3Umm5Rmv6AMkauXE` |
| Estado, target y origen | `READY`, `production`, `cli` |
| Commit declarado | `f1e9bf1715cc99d095a367eba9028a9a1ad2b026` |
| Main remoto observado | `3866095784367c23bbe33ff0d79e3ed111caade0` |

El alias y el deployment siguen coincidiendo con la auditoría. Los metadatos
declaran un origen Git; no prueban los bytes que un paquete CLI sirvió ni que
el catálogo de esa fuente esté actualmente visible al público.

`scripts/production-traceability.py` genera un recibo y dos manifiestos de
objetos Git inmutables, con SHA-256, modos, tamaño, identidades de catálogo y
delta por ruta. No ejecuta código de esas revisiones, extrae paquetes, llama a
servicios o fabrica un build. Exige SHA completo, alias/proyecto/deployment
coherentes, target Production READY y salida nueva fuera de todos los worktrees
y del directorio Git. Filtra campos ajenos de los metadatos suministrados.

También registra los hashes de `vercel.json`, packager, preparación de release,
referencia de release y workflow público frente a la base. Expone cualquier
desviación; no la repara ni interpreta como permiso de publicación. Comprueba
por separado que el valor de `main` siga siendo `false`.

Uso exclusivamente local, con observaciones de lectura ya guardadas:

```bash
python scripts/production-traceability.py \
  --base 3866095784367c23bbe33ff0d79e3ed111caade0 \
  --metadata /ruta/fuera-del-repositorio/metadata-readonly.json \
  --output /ruta/fuera-del-repositorio/recibo-nuevo
```

La entrada JSON tiene `schemaVersion: 1`, `observedAt` con zona horaria y estos
objetos. `alias` contiene `hostname`, `deploymentId`, `projectId` y `url`;
`deployment` contiene `id`, `projectId`, `url`, `target`, `readyState`, `source`,
`repository`, `declaredCommitSha` y `declaredCommitRef`. `remoteMain` contiene
`sha` y `protected`. Los tres SHA son completos de 40 caracteres; la fuente
declarada y la base deben existir localmente. El operador debe registrar por
separado proveedor, operación y momento de lectura: el script no autentica
metadatos ni determina su vigencia. Nunca debe incluir credenciales.

La ejecución de este lote observó **144 identidades en la fuente Git declarada
y 134 en la base**. Hay **837 rutas distintas sin detección de renombres**,
equivalentes a los **834 cambios** de la auditoría con detección de renombres:
tres HTML se movieron a `docs/archive/leon/` conservando sus bytes. Es una
comparación de fuentes Git, no una afirmación sobre contenido servido.

**Estado: BLOQUEADO por acceso al artefacto servido y paquete privado autorizado.**
La política de red observada está `enforced`, modo restringido, y no incluye
`sollahms.cl` ni el hostname del deployment. No se hicieron peticiones HTTP ni
se crearon bypasses de protección. El recibo mantiene siempre
`artifactBytesVerified:false`; ni hashes iguales ni un exit code cero certifican
equivalencia de Production. El exit code cero sólo significa que se generó
evidencia correctamente.

Para cerrar OPS-01 faltan las lecturas HTTP/headers por rutas de sólo lectura y
la comparación con el inventario reproducible del paquete autorizado. Las APIs
con efectos comerciales se verifican únicamente con fixtures; esta herramienta
no solicita reservas ni envía comunicaciones. Una futura Preview o publicación
continúa sujeta a autorización separada.

## OPS-02 — Propuesta de protección de main

Las lecturas GitHub del mismo corte siguen mostrando `main.protected:false`,
sin checks obligatorios, y `rulesets:[]`. El CI existente permanece instalado.
Se verificó un check exitoso real `Git checkout regression`, de la integración
GitHub Actions **15368**, en `83a1fdc222d22cce251ddc91d83a10ec7a5343e5`.
Su existencia no lo convierte en requisito para integrar.

La propuesta revisable está en [main-ruleset.json](proposals/main-ruleset.json).
Se limita a `refs/heads/main` y propone:

- Pull Request con una aprobación vigente, aprobación independiente del último
  push y conversaciones resueltas; nuevas modificaciones invalidan aprobaciones.
- Check **Git checkout regression** emitido por GitHub Actions **15368** y rama
  actualizada respecto de main.
- Bloqueo de borrado y force push; ningún actor con bypass configurado.
- Ningún check Vercel exigido y ninguna modificación del flujo de despliegue.

Exige disponer de otra persona con permisos para aprobar el último push. Antes
de aplicarla, el administrador debe confirmar esa disponibilidad y compatibilidad
con el plan de GitHub y reglas heredadas. La propuesta conserva el CI público y
la separación entre integración y publicación; no convierte los 26 casos
privados pendientes en pruebas aprobadas ni requisitos imposibles del checkout.

**Estado: BLOQUEADO por aplicación administrativa externa.** La conexión GitHub
disponible permite lectura y trabajo de código/PR; no expone escritura de
protecciones/rulesets y la GitHub App excluye administración. No se aplicó la
propuesta ni se declara main protegido. Su aprobación documental tampoco prueba
que la protección esté activa.

La prueba offline usa el JSON propuesto para aceptar un PR con revisión/CI
vigentes y rechazar falta de PR, aprobación, aprobación posterior al último push,
actualización, resolución de hilos, check ausente/fallido o un emisor incorrecto.
Esto comprueba la intención de la propuesta; no valida el esquema contra GitHub
ni demuestra enforcement remoto.

Para cerrar OPS-02, un administrador debe aplicar las reglas autorizadas,
releer las reglas efectivas de main y verificar el rechazo de una integración
sin controles por un método autorizado que no modifique main. Si el servicio o
plan no admite la propuesta, debe ajustarse sobre evidencia antes de aplicarla.
Este lote no intenta un merge para comprobarla.

## Antes, después y validación

| Hallazgo | Antes | Después | Pendiente externo |
| --- | --- | --- | --- |
| OPS-01 | Metadatos y diff sin recibo reproducible de hashes | Herramienta offline, comparación reproducible y hashes de guards; fuente y base claramente identificadas | Bytes servidos, paquete privado y conciliación por rutas |
| OPS-02 | CI informativo, main sin protección | Propuesta concreta ligada al check observado y simulación offline | Aplicación administrativa y lectura de reglas efectivas |

`python -m unittest discover -s tests -p test_production_traceability.py -v`
aprueba **8 pruebas sintéticas**: diff real de dos commits, SHA-256, modificación
de guards visible, coherencia de identidades, rechazo de refs/SHA inválidos,
salidas seguras entre worktrees, filtrado de datos ajenos y simulación de reglas.
No se escribieron reglas remotas, main, Vercel, Calendar ni proveedores de correo.
Los **26 casos privados** conservan su estado pendiente.

Los recibos de lectura, manifiestos y logs de este lote se guardan fuera del
repositorio bajo `/workspace/sollahms-p1-2026-10-17/operaciones/`; no se incluyen
paquetes privados ni material de clientes en Git. La consolidación del lote P1
registra el CI público completo y los SHA finales de los commits.
